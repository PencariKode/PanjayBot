import type { PluginContext, PluginInfo } from "../../types.ts";
import { addITLGGroup } from "../../lib/database.ts";
import { getDataStore } from "../../lib/dataStore.ts";

export const info: PluginInfo = {
  name: "Assign group so the group can use ITLG commands",

  menu: ["assigngroup"],
  case: ["assignitlg", "itlggroup", "itlggrup", "assigngrup"],

  description: "Penjelasan Singkat Fitur",
  hidden: true,

  owner: true,
  premium: false,
  group: true,
  private: false,
  admin: false,
  botAdmin: false,
  itlg: true,

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

  const groupJid = replyJid;
  if (!isGroup) return;
  if (!groupJid.endsWith("@g.us")) return;

  try {
    const dataStore = getDataStore();
    const isITLGGroup = await dataStore.isITLGGroup(groupJid);
    if (isITLGGroup) return PanjayReact("✅");
    
    await addITLGGroup(groupJid);
    panjayreply("Group berhasil ditambahkan ke daftar ITLG.");
    await PanjayReact("✅");
  } catch (error) {
    panjayreply("Terjadi kesalahan saat menambahkan group ke daftar ITLG.");
    await PanjayReact("❌");
  }
}
