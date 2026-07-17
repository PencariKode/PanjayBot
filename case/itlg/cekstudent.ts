import type { PluginContext, PluginInfo } from "../../types.ts";
import { findITLGStudentByJid, findITLGStudentByNIM } from "../../lib/database.ts";
import { botConfig } from "../../config.ts";
import { normalizeJid } from "../../lib/utils.ts";

export const info: PluginInfo = {
  name: "Cek Student",

  menu: ["cekstudent <nim|no hp>"],
  case: ["cekstudent", "checkstudent", "studentinfo"],

  description: "Melihat informasi student berdasarkan NIM atau nomor HP",
  hidden: false,
  owner: true,
  itlg: true,
  allowPrivate: true,
};

export default async function handler(panjy: PluginContext) {
  const {
    command,
    q,
    panjay,
    replyJid,
    panjayreply,
    PanjayInvalid,
    PanjayReact,
  } = panjy;

  const idn = q.replace(/\s+/g, "");
  PanjayReact("⏳")

  if (idn.length < 9) return PanjayInvalid({
    title: "NIM / HP TIDAK VALID",
    message: "NIM atau nomor HP tidak ada atau terlalu pendek",
    usage: `${command} <nim|no hp>`,
    examples: [`${command} 241402034`, `${command} 6287869164526`],
  }, true);

  if (idn.length === 9) {
    const students = await findITLGStudentByNIM(idn);
    if (!students || students.length < 1) return PanjayInvalid({
      title: "STUDENT NOT FOUND",
      message: "Student tidak ditemukan",
      usage: `${command} <nim|no hp>`,
      examples: [`${command} 241402034`, `${command} 6287869164526`],
    }, true);

    const sortedStudents = students.sort((a, b) => {
      if (a.isVerified === b.isVerified) return 0;
      return a.isVerified ? -1 : 1;
    });

    let text = `╭─〔 *STUDENT INFO* 〕\n`;
    text += `│ › *NIM*: ${idn}\n`;
    text += `│\n`;

    let noHp;

    sortedStudents.forEach((s, idx) => {
      noHp = s.jid.split('@')[0];
      text += `├─〔 *DATA ${idx + 1}* ${s.isVerified ? '✅' : ''}〕\n`;
      text += `│ › @${noHp}\n`;
      text += `│ › *Nomor*: ${(noHp)?.replace(/^\d{2}/, '0')}\n`;
      text += `│ › *Nama*: ${s.name || '-'}\n`;
      text += `│\n`;
    });
    
    text += "╰────────────\n";

    await panjay.sendMessage(replyJid, { text: `${text}\n╰─〔 *${botConfig.branding.footer}* 〕`, mentions: students.map(s => s.jid) });
  } else {
    const stu = await findITLGStudentByJid(normalizeJid(idn));
    if (!stu) return PanjayInvalid({
      title: "STUDENT NOT FOUND",
      message: "Student tidak ditemukan",
      usage: `${command} <nim|no hp>`,
      examples: [`${command} 241402034`, `${command} 6287869164526`],
    }, true);

    let text = `╭─〔 *STUDENT INFO* 〕\n`;
    text += `│ › *Nomor*: ${(stu.jid.split('@')[0])?.replace(/^\d{2}/, '0')}\n`;
    text += `│ › *NIM*: ${stu.nim || '-'}\n`;
    text += `│ › *Nama*: ${stu.name || '-'}\n`;
    text += `│ › *Status*: ${stu.isVerified ? 'Terverifikasi ✅' : 'Belum Terverifikasi'}\n`;
    text += "╰────────────\n";

    await panjayreply(`${text}\n╰─〔 *${botConfig.branding.footer}* 〕`);
  }
  await PanjayReact("✅");
}
