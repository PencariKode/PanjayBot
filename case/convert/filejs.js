

export const info = {
  name: "File JavaScript",

  menu: ["Filejs"],
  case: ["filejs"],

  description: "Ubah Teks Kode Menjadi File JavaScript",
  hidden: false,

  owner: false,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,

  allowPrivate: false,
};

export default async function handler(panjy) {
  const { command, q, panjay, msg, replyJid, PanjayText, PanjayWait } = panjy;

  switch (command) {
    case "filejs":
      {
        const quoted = msg.message?.extendedTextMessage?.contextInfo;
        const quotedMsg = quoted?.quotedMessage;

        if (!quotedMsg || !quotedMsg.conversation) {
          return PanjayText(
            "⚠️ Harap *Reply* Pesan Yang Ingin Anda Buat Menjadi File .js",
          );
        }
        const fileContent =
          quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || "";

        if (fileContent.length === 0) {
          return PanjayText(
            "❌ Pesan Yang Direply Tidak Mengandung Teks (kode) Untuk Dibuat File.",
          );
        }
        let fileName = q ? q.trim() : "Panjay_JS";

        fileName = fileName.replace(/[^\w\s-]/g, "").trim();

        if (fileName.length === 0) {
          fileName = "Panjay_JS";
        }

        PanjayWait();

        try {
          const fileBuffer = Buffer.from(fileContent, "utf-8");

          await panjay.sendMessage(
            replyJid,
            {
              document: fileBuffer,
              fileName: `${fileName}.js`,
              mimetype: "application/javascript",
              caption: `🎁 *File JavaScript Berhasil Dibuat!*`,
            },
            { quoted: msg },
          );
        } catch (error) {
          console.error("Error Make File JS:", error);
          PanjayText(globalThis.mess.error);
        }
      }
      break;
  }
}
