/*

     Create: Shannyie
     Telegram: t.me/Shannyiee

*/

export const info = {
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

export default async function handler(panjy) {
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

        const json = await res.json();

        if (!json.status || !json.result?.length)
          return PanjayText("⚠️ *Tidak Ada Hasil Ditemukan.*");

        const results = json.result.slice(0, 5); // ambil 5 teratas

        let text = `🔍 *Hasil Pencarian YouTube*\n📝 Query: ${q}\n\n`;

        results.forEach((v, i) => {
          text += `*${i + 1}. ${v.title}*\n`;
          text += `👤 ${v.channel}\n`;
          text += `⏱ ${v.duration}\n`;
          text += `🔗 ${v.link}\n\n`;
        });

        // kirim thumbnail video pertama + list hasil
        await PanjayImage(results[0].imageUrl, text);
      } catch (err) {
        console.error("YTSearch Error:", err);
        PanjayText(globalThis.mess.error);
      }

      break;
    }
  }
}
