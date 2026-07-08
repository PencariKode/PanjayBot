import type { PluginContext, PluginInfo } from "../../types.ts";
import { addITLGStudent } from "../../lib/database.ts";


export const info: PluginInfo = {
  name: "Enroll Mahasiswa ITLG",

  menu: ["enroll"],
  case: ["enrollitlg", "daftaritlg", "enroll"],

  description: "Mengenroll mahasiswa ke dalam sistem ITLG secara mandiri",
  hidden: false,

  owner: false,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,
  itlg: true,

  allowPrivate: true,
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

  try {
    await addITLGStudent(replyJid);
    panjayreply(`Anda telah berhasil mendaftar sebagai mahasiswa ITLG.`);
  } catch (error) {
    panjayreply(`Terjadi kesalahan saat mendaftar: ${error}`);
  }
}
