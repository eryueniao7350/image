#!/usr/bin/env python3
"""Sync selected AIHOT items into Feishu Base without lark-cli keychain access."""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable
from urllib import error, parse, request
from zoneinfo import ZoneInfo


UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)
AIHOT_ITEMS_URL = "https://aihot.virxact.com/api/public/items"
FEISHU_API_BASE = "https://open.feishu.cn/open-apis"
LOCAL_TZ = ZoneInfo("Asia/Shanghai")


CATEGORY_LABELS = {
    "ai-models": "模型发布/更新",
    "ai-products": "产品发布/更新",
    "industry": "行业动态",
    "paper": "论文研究",
    "tip": "技巧与观点",
}

CATEGORY_TAGS = {
    "ai-models": "模型发布",
    "ai-products": "产品发布",
    "industry": "行业动态",
    "paper": "论文研究",
    "tip": "技巧观点",
}

SOURCE_TAG_KEYWORDS = {
    "openai": "OpenAI",
    "anthropic": "Anthropic",
    "google": "Google",
    "阿里": "阿里",
}


def now_local() -> datetime:
    return datetime.now(tz=LOCAL_TZ)


def load_env_files() -> None:
    """Best-effort dotenv loading for local/manual runs."""
    for rel_path in (".env", ".env.local", "backend/.env", "backend/.env.local"):
        path = Path(rel_path)
        if not path.is_file():
            continue
        for raw_line in path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip("'").strip('"'))


def require_env(name: str, default: str | None = None) -> str:
    value = os.getenv(name, default)
    if value is None or value == "":
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def chunks(items: list[dict[str, Any]], size: int) -> Iterable[list[dict[str, Any]]]:
    for idx in range(0, len(items), size):
        yield items[idx : idx + size]


def iso_to_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def dt_to_ms(value: datetime) -> int:
    return int(value.timestamp() * 1000)


def local_midnight_ms(value: datetime) -> int:
    local_value = value.astimezone(LOCAL_TZ)
    midnight = local_value.replace(hour=0, minute=0, second=0, microsecond=0)
    return dt_to_ms(midnight)


def short_text(value: str, limit: int) -> str:
    text = " ".join(value.split())
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + "…"


def category_label(slug: str | None) -> str:
    if not slug:
        return "未分类"
    return CATEGORY_LABELS.get(slug, slug)


def category_value(slug: str | None) -> str:
    return slug if slug in CATEGORY_LABELS else "other"


def build_recommendation(item: dict[str, Any]) -> str:
    summary = short_text(item.get("summary") or item.get("title") or "", 90)
    label = category_label(item.get("category"))
    source = item.get("source") or "未知来源"
    return short_text(f"{source} 的{label}内容，适合作为素材：{summary}", 120)


def build_tags(item: dict[str, Any]) -> list[str]:
    tags: list[str] = []
    category = CATEGORY_TAGS.get(item.get("category"))
    if category:
        tags.append(category)

    searchable = " ".join(
        str(item.get(key) or "")
        for key in ("title", "summary", "source")
    ).lower()
    for keyword, tag in SOURCE_TAG_KEYWORDS.items():
        if keyword in searchable and tag not in tags:
            tags.append(tag)

    if tags:
        tags.append("可跟进")
    return tags[:3]


def http_json(
    method: str,
    url: str,
    *,
    headers: dict[str, str] | None = None,
    payload: dict[str, Any] | None = None,
    timeout: int = 30,
) -> dict[str, Any]:
    body = None
    merged_headers = {"Accept": "application/json", **(headers or {})}
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        merged_headers["Content-Type"] = "application/json; charset=utf-8"

    req = request.Request(url, data=body, headers=merged_headers, method=method.upper())
    try:
        with request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method} {url} failed with HTTP {exc.code}: {detail}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"{method} {url} failed: {exc.reason}") from exc

    if not raw:
        return {}

    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"{method} {url} returned non-JSON body: {raw[:200]}") from exc


