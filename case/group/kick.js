

export const info = {
  name: "Kick Member",

  menu: ["Kick"],
  case: ["kick"],

  description: "Penjelasan Singkat Fitur",
  hidden: false,

  owner: false,
  premium: false,
  group: true,
  private: false,
  admin: true,
  botAdmin: false,

  allowPrivate: false,
};

// Handler Utama
export default async function handler(panjy) {
  const { command, panjay, msg, len, replyJid, PanjayText } = panjy;

  switch (command) {
    case "kick":
      {
        const quoted = msg.message?.extendedTextMessage?.contextInfo;
        if (!quoted?.participant)
          return PanjayText(
            "❌ *Gagal. Reply Pesan Anggota Yang Ingin Anda Keluarkan.*",
          );

        const targetJid = quoted.participant;

        const targetMention = `@${targetJid.split("@")[0]}`;

        try {
          await panjay.groupParticipantsUpdate(replyJid, [targetJid], "remove");

          await panjay.sendMessage(
            replyJid,
            {
              text: `🎁 *Berhasil Mengeluarkan ${targetMention} dari Grup.*`,
              mentions: [targetJid],
            },
            { quoted: msg },
          );
        } catch (err) {
          console.error("Kick Error:", err);
          PanjayText(
            "⚠️ *Gagal. Pastikan Saya Adalah Admin di Grup Ini dan Anggota Tersebut Bukan Pembuat Grup.*",
          );
        }
      }
      break;
  }
}
