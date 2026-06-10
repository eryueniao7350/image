/**
 * Generate RSS feeds at build time.
 * Output:
 *   dist/feed.xml          — Latest 30 newly indexed skills
 *   dist/feed-trending.xml — Weekly trending Top 20 (star velocity)
 */

import { writeFileSync } from "fs";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SITE, esc } from "./shared-utils.mjs";

const EMPTY_ITEMS = [];

function rfc822(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toUTCString();
}

function starsK(n) {
  if (!n) return "0";
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
}

function buildRss(title, description, link, items) {
  const itemsXml = items
    .map(
      (item) => `    <item>
      <title>${esc(item.title)}</title>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.link}</guid>
      <description>${esc(item.description)}</description>
      <pubDate>${item.pubDate}</pubDate>
      <category>${esc(item.category)}</category>
    </item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(title)}</title>
    <description>${esc(description)}</description>
    <link>${link}</link>
    <atom:link href="${link}/feed.xml" rel="self" type="application/rss+xml"/>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>480</ttl>
${itemsXml}
  </channel>
</rss>`;
}

async function fetchJson(url) {
  const attempts = 3;
  for (let i = 1; i <= attempts; i++) {
    try {
      const resp = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      if (!resp.ok) {
        const body = await resp.text().catch(() => "");
        throw new Error(`${resp.status} ${resp.statusText}: ${url}${body ? `\n${body}` : ""}`);
      }

      const data = await resp.json();
      return Array.isArray(data) ? data : EMPTY_ITEMS;
    } catch (err) {
      if (i === attempts) throw err;
      console.warn(`   RSS fetch failed (attempt ${i}/${attempts}), retrying...`, err.message);
      await new Promise((resolve) => setTimeout(resolve, i * 1000));
    }
  }

  return EMPTY_ITEMS;
}

function writeEmptyFeed(filename, title, description) {
  writeFileSync(
    filename,
    buildRss(title, description, SITE, EMPTY_ITEMS),
    "utf-8"
  );
}

async function main() {
  console.log("📡 Generating RSS feeds...");

  // 1. feed.xml — latest new skills from a bounded, index-friendly candidate set.
  const newSkills = await fetchJson(
    `${SUPABASE_URL}/rest/v1/skills?select=repo_full_name,repo_name,author_name,description,stars,category,first_seen&stars=gte.20&order=stars.desc&limit=200`
  ).then((skills) =>
    skills
      .filter((s) => s.first_seen)
      .sort((a, b) => new Date(b.first_seen) - new Date(a.first_seen))
      .slice(0, 30)
  );

  const newItems = newSkills.map((s) => ({
    title: `${s.repo_name} by ${s.author_name} — ★ ${starsK(s.stars)}`,
    link: `${SITE}/skill/${s.repo_full_name}/`,
    description: `${s.description || "No description"} | Category: ${s.category} | Stars: ${s.stars}`,
    pubDate: rfc822(s.first_seen),
    category: s.category || "uncategorized",
  }));

  const feedXml = buildRss(
    "Agent Skills Hub — New Skills",
    "Latest AI agent tools, MCP servers, and Claude skills indexed on Agent Skills Hub",
    SITE,
    newItems
  );
  writeFileSync("dist/feed.xml", feedXml, "utf-8");
  console.log(`   ✅ feed.xml — ${newItems.length} items`);

  // 2. feed-trending.xml — weekly trending top 20
  const today = new Date().toISOString().slice(0, 10);
  const trending = await fetchJson(
    `${SUPABASE_URL}/rest/v1/weekly_trending_snapshots?select=repo_full_name,repo_name,author_name,description,stars,star_velocity,category,week_start,week_end&week_end=lte.${today}&order=week_end.desc,star_velocity.desc&limit=20`
  );

  const trendItems = trending.map((s, i) => {
    const vel =
      s.star_velocity >= 1000
        ? `${(s.star_velocity / 1000).toFixed(1)}k/day`
        : `${Math.round(s.star_velocity)}/day`;
    return {
      title: `#${i + 1} ${s.repo_name} — ★ ${starsK(s.stars)} (${vel})`,
      link: `${SITE}/skill/${s.repo_full_name}/`,
      description: `${s.description || ""} | Velocity: ${vel} | Stars: ${s.stars}`,
      pubDate: rfc822(s.week_end),
      category: s.category || "uncategorized",
    };
  });

  const trendXml = buildRss(
    "Agent Skills Hub — Weekly Trending",
    "Top 20 fastest-growing AI agent tools by star velocity, updated weekly",
    SITE,
    trendItems
  );
  writeFileSync("dist/feed-trending.xml", trendXml, "utf-8");
  console.log(`   ✅ feed-trending.xml — ${trendItems.length} items`);
}

main().catch((e) => {
  console.warn("RSS generation failed; writing empty feeds so Pages deployment can continue.", e);
  writeEmptyFeed(
    "dist/feed.xml",
    "Agent Skills Hub — New Skills",
    "Latest AI agent tools, MCP servers, and Claude skills indexed on Agent Skills Hub"
  );
  writeEmptyFeed(
    "dist/feed-trending.xml",
    "Agent Skills Hub — Weekly Trending",
    "Top 20 fastest-growing AI agent tools by star velocity, updated weekly"
  );
});
