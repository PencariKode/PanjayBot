import { addITLGStudent, findITLGStudentByJid, findITLGStudentByNIM } from "../../lib/database.ts";
import type { PluginContext, PluginInfo } from "../../types.ts";

export const info: PluginInfo = {
  name: "Alter ITLG Student profile",

  menu: ["alter <nim baru> [nama baru]"],
  case: ["alter", "alteritlg"],

  description: "Penjelasan Singkat Fitur",
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


  
  if (!args.length) {
    return PanjayInvalid({
      title: "NIM REQUIRED",
      message: `Penggunaan perintah ${command} kurang tepat!`,
      usage: `${command} <nim baru> [nama lengkap]`,
      command: `${command} 241402034 Panji Briant Depari`,
    });
  }

  const [rawNim, ...nameParts] = args;
  const nim = (rawNim as string).trim();

  if (!/^[12]\d1402\d{3}$/.test(nim)) {
    return PanjayInvalid({
      title: "FORMAT NIM SALAH",
      message: "Gunakan format NIM yang benar",
      usage: `${command} <nim baru> [nama lengkap]`,
      command: `${command} 241402034 Panji Briant Depari`,
    });
  }

  const nama = nameParts.length ? nameParts.join(" ").trim() : undefined;
  if (nama && nama.length < 2) {
    return PanjayInvalid({
      title: "NAMA TERLALU PENDEK",
      message: "Saat ini sistem tidak menerima nama dengan panjang seperti itu",
    });
  }

  const jid = msg.key.fromMe 
    ? "6283840349166@s.whatsapp.net" 
    : (isGroup ? msg.key.participantAlt : msg.key.remoteJidAlt);

  if (!jid) return panjayreply("Terjadi kesalahan dengan perintah ini!");

  try {
    const [isJidEnrolled, existingStudents] = await Promise.all([
      findITLGStudentByJid(jid),
      findITLGStudentByNIM(nim)
    ]);

    if (!isJidEnrolled) return PanjayInvalid({
        title: "NOMOR BELUM TERDAFTAR",
        message: `Nomor Anda belum terdaftar. Silahkan gunakan perintah \`enroll\` untuk mendaftar terlebih dahulu.`,
        command: `enroll <nim> [nama lengkap]`,
    });

    if (isJidEnrolled.isVerified) return PanjayInvalid({
      title: "NOMOR TERVERIFIKASI",
      message: `Anda tidak dapat mengubah profil nomor Anda karena nomor tersebut telah terverifikasi${isJidEnrolled.nim ? ` dengan NIM ${isJidEnrolled.nim}` : ""}. Silahkkan hubungi Aslab Anda jika terdapat kesalahan.`,
      command: null,
    });

    await addITLGStudent(jid, isJidEnrolled.isVerified, nama, nim);
    
    const totalNum = existingStudents.length;
    const infoTambahan = totalNum > 0 ? `\nNIM ${nim} memiliki ${totalNum + 1} nomor terdaftar.` : "";
    const infoNama = nama ? ` dan Nama ${nama}` : "";

    return panjayreply(`Anda telah berhasil mengubah profile nomor Anda. Dengan NIM ${nim}${infoNama}.${infoTambahan}`);
  } catch (error) {
    return panjayreply(`Terjadi kesalahan saat mendaftar: ${error instanceof Error ? error.message : error}`);
  }
}
