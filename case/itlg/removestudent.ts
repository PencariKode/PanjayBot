import type { PluginContext, PluginInfo } from "../../types.ts";
import { removeITLGStudent, findITLGStudentByJid, findITLGStudentByNIM } from "../../lib/database.ts";
import { normalizeJid } from "../../lib/utils.ts";

interface RemoveStudentCache {
  [key: string]: string[];
}

export const info: PluginInfo = {
  name: "Remove ITLG Student",
  menu: ["removestudent <nim|no hp>"],
  case: ["removestudent", "removestu", "rmvstu"],
  description: "Menghapus data ITLG student berdasarkan NIM ataupun JID",
  hidden: true,
  owner: true,
  itlg: true,
  allowPrivate: true,
};

export default async function handler(panjy: PluginContext) {
  const {
    command, args, q, panjay, msg, replyJid,
    panjayreply, PanjayInvalid, PanjayReact, PanjayButton
  } = panjy;

  panjay.cache.rmvstu = (panjay.cache.rmvstu || {}) as RemoveStudentCache;
  const cache = panjay.cache.rmvstu as RemoveStudentCache;

  const idn = q.replace(/\s+/g, "");
  await PanjayReact("⏳");

  if (!idn || idn.length < 9) {
    return PanjayInvalid({
      title: "NIM / HP TIDAK VALID",
      message: "NIM atau nomor HP tidak ada atau terlalu pendek",
      usage: `${command} <nim|no hp>`,
      examples: [`${command} 241402034`, `${command} 6287869164526`],
    }, true);
  }

  if (idn.startsWith("confirm") || idn.startsWith("cancel")) {
    const idCache = args[1];
    if (!idCache) return PanjayReact("❌");

    const studentJids = cache[idCache];
    if (!studentJids || studentJids.length === 0) return PanjayReact("❌");

    if (idn.startsWith("confirm")) {
      await Promise.all(studentJids.map(jid => removeITLGStudent(jid)));
      await panjayreply(`Berhasil menghapus ${studentJids.length} student`);
    } else {
      await panjayreply(`Berhasil membatalkan penghapusan ${studentJids.length} student`);
    }

    delete cache[idCache];
    return PanjayReact("✅");
  }

  if (idn.length === 9) {
    const student = await findITLGStudentByNIM(idn);
    if (!student || student.length === 0) {
      return PanjayInvalid({
        title: "STUDENT TIDAK DITEMUKAN",
        message: "Tidak ada student dengan NIM tersebut",
        usage: `${command} <nim|no hp>`,
        examples: [`${command} 241402034`, `${command} 6287869164526`],
      }, true);
    }

    if (student.length === 1) {
      const stu = student[0];
      if (!stu?.jid) return PanjayReact("❌");
      await removeITLGStudent(stu.jid);
      await panjayreply(`Berhasil menghapus 1 data student dengan NIM ${idn} [${stu.jid.split("@")[0]}]`);
      return PanjayReact("✅");
    }

    const idCache = Date.now().toString();
    cache[idCache] = student.map(s => s.jid);
    setTimeout(() => { delete cache[idCache]; }, 5 * 60 * 1000);

    const listTxt = student
      .map(s => `- ${(s.jid.split('@')[0])?.replace(/^\d{2}/, '0')}`)
      .join('\n');

    const txt = `Ditemukan ${student.length} student dengan NIM ${idn}. Dengan list nomor:\n${listTxt}\n\n*Apakah anda yakin untuk menghapus seluruh data di atas?*`;

    await PanjayButton()
      .setTitle("[HAPUS DATA]")
      .setSubtitle("WARNING: setelah konfirmasi, data tidak dapat dikembalikan")
      .setBody(txt)
      .addReply("❌ Batal", `.rmvstu cancel ${idCache}`)
      .addReply("⚠️ Ya", `.rmvstu confirm ${idCache}`)
      .send(replyJid, { quoted: msg });

    return PanjayReact("✅");
  } 
  
  const student = await findITLGStudentByJid(normalizeJid(idn));
  if (!student?.jid) {
    return PanjayInvalid({
      title: "STUDENT TIDAK DITEMUKAN",
      message: "Tidak ada student dengan nomor HP tersebut",
      usage: `${command} <nim|no hp>`,
      examples: [`${command} 241402034`, `${command} 6287869164526`],
    }, true);
  }

  await removeITLGStudent(student.jid);
  await panjayreply(`Berhasil menghapus 1 data student dengan nomor HP ${idn} [${student.nim}]`);
  return PanjayReact("✅");
}
