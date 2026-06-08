

import axios from "axios";
import path from "path";
import fs from "fs";

export const info = {
  name: "Youtube Downloader",

  menu: ["Ytmp4"],
  case: ["yt", "ytmp4"],

  description: "Penjelasan Singkat Fitur",
  hidden: false,

  owner: false,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,

  allowPrivate: false,
};

// Handler Utama
export default async function handler(panjy) {
  const { command, q, panjay, msg, replyJid, PanjayText, PanjayWait } = panjy;

  const youtubeRegex = /(?:youtu\.be\/|v=|v\/|embed\/|shorts\/)([\w-]{11})/i;

  switch (command) {
    case "yt":
    case "ytmp4":
      {
        if (!q) return PanjayText(`⚠ *Mana Link YouTube-nya?*`);

        if (!youtubeRegex.test(q))
          return PanjayText("❌ *Link YouTube Tidak Valid.*");

        const tempDir = path.join(process.cwd(), "temp");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        PanjayWait();

        try {
          const apiUrl = `https://api.fromscratch.web.id/v1/api/down/youtube?url=${encodeURIComponent(q)}&type=mp4&format=720`;
          const { data: response } = await axios.get(apiUrl);

          if (response.status !== 200 || !response.data) {
            return PanjayText("❌ *Terjadi Masalah*");
          }

          const { title, thumbnail, quality, download_url } = response.data;
          // const captionText = `*🎁 Panjay YouTube Downloader (Video)*`;

          // await panjay.sendMessage(replyJid, {
          //     image: { url: thumbnail },
          //     caption: captionText
          // }, { quoted: len });

          const videoRes = await axios.get(download_url, {
            responseType: "arraybuffer",
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            },
          });

          const fileName = `yt_${Date.now()}.mp4`;
          const filePath = path.join(tempDir, fileName);
          fs.writeFileSync(filePath, Buffer.from(videoRes.data));

          await panjay.sendMessage(
            replyJid,
            {
              video: fs.readFileSync(filePath),
              mimetype: "video/mp4",
              fileName: `${title}.mp4`,
              caption: `*🎁 Panjay YouTube Downloader (Video)*`,
            },
            { quoted: msg },
          );
        } catch (error) {
          console.error("Error YTMP4:", error);
          PanjayText(`❌ *Error:*\n${error.message}`);
        }
      }
      break;
  }
}
