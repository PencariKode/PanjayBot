import type { PluginContext, PluginInfo } from "../../types.ts";
import { findITLGStudentByJid, addITLGStudent } from "../../lib/database.ts";
import { normalizeJid } from "../../lib/utils.ts";

export const info: PluginInfo = {
  name: "Verify ITLG",
  menu: ["verify <no hp>", "unverify <no hp>"],
  case: ["verify", "verifyitlg", "unverify", "unverifyitlg"],
  description: "Memverifikasi / Menghapus verifikasi nomor WA yang terdaftar di ITLG",
  hidden: true,
  owner: true,
  itlg: true,
  allowPrivate: true,
};

export default async function handler(panjy: PluginContext) {
  const { command, q, panjayreply, PanjayInvalid, PanjayReact } = panjy;
  
  const phoneNumber = q.replace(/\s+/g, "");
  const isVerifyAction = command.startsWith("verify");
  const actionText = isVerifyAction ? "verifikasi" : "unverify";

  if (phoneNumber.length < 9) {
    return PanjayInvalid({
      title: "NOMOR HP REQUIRED",
      message: "Nomor HP tidak ditemukan atau terlalu pendek",
      usage: `${command} <no hp>`,
      command: `${command} 6287869164526`,
    });
  }
  
  const targetJid = normalizeJid(phoneNumber);
  const student = await findITLGStudentByJid(targetJid);
  
  if (!student) {
    return PanjayInvalid({
      title: "NOMOR HP TIDAK DITEMUKAN",
      message: `Nomor HP ${phoneNumber} tidak terdaftar di ITLG`,
      usage: `${command} <no hp>`,
      command: `${command} 6287869164526`,
    });
  }

  if (student.isVerified === isVerifyAction) {
    return PanjayReact("✅");
  }

  try {
    await addITLGStudent(targetJid, isVerifyAction);
    await panjayreply(`Nomor HP ${phoneNumber} berhasil di-${actionText}`);
    return PanjayReact("✅");
  } catch (error) {
    console.error(`[ITLG Plugin Error]:`, error);
    return PanjayInvalid({
      title: `GAGAL ${actionText.toUpperCase()}`,
      message: `Gagal melakukan ${actionText} pada nomor HP ${phoneNumber}`,
      usage: `${command} <no hp>`,
      command: `${command} 6287869164526`,
    });
  }
}
