import type { PluginContext, PluginInfo } from "../../types.ts";


import axios from "axios";
import path from "path";
import fs from "fs";

export const info: PluginInfo = {
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

interface YoutubeDownloadResponse {
  status?: number;
  data?: {
    title?: string;
    download_url?: string;
  };
}

// Handler Utama
export default async function handler(panjy: PluginContext) {
  const { command, q, panjay, msg, replyJid, PanjayText, PanjayInvalid, PanjayWait } = panjy;

  const youtubeRegex = /(?:youtu\.be\/|v=|v\/|embed\/|shorts\/)([\w-]{11})/i;

  switch (command) {
    case "yt":
    case "ytmp4":
      {
        if (!q)
          return PanjayInvalid({
            title: "INPUT REQUIRED",
            message: "Masukkan link YouTube yang ingin diunduh.",
            example: `${command} https://youtu.be/dQw4w9WgXcQ`,
          });

        if (!youtubeRegex.test(q))
          return PanjayInvalid({
            title: "INVALID LINK",
            message: "Link YouTube tidak valid.",
            example: `${command} https://youtu.be/dQw4w9WgXcQ`,
          });

        const tempDir = path.join(process.cwd(), "temp");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        PanjayWait();

        try {
          const apiUrl = `https://api.fromscratch.web.id/v1/api/down/youtube?url=${encodeURIComponent(q)}&type=mp4&format=720`;
          const { data: response } = await axios.get<YoutubeDownloadResponse>(apiUrl);

          if (response.status !== 200 || !response.data) {
            return PanjayText("❌ *Terjadi Masalah*");
          }

          const { title, download_url } = response.data;
          if (!download_url) return PanjayText("❌ *Terjadi Masalah*");
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
          PanjayText(
            `❌ *Error:*\n${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
      break;
  }
}
