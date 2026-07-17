import { prisma } from "../../lib/database.ts";
import type { PluginContext, PluginInfo } from "../../types.ts";
import { botConfig } from "../../config.ts";

export const info: PluginInfo = {
  name: "Statistik ITLG",

  menu: ["statitlg"],
  case: ["statitlg", "statsitlg", "itlgstat", "itlgstats"],

  description: "Menampilkan statistik sistem ITLG",
  itlg: true,
  allowPrivate: true,
};

export default async function handler(panjy: PluginContext) {
  const {
    panjay,
    msg,
    replyJid,
    PanjayReact,
  } = panjy;

  const totalNimDistinct = (await prisma.itlgStudent.groupBy({ by: ["nim"] })).length;
  const totalJidDistinct = (await prisma.itlgStudent.groupBy({ by: ["jid"] })).length;
  const totalVerified = await prisma.itlgStudent.count({ where: { isVerified: true } });
  const totalUnverified = totalJidDistinct - totalVerified;

  PanjayReact("📊");

  let text = `◈ *STATISTIK SISTEM ITLG* ◈\n\n`;
  text += `▧ *Data Keseluruhan:*\n`;
  text += ` ▹ *NIM Terdaftar* : ${totalNimDistinct} orang\n`;
  text += ` ▹ *Nomor WA (JID)* : ${totalJidDistinct} kontak\n\n`;
  text += `▧ *Status Verifikasi:*\n`;
  text += ` ▹ *Terverifikasi* : ${totalVerified} ✓\n`;
  text += ` ▹ *Belum Terverifikasi* : ${totalUnverified} ✕\n\n`;
  text += `──────────────────\n\n`;
  text += `✦ *Pusat Informasi & Bantuan*\n`;
  text += `Jika mengalami kendala terkait pendaftaran, verifikasi, maupun sistem ITLG secara umum, silakan hubungi asisten laboratorium:\n`;
  text += `☏ @6287869164526 (Aslab)\n\n`;
  text += `╰─〔 *${botConfig.branding.footer}* 〕`;

  await panjay.sendMessage(replyJid, { 
    text, 
    mentions: ["6287869164526@s.whatsapp.net"] 
  }, { quoted: msg });
}
