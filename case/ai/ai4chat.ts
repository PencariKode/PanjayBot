import type { PluginContext, PluginInfo } from "../../types.ts";


import Ai4Chat from "../../scrape/Ai4Chat.js";

export const info: PluginInfo = {
  name: "AI4Chat",

  menu: ["AI"],
  case: ["ai"],

  description: "Tanyakan Apa Saja!",
  hidden: false,

  owner: false,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,

  allowPrivate: false,
};

export default async function handler(panjay: PluginContext) {
  const { command, q, PanjayText, PanjayWait } = panjay;

  switch (command) {
    case "ai":
      {
        if (!q) return PanjayText("☘️ *Contoh:* ai Apa itu JavaScript?");

        PanjayWait();

        try {
          const lenai = await Ai4Chat(q);

          if (!lenai) return PanjayText("⚠️ AI Tidak Merespon.");

          await PanjayText(`*Panjay AI*\n\n${lenai}`);
        } catch (error) {
          console.error("Error AI:", error);
          PanjayText(globalThis.mess.error);
        }
      }
      break;
  }
}
