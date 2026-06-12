import type { PluginContext, PluginInfo } from "../../types.ts";


import axios from "axios";

export const info: PluginInfo = {
  name: "Tiktok Downloader",

  menu: ["Tiktok"],
  case: ["tt", "ttdl", "tiktok"],

  description: "Downloader TikTok",
  hidden: false,

  owner: false,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,

  allowPrivate: false,
};

interface TiktokDownloadResponse {
  status?: number;
  data?: {
    no_watermark?: string;
  };
}

export default async function handler(panjay: PluginContext) {
  const { command, q, PanjayText, PanjayInvalid, PanjayWait, PanjayVideo } = panjay;

  const tiktokRegex = /^(https?:\/\/)?(www\.|vt\.|vm\.)?tiktok\.com\/.+/i;

  switch (command) {
    case "tt":
    case "ttdl":
    case "tiktok": {
      if (!q)
        return PanjayInvalid({
          title: "INPUT REQUIRED",
          message: "Masukkan link TikTok yang ingin diunduh.",
          example: `${command} https://www.tiktok.com/@user/video/1234567890`,
        });

      if (!tiktokRegex.test(q))
        return PanjayInvalid({
          title: "INVALID LINK",
          message: "Link TikTok tidak valid.",
          example: `${command} https://www.tiktok.com/@user/video/1234567890`,
        });

      PanjayWait();

      try {
        const encodedUrl = encodeURIComponent(q.trim());
        const apiUrl = `https://api.fromscratch.web.id/v1/api/down/tiktok?url=${encodedUrl}`;

        const { data: response } = await axios.get<TiktokDownloadResponse>(apiUrl);

        if (response.status !== 200 || !response.data?.no_watermark)
          return PanjayText("❌ Gagal mengunduh video.");

        const videoUrl = response.data.no_watermark;

        await PanjayVideo(
          videoUrl,
          `*🎁 Panjay Tiktok Downloader*\n*[+] Powered by api.fromscratch.web.id*`,
        );
      } catch (error) {
        console.error(
          "TTDL Error:",
          error instanceof Error ? error.message : String(error),
        );
        PanjayText("❌ Gagal mengunduh video TikTok.");
      }
      break;
    }
  }
}
