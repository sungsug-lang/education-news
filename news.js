export default async function handler(req, res) {
  res.status(200).json({
    items: [
      { title: "교육 뉴스 샘플 1", link: "https://news.google.com" },
      { title: "교육 뉴스 샘플 2", link: "https://news.google.com" }
    ]
  });
}
