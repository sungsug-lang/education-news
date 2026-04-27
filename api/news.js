export default async function handler(req, res) {
  const queries = [
    "교육 OR 학교 OR 교사 OR 학생 OR 학부모 OR 교육부 OR 교육청",
    "교권 OR 교육활동 OR 교원 OR 교직원",
    "학교폭력 OR 학폭 OR 생활지도 OR 학생맞춤지원",
    "초등학교 OR 늘봄학교 OR 돌봄 OR 방과후",
    "입시 OR 수능 OR 대입 OR 대학"
  ];

  let all = [];
  for (const q of queries) {
    try {
      const url = "https://news.google.com/rss/search?q=" + encodeURIComponent(q + " when:7d") + "&hl=ko&gl=KR&ceid=KR:ko";
      const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
      const xml = await response.text();
      all = all.concat(parseRss(xml));
    } catch (e) {}
  }

  const seen = new Set();
  const items = all
    .filter(item => {
      const key = item.title.trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a,b) => new Date(b.rawDate) - new Date(a.rawDate))
    .slice(0, 60);

  res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=1800");
  res.status(200).json({ items });
}

function parseRss(xml) {
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  return blocks.map(block => {
    let title = clean(getTag(block, "title"));
    const link = clean(getTag(block, "link"));
    const rawDate = clean(getTag(block, "pubDate"));
    const summary = clean(stripHtml(getTag(block, "description"))).slice(0, 260);

    let source = "Google 뉴스";
    const m = title.match(/\s-\s([^-]+)$/);
    if (m) {
      source = m[1].trim();
      title = title.replace(/\s-\s[^-]+$/, "").trim();
    }

    return { title, link, source, pubDate: formatKoreanDate(rawDate), rawDate, summary };
  }).filter(x => x.title && x.link);
}

function getTag(block, tag) {
  const re = new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)<\\/" + tag + ">", "i");
  const m = block.match(re);
  return m ? m[1] : "";
}

function stripHtml(s) {
  return String(s || "").replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "").replace(/<[^>]+>/g, " ");
}

function clean(s) {
  return decodeEntities(String(s || "")).replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "").replace(/\s+/g, " ").trim();
}

function decodeEntities(s) {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function formatKoreanDate(value) {
  const date = new Date(value);
  if (isNaN(date)) return value || "";
  return date.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}
