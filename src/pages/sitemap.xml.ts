import type { APIRoute } from "astro";
import { cases } from "../data/site";

/* Every public page, regenerated on each build so lastmod tracks deploys. */
export const GET: APIRoute = ({ site }) => {
  const lastmod = new Date().toISOString().slice(0, 10);
  const pages: [string, string][] = [
    ["/", "1.0"],
    ["/work/about/", "0.9"],
    ["/work/", "0.8"],
    ...cases.map((c): [string, string] => [`/work/${c.slug}/`, "0.7"]),
  ];
  const urls = pages
    .map(([path, priority]) => `  <url>\n    <loc>${new URL(path, site)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>${priority}</priority>\n  </url>`)
    .join("\n");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
};
