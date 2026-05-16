import sys
import unittest
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).parent))

from aihot_sync import build_aihot_record, build_daily_pool_record, build_tags, category_value


class AihotSyncMappingTests(unittest.TestCase):
    def setUp(self) -> None:
        self.item = {
            "id": "item-1",
            "title": "OpenAI ships a new agent",
            "url": "https://example.com/item-1",
            "source": "Example",
            "publishedAt": "2026-05-16T06:55:45.000Z",
            "summary": "OpenAI released an agent workflow update.",
            "category": "industry",
        }

    def test_category_value_keeps_base_enum_slug(self) -> None:
        self.assertEqual(category_value("industry"), "industry")
        self.assertEqual(category_value("unknown"), "other")
        self.assertEqual(category_value(None), "other")

    def test_tags_use_existing_base_options(self) -> None:
        self.assertEqual(build_tags(self.item), ["行业动态", "OpenAI", "可跟进"])

    def test_aihot_record_uses_base_enum_slug(self) -> None:
        record = build_aihot_record(
            self.item,
            "batch-1",
            datetime(2026, 5, 16, 16, 44, 31, tzinfo=ZoneInfo("Asia/Shanghai")),
        )
        self.assertEqual(record["分类"], "industry")

    def test_daily_pool_record_uses_base_enum_slug_and_supported_tags(self) -> None:
        record = build_daily_pool_record(
            self.item,
            datetime(2026, 5, 16, 16, 44, 31, tzinfo=ZoneInfo("Asia/Shanghai")),
        )
        self.assertEqual(record["分类"], "industry")
        self.assertEqual(record["标签"], ["行业动态", "OpenAI", "可跟进"])


if __name__ == "__main__":
    unittest.main()
