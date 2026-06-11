import type { PluginContext, PluginInfo } from "../../types.ts";


import axios from "axios";

export const info: PluginInfo = {
  name: "WebPilot AI",

  menu: ["Webpilot"],
  case: ["wp", "webpilot"],

  description: "AI Web Search menggunakan WebPilot",
  hidden: false,

  owner: false,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,

  allowPrivate: true,
};

export default async function handler(panjay: PluginContext) {
  const { command, q, PanjayText, PanjayWait } = panjay;

  switch (command) {
    case "wp":
    case "webpilot":
      {
        if (!q) return PanjayText("☘️ *Contoh:* webpilot Apa Itu Sc Bot Panjay");

        PanjayWait();

        try {
          const encodedQuery = encodeURIComponent(q);
          const API_URL = `https://api.fromscratch.web.id/v1/api/ai/webpilot/details?query=${encodedQuery}`;

          const { data: response } = await axios.get(API_URL);

          if (response.status !== 200) {
            return PanjayText(
              `❌ Gagal mengambil data WebPilot.\nPesan: ${
                response.message || "Terjadi kesalahan API."
              }`,
            );
          }

          const result = response.data;

          let reply = `🌐 *Panjay WebPilot (AI Search)*\n\n`;
          reply += `${result.response}`;

          await PanjayText(reply);
        } catch (error) {
          console.error("WebPilot Error:", error);
          PanjayText(globalThis.mess.error);
        }
      }
      break;
  }
}
