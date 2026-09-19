// Met Collection API 批量查询：按关键词搜候选沉浸画
// 用法: node met-search.mjs "query1" "query2" ...
const API = "https://collectionapi.metmuseum.org/public/collection/v1";

for (const q of process.argv.slice(2)) {
  const s = await fetch(`${API}/search?q=${encodeURIComponent(q)}`).then(r => r.json());
  const ids = (s.objectIDs || []).slice(0, 8);
  console.log(`\n########## QUERY: ${q} ##########`);
  for (const id of ids) {
    const o = await fetch(`${API}/objects/${id}`).then(r => r.json());
    console.log(
      `${o.objectID} | ${o.department} | G${o.GalleryNumber || "-"} | ` +
      `CC0:${o.isPublicDomain ? "Y" : "N"} | hi:${o.isHighlight ? "Y" : "N"} | ` +
      `${(o.artistDisplayName || "?").slice(0, 28)} | ${(o.title || "?").slice(0, 52)} | ` +
      `${o.objectDate || ""} | ${(o.primaryImage || "").slice(0, 90)}`
    );
  }
}
