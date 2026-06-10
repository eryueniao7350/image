"""
Daily Report Generator — runs in GitHub Actions or locally.
Queries Supabase for new skills (last 48h) + high momentum projects,
outputs a markdown report to backend/output/.
"""

import os
import json
import datetime
from pathlib import Path

# Try psycopg2 first (CI), fall back to httpx+Supabase REST
try:
    import sqlalchemy
    from sqlalchemy import text
    HAS_DB = True
except ImportError:
    HAS_DB = False

SUPABASE_URL = "https://cfsrpjiemaubjjigmhgm.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbnp6ZWNtenNmbW9oZ2xwZmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MDQ3MzIsImV4cCI6MjA4ODM4MDczMn0.zFAGZH-lDcL-GwyMkR-9sSV8pJToVzomsJ_fuXZIoDo"
SITE_URL = os.getenv("SITE_URL", "https://image-chi-kohl.vercel.app")


def parse_datetime(value):
    """Parse ISO-ish timestamps into timezone-aware datetimes when possible."""
    if not value:
        return None
    if isinstance(value, datetime.datetime):
        return value if value.tzinfo else value.replace(tzinfo=datetime.timezone.utc)
    try:
        parsed = datetime.datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=datetime.timezone.utc)


def filter_and_rank_skills(skills: list, cutoff_dt: datetime.datetime) -> list:
    """Keep recent skills and rank them consistently with the DB query."""
    recent = []
    for skill in skills:
        first_seen = parse_datetime(skill.get("first_seen"))
        if not first_seen or first_seen < cutoff_dt:
            continue
        if (skill.get("stars") or 0) < 20:
            continue
        recent.append(skill)

    recent.sort(
        key=lambda s: (
            s.get("star_momentum") is None,
            -(s.get("star_momentum") or 0),
            -(s.get("stars") or 0),
        )
    )
    return recent[:50]


def fetch_via_rest(cutoff_iso: str):
    """Fetch new skills via Supabase REST API."""
    import httpx

    headers = {"apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {SUPABASE_ANON_KEY}"}
    base = f"{SUPABASE_URL}/rest/v1/skills"
    cutoff_dt = parse_datetime(cutoff_iso)

    # Preferred query: ask Supabase to filter and sort on the server.
    params = {
        "select": "repo_full_name,repo_name,author_name,description,stars,prev_stars,category,score,quality_score,first_seen,created_at,star_momentum",
        "first_seen": f"gte.{cutoff_iso}",
        "stars": "gte.20",
        "order": "star_momentum.desc.nullslast,stars.desc",
        "limit": "50",
    }
    try:
        resp = httpx.get(base, headers=headers, params=params, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except httpx.HTTPStatusError as exc:
        body = exc.response.text[:300]
        print(f"Primary REST query failed ({exc.response.status_code}): {body}")
        if exc.response.status_code != 500 or "statement timeout" not in body:
            raise
        print("Falling back to recent indexed rows and ranking locally")

    # Fallback: pull recent inserts by primary key, then filter/sort locally.
    fallback_params = {
        "select": "id,repo_full_name,repo_name,author_name,description,stars,prev_stars,category,score,quality_score,first_seen,created_at,star_momentum",
        "stars": "gte.20",
        "order": "id.desc",
        "limit": "200",
    }
    resp = httpx.get(base, headers=headers, params=fallback_params, timeout=30)
    resp.raise_for_status()
    return filter_and_rank_skills(resp.json(), cutoff_dt)


def fetch_via_db(cutoff_iso: str):
    """Fetch new skills via direct DB connection."""
    db_url = os.environ["SUPABASE_DB_URL"]
    engine = sqlalchemy.create_engine(db_url)
    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT repo_full_name, repo_name, author_name, description,
                   stars, prev_stars, category, score, quality_score,
                   first_seen, created_at, star_momentum
            FROM skills
            WHERE first_seen >= :cutoff AND stars >= 20
            ORDER BY star_momentum DESC NULLS LAST, stars DESC
            LIMIT 50
        """), {"cutoff": cutoff_iso}).fetchall()
    return [dict(r._mapping) for r in rows]


def generate_report(skills: list, today: str) -> str:
    """Generate markdown daily report."""
    lines = [
        f"## 🔥 今日新鲜 Skills 精选 Top 10（{today}）",
        "",
        "由 image-chi-kohl.vercel.app 整理！",
        "",
    ]

    emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]
    top10 = skills[:10]

    for i, s in enumerate(top10):
        name = s.get("repo_full_name", "")
        repo = s.get("repo_name", "")
        desc = (s.get("description") or "")[:80]
        stars = s.get("stars", 0)
        prev = s.get("prev_stars", 0) or 0
        gain = stars - prev
        created = s.get("created_at", "")
        created_dt = parse_datetime(created)
        if created_dt:
            created = created_dt.isoformat()

        # Mark truly new projects (created < 2 weeks ago)
        is_new = False
        if created_dt and (datetime.datetime.now(datetime.timezone.utc) - created_dt).days <= 14:
            is_new = True

        new_badge = "🆕 " if is_new else ""
        gain_str = f"+{gain}" if gain > 0 else str(gain)

        lines.append(f"{emojis[i]} {new_badge}{name}")
        lines.append(f"⭐ {stars:,} | {gain_str}")
        lines.append(f"{desc}")
        lines.append(f"🔗 github.com/{name}")
        lines.append(f"📊 {SITE_URL}/skill/{name}/")
        lines.append("")

    return "\n".join(lines)


def main():
    today = datetime.date.today()
    today_str = today.strftime("%m月%d日")
    cutoff = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=48)).isoformat()

    print(f"Generating daily report for {today}")
    print(f"Cutoff: {cutoff}")

    if HAS_DB and os.getenv("SUPABASE_DB_URL"):
        print("Using direct DB connection")
        skills = fetch_via_db(cutoff)
    else:
        print("Using Supabase REST API")
        skills = fetch_via_rest(cutoff)

    print(f"Found {len(skills)} candidate skills")

    if not skills:
        print("No new skills found, skipping report generation")
        return

    report = generate_report(skills, today_str)

    # Output to file
    output_dir = Path("output")
    output_dir.mkdir(exist_ok=True)
    filename = f"daily-report-{today.isoformat()}.md"
    filepath = output_dir / filename
    filepath.write_text(report, encoding="utf-8")
    print(f"Report saved to {filepath}")
    print("---")
    print(report)


if __name__ == "__main__":
    main()
