import type { PluginContext, PluginInfo } from "../../types.ts";
import { addITLGStudent } from "../../lib/database.ts";
import { jidNormalizedUser } from "@whiskeysockets/baileys";
import { botConfig } from "../../config.ts";

export const info: PluginInfo = {
  name: "Enroll seluruh Mahasiswa di grup",

  menu: ["enrollall"],
  case: ["daftarall", "enrollall"],

  description: "Mengenroll seluruh mahasiswa di grup ke dalam sistem ITLG",
  hidden: false,

  owner: true,
  premium: false,
  group: true,
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

  const botJid = jidNormalizedUser(panjay.authState.creds?.me?.id);

  try {
    const gcMetadata = await panjay.groupMetadata(replyJid);
    const allMembers = gcMetadata.participants.map(
      (member) => member.phoneNumber,
    );

    let cnt = 0;
    for (const member of allMembers) {
      if (!member) continue;
      if (member === botJid) continue;
      if (member === botConfig.owner.jid) continue;

      console.log(`Enrolling ${member}`, botConfig.owner.jid, member === botConfig.owner.jid)
      await addITLGStudent(member);
      cnt++;
    }

    if (cnt > 0) panjayreply(`Berhasil mendaftarkan ${cnt} mahasiswa`);
    PanjayReact("succ");
  } catch (error) {
    panjayreply(`Terjadi kesalahan saat mendaftarkan mahasiswa: ${error}`);
  }
}
