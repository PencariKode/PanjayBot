import type { PluginContext, PluginInfo } from "../../types.ts";
import { findITLGStudentByJid, findITLGStudentByNIM } from "../../lib/database.ts";
import { botConfig } from "../../config.ts";

export const info: PluginInfo = {
  name: "MyITLG",

  menu: ["myitlg"],
  case: ["myitlg", "meitlg"],

  description: "Mengecek informasi mengenai profile ITLG student",
  itlg: true,
  allowPrivate: true,
};

// Handler Utama
export default async function handler(panjy: PluginContext) {
  const {
    panjay,
    replyJid,
    panjayreply,
    PanjayInvalid,
    PanjayReact,
    normalizedSender,
  } = panjy;

  await PanjayReact("⏳");

  const currentStudent = await findITLGStudentByJid(normalizedSender);
  if (!currentStudent) return PanjayInvalid({
    title: "STUDENT NOT FOUND",
    message: "Terjadi kesalahan, data student tidak ditemukan. Silahkan enroll terlebih dahulu.",
    example: "enroll <nim> [nama lengkap]"
  }, true);

  const nim = currentStudent.nim;
  const students = nim ? await findITLGStudentByNIM(nim) : [currentStudent];

  if (!students || students.length === 0) {
    await PanjayReact("❌");
    return panjayreply("Terjadi kesalahan, data student tidak ditemukan.");
  }

  const sortedStudents = students.sort((a, b) => {
    if (a.jid === normalizedSender) return -1;
    if (b.jid === normalizedSender) return 1;

    if (a.isVerified === b.isVerified) return 0;
    return a.isVerified ? -1 : 1;
  });

  let text = `╭─〔 *MY PROFILE* 〕\n`;
  text += `│ › *NIM*: ${nim || '-'}\n`;
  text += `│\n`;

  let noHp;

  sortedStudents.forEach((s, idx) => {
    noHp = s.jid.split('@')[0];
    const isMe = s.jid === normalizedSender;
    text += `├─〔 *DATA ${idx + 1}* ${isMe ? '(YOU)' : ''} ${s.isVerified ? '✅' : ''}〕\n`;
    text += `│ › @${noHp}\n`;
    text += `│ › *Nomor*: ${(noHp)?.replace(/^\d{2}/, '0')}\n`;
    text += `│ › *Nama*: ${s.name || '-'}\n`;
    text += `│\n`;
  });
  
  text += "╰────────────\n";

  await panjay.sendMessage(replyJid, { text: `${text}\n╰─〔 *${botConfig.branding.footer}* 〕`, mentions: students.map(s => s.jid) });
  await PanjayReact("✅");
}