@dataclass
class SyncConfig:
    base_token: str
    app_id: str
    app_secret: str
    aihot_table_id: str
    daily_table_id: str
    tasks_table_id: str
    task_record_id: str | None
    task_record_name: str
    task_name_fields: list[str]
    hours: int
    take: int
    dry_run: bool
    log_dir: Path


class FeishuBitableClient:
    def __init__(self, app_id: str, app_secret: str, base_token: str) -> None:
        self.app_id = app_id
        self.app_secret = app_secret
        self.base_token = base_token
        self._tenant_access_token: str | None = None

    def _token(self) -> str:
        if self._tenant_access_token:
            return self._tenant_access_token
        data = http_json(
            "POST",
            f"{FEISHU_API_BASE}/auth/v3/tenant_access_token/internal",
            payload={"app_id": self.app_id, "app_secret": self.app_secret},
        )
        if data.get("code") not in (0, None):
            raise RuntimeError(f"Feishu auth failed: {data}")
        token = data.get("tenant_access_token")
        if not token:
            raise RuntimeError(f"Feishu auth returned no tenant_access_token: {data}")
        self._tenant_access_token = token
        return token

    def request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        query = f"?{parse.urlencode(params, doseq=True)}" if params else ""
        data = http_json(
            method,
            f"{FEISHU_API_BASE}{path}{query}",
            headers={"Authorization": f"Bearer {self._token()}"},
            payload=payload,
        )
        if data.get("code") not in (0, None):
            raise RuntimeError(f"Feishu API error for {path}: {data}")
        return data

    def list_records(self, table_id: str) -> list[dict[str, Any]]:
        records: list[dict[str, Any]] = []
        page_token: str | None = None
        while True:
            params: dict[str, Any] = {"page_size": 500}
            if page_token:
                params["page_token"] = page_token
            data = self.request(
                "GET",
                f"/bitable/v1/apps/{self.base_token}/tables/{table_id}/records",
                params=params,
            )
            payload = data.get("data", {})
            records.extend(payload.get("items", []))
            if not payload.get("has_more"):
                break
            page_token = payload.get("page_token")
            if not page_token:
                break
        return records

    def batch_create_records(self, table_id: str, records: list[dict[str, Any]]) -> int:
        created = 0
        for chunk in chunks(records, 500):
            data = self.request(
                "POST",
                f"/bitable/v1/apps/{self.base_token}/tables/{table_id}/records/batch_create",
                payload={"records": [{"fields": item} for item in chunk]},
            )
            created += len(data.get("data", {}).get("records", []))
        return created

    def update_record(self, table_id: str, record_id: str, fields: dict[str, Any]) -> None:
        self.request(
            "PUT",
            f"/bitable/v1/apps/{self.base_token}/tables/{table_id}/records/{record_id}",
            payload={"fields": fields},
        )


def fetch_aihot_items(hours: int, take: int) -> list[dict[str, Any]]:
    since = (datetime.now(timezone.utc) - timedelta(hours=hours)).replace(microsecond=0)
    params = {
        "mode": "selected",
        "since": since.isoformat().replace("+00:00", "Z"),
        "take": take,
    }
    url = f"{AIHOT_ITEMS_URL}?{parse.urlencode(params)}"
    data = http_json("GET", url, headers={"User-Agent": UA})
    items = data.get("items", [])
    if not isinstance(items, list):
        raise RuntimeError(f"Unexpected AIHOT payload: {data}")
    return items


def build_aihot_record(item: dict[str, Any], batch_id: str, synced_at: datetime) -> dict[str, Any]:
    published_at = iso_to_dt(item.get("publishedAt"))
    recommendation = build_recommendation(item)
    record: dict[str, Any] = {
        "AIHOT 条目 ID": item["id"],
        "标题": item["title"],
        "原文链接": item["url"],
        "来源": item["source"],
        "分类": category_value(item.get("category")),
        "摘要": item.get("summary") or "",
        "推荐理由": recommendation,
        "是否精选": True,
        "同步批次": batch_id,
        "入库时间": dt_to_ms(synced_at),
    }
    if published_at:
        record["发布时间"] = dt_to_ms(published_at)
    return record


