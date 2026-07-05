import type { PluginContext, PluginInfo } from "../../types.ts";

// Metadata
export const info: PluginInfo = {
  name: "Testo ITLG",

  menu: ["testo"],
  case: ["testo", "itlg"],

  description: "Entah ITLG",
  hidden: false,

  owner: false,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,
  itlg: false,

  allowPrivate: false,
};

// Handler Utama
export default async function handler(panjy: PluginContext) {
  const {
    command,
    args,
    q,
    panjay,
    m,
    msg,
    len,
    replyJid,
    panjayreply,
    PanjayText,
    PanjayInvalid,
    PanjayWait,
    PanjayVideo,
    PanjayImage,
    PanjayAudio,
    PanjayFile,
    PanjayReact,
    isGroup,
    isAdmin,
    isBotAdmin,
    isPremium,
    isPanjay,
  } = panjy;

  PanjayReact("🗿");
}
