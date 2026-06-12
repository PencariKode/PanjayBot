import type { PluginContext, PluginInfo } from "../../types.ts";
export const info: PluginInfo = {
  name: "Image Pinterest",

  menu: ["Pin"],
  case: ["pin"],

  description: "Image search Pinterest (fast, no API, stable)",

  hidden: false,
  owner: false,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,
};

interface PinterestResult {
  original_url: string;
  preview_url: string;
}

function getRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

async function pinterestSearch(query: string, limit = 20): Promise<PinterestResult[]> {
  const url =
    "https://www.pinterest.com/resource/BaseSearchResource/get/?data=" +
    encodeURIComponent(
      JSON.stringify({
        options: {
          query: query,
          scope: "pins",
          page_size: limit,
        },
      }),
    );

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json, text/javascript",
      "Accept-Language": "en-US,en;q=0.9",
      "x-pinterest-pws-handler": "www/search/[scope].js",
    },
  });

  const json = await res.json();

  const results: PinterestResult[] = [];
  const root = getRecord(json);
  const resource = getRecord(root?.resource_response);
  const dataRecord = getRecord(resource?.data);
  const data = Array.isArray(dataRecord?.results) ? dataRecord.results : [];

  for (const item of data) {
    const itemRecord = getRecord(item);
    const images = getRecord(itemRecord?.images);
    const original = getRecord(images?.orig);
    const large = getRecord(images?.["736x"]);
    const medium = getRecord(images?.["564x"]);
    const img =
      (typeof original?.url === "string" && original.url) ||
      (typeof large?.url === "string" && large.url) ||
      (typeof medium?.url === "string" && medium.url);

    if (img) {
      results.push({
        original_url: img,
        preview_url: img,
      });
    }
  }

  return results;
}

export default async function handler(panjy: PluginContext) {
  const { q, PanjayText, panjay, replyJid, msg } = panjy;

  if (!q) {
    return PanjayText("*Contoh:* .Pin Ruridragon");
  }

  try {
    const [query, limitInput = "3"] = q.split("|").map((v) => v.trim());
    let limit = Math.min(parseInt(limitInput) || 3);

    if (!query) return PanjayText("❌ Query kosong.");

    await PanjayText(`☕ Mencari Gambar *${query}*`);

    let results = await pinterestSearch(query, 20);

    if (!results || results.length === 0) {
      return PanjayText("🍂 Gambar tidak ditemukan.");
    }

    results = results.filter((v) => v?.original_url);

    results = results.sort(() => Math.random() - 0.5).slice(0, limit);

    await Promise.all(
      results.map((img, i) =>
        panjay.sendMessage(
          replyJid,
          {
            image: { url: img.original_url },
            caption: `☕ *${query} (${i + 1}/${results.length})*`,
          },
          { quoted: msg },
        ),
      ),
    );
  } catch (err) {
    console.error(err);
    return PanjayText("❌ Error saat mengambil gambar.");
  }
}