def build_daily_pool_record(item: dict[str, Any], synced_at: datetime) -> dict[str, Any]:
    published_at = iso_to_dt(item.get("publishedAt")) or synced_at.astimezone(timezone.utc)
    record: dict[str, Any] = {
        "日期": local_midnight_ms(published_at),
        "来源": "AIHOT",
        "标题": item["title"],
        "链接": item["url"],
        "摘要": item.get("summary") or "",
        "分类": category_value(item.get("category")),
        "标签": build_tags(item),
        "AIHOT 推荐理由": build_recommendation(item),
        "是否进入选题池": False,
        "入库时间": dt_to_ms(synced_at),
    }
    if item.get("source"):
        record["来源"] = item["source"]
    if published_at:
        record["发布时间"] = dt_to_ms(published_at)
    return record


def resolve_task_record_id(
    client: FeishuBitableClient,
    table_id: str,
    configured_record_id: str | None,
    record_name: str,
    name_fields: list[str],
) -> str | None:
    if configured_record_id:
        return configured_record_id

    for record in client.list_records(table_id):
        fields = record.get("fields", {})
        for field_name in name_fields:
            if fields.get(field_name) == record_name:
                return record.get("record_id")
    return None


def append_line(log_file: Path, line: str) -> None:
    log_file.parent.mkdir(parents=True, exist_ok=True)
    with log_file.open("a", encoding="utf-8") as handle:
        handle.write(line.rstrip() + "\n")


def github_run_url() -> str | None:
    server = os.getenv("GITHUB_SERVER_URL")
    repo = os.getenv("GITHUB_REPOSITORY")
    run_id = os.getenv("GITHUB_RUN_ID")
    if server and repo and run_id:
        return f"{server}/{repo}/actions/runs/{run_id}"
    return None


def write_markdown_log(
    log_path: Path,
    *,
    status: str,
    hours: int,
    synced_at: datetime,
    fetched_count: int,
    created_aihot: int,
    created_daily: int,
    message: str,
    error: str | None,
) -> None:
    lines = [
        f"# AIHOT sync attempt - {synced_at.isoformat()}",
        "",
        f"- Status: {status}",
        f"- Window: past {hours} hours",
        f"- Fetched items: {fetched_count}",
        f"- New rows in 02 AIHOT 精选入库: {created_aihot}",
        f"- New rows in 01 每日素材池: {created_daily}",
        f"- Summary: {message}",
    ]
    if error:
        lines.extend(["", "## Error", "", error])
    log_path.parent.mkdir(parents=True, exist_ok=True)
    log_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hours", type=int, default=int(os.getenv("AIHOT_SYNC_HOURS", "4")))
    parser.add_argument("--take", type=int, default=int(os.getenv("AIHOT_SYNC_TAKE", "100")))
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--log-dir", default=os.getenv("AIHOT_SYNC_LOG_DIR", "ops/logs"))
    return parser.parse_args()


def build_config(args: argparse.Namespace) -> SyncConfig:
    return SyncConfig(
        base_token=require_env("FEISHU_BASE_TOKEN", "GZK8bDUSTa30zDsHHmUcO0KqnFd"),
        app_id=require_env("FEISHU_APP_ID"),
        app_secret=require_env("FEISHU_APP_SECRET"),
        aihot_table_id=require_env("FEISHU_AIHOT_TABLE_ID", "tbld4Lf3YTJaTqlr"),
        daily_table_id=require_env("FEISHU_DAILY_POOL_TABLE_ID", "tblQeL9M0WcfwKBt"),
        tasks_table_id=require_env("FEISHU_TASKS_TABLE_ID", "tblIBUAJcbQxZhlv"),
        task_record_id=os.getenv("FEISHU_AIHOT_TASK_RECORD_ID") or None,
        task_record_name=os.getenv("FEISHU_AIHOT_TASK_NAME", "每 4 小时同步一次 AIHOT 精选素材"),
        task_name_fields=[
            part.strip()
            for part in os.getenv("FEISHU_TASK_NAME_FIELDS", "任务名称,名称,标题").split(",")
            if part.strip()
        ],
        hours=args.hours,
        take=args.take,
        dry_run=args.dry_run,
        log_dir=Path(args.log_dir),
    )


