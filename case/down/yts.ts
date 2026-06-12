import type { PluginContext, PluginInfo } from "../../types.ts";
/*

     Create: Shannyie
     Telegram: t.me/Shannyiee

*/

export const info: PluginInfo = {
  name: "YouTube Search",

  menu: ["Yts"],
  case: ["ytsearch", "yts", "cariyt"],

  description: "Cari Video Di YouTube",
  hidden: false,

  owner: false,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,

  allowPrivate: false,
};

interface YoutubeSearchItem {
  title: string;
  channel: string;
  duration: string;
  link: string;
  imageUrl: string;
}

interface YoutubeSearchResponse {
  status?: boolean;
  result?: YoutubeSearchItem[];
}

export default async function handler(panjy: PluginContext) {
  const { command, q, PanjayText, PanjayWait, PanjayImage } = panjy;

  switch (command) {
    case "ytsearch":
    case "yts":
    case "cariyt": {
      if (!q) return PanjayText("🔍 *Contoh:* .ytsearch alan walker faded");

      PanjayWait();

      try {
        const res = await fetch(
          `https://shiny-beta-six.vercel.app/api/search/youtube?q=${encodeURIComponent(q)}`
        );

        const json = (await res.json()) as YoutubeSearchResponse;

        if (!json.status || !json.result?.length)
          return PanjayText("⚠️ *Tidak Ada Hasil Ditemukan.*");

        const results = json.result.slice(0, 5); // ambil 5 teratas

        let text = `🔍 *Hasil Pencarian YouTube*\n📝 Query: ${q}\n\n`;

        results.forEach((v: YoutubeSearchItem, i: number) => {
          text += `*${i + 1}. ${v.title}*\n`;
          text += `👤 ${v.channel}\n`;
          text += `⏱ ${v.duration}\n`;
          text += `🔗 ${v.link}\n\n`;
        });

        // kirim thumbnail video pertama + list hasil
        const first = results[0];
        if (first) await PanjayImage(first.imageUrl, text);
      } catch (err) {
        console.error("YTSearch Error:", err);
        PanjayText(globalThis.mess.error);
      }

      break;
    }
  }
}