def main() -> int:
    load_env_files()
    args = parse_args()
    config = build_config(args)

    synced_at = now_local()
    batch_id = f"aihot-sync-{synced_at.strftime('%Y%m%dT%H%M%S%z')}"
    detail_log = config.log_dir / f"aihot_sync_{synced_at.strftime('%Y-%m-%dT%H%M%S%z')}.md"
    summary_log = config.log_dir / "aihot_sync.log"
    run_url = github_run_url()

    client: FeishuBitableClient | None = None
    task_record_id: str | None = None
    fetched_count = 0
    created_aihot = 0
    created_daily = 0
    status = "blocked"
    message = ""
    error_message: str | None = None

    try:
        items = fetch_aihot_items(config.hours, config.take)
        fetched_count = len(items)
        client = FeishuBitableClient(config.app_id, config.app_secret, config.base_token)
        existing_records = client.list_records(config.aihot_table_id)
        existing_ids = {
            (record.get("fields", {}).get("AIHOT 条目 ID") or "").strip()
            for record in existing_records
            if record.get("fields", {}).get("AIHOT 条目 ID")
        }

        new_items = [item for item in items if item.get("id") and item["id"] not in existing_ids]
        aihot_records = [build_aihot_record(item, batch_id, synced_at) for item in new_items]
        daily_records = [build_daily_pool_record(item, synced_at) for item in new_items]

        if config.dry_run:
            status = "dry-run"
            message = (
                f"Fetched {fetched_count} items; {len(new_items)} would be inserted into both tables."
            )
        else:
            if aihot_records:
                created_aihot = client.batch_create_records(config.aihot_table_id, aihot_records)
                created_daily = client.batch_create_records(config.daily_table_id, daily_records)
            status = "success"
            message = (
                f"Fetched {fetched_count} AIHOT items and added {created_aihot} new rows "
                f"to 02 AIHOT 精选入库 and {created_daily} new rows to 01 每日素材池."
            )
    except Exception as exc:  # noqa: BLE001
        error_message = str(exc)
        message = error_message
    finally:
        write_markdown_log(
            detail_log,
            status=status,
            hours=config.hours,
            synced_at=synced_at,
            fetched_count=fetched_count,
            created_aihot=created_aihot,
            created_daily=created_daily,
            message=message or "No summary available.",
            error=error_message,
        )

        summary_line = (
            f"{synced_at.strftime('%Y-%m-%d %H:%M:%S %Z')} | AIHOT 精选同步 | {status} | "
            f"{message or 'No summary available.'}"
        )
        append_line(summary_log, summary_line)

        if client and not env_bool("AIHOT_SYNC_SKIP_TASK_UPDATE", False):
            try:
                task_record_id = resolve_task_record_id(
                    client,
                    config.tasks_table_id,
                    config.task_record_id,
                    config.task_record_name,
                    config.task_name_fields,
                )
                if task_record_id:
                    log_note = run_url or str(detail_log.resolve())
                    task_fields = {
                        "运行状态": "正常" if status in {"success", "dry-run"} else "异常",
                        "错误信息": short_text(message or "No summary available.", 1000),
                        "最近运行时间": dt_to_ms(synced_at),
                        "日志路径": short_text(
                            f"ops/logs/aihot_sync.log；详情：{log_note}",
                            1000,
                        ),
                    }
                    if not config.dry_run:
                        client.update_record(config.tasks_table_id, task_record_id, task_fields)
                else:
                    append_line(
                        summary_log,
                        (
                            f"{synced_at.strftime('%Y-%m-%d %H:%M:%S %Z')} | AIHOT 精选同步 | "
                            "task-update-skipped | Task record not found."
                        ),
                    )
            except Exception as exc:  # noqa: BLE001
                append_line(
                    summary_log,
                    (
                        f"{synced_at.strftime('%Y-%m-%d %H:%M:%S %Z')} | AIHOT 精选同步 | "
                        f"task-update-failed | {exc}"
                    ),
                )

    print(message or "No summary available.")
    return 0 if status in {"success", "dry-run"} else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(1) from exc
