

import axios from "axios";
import { writeExif } from "../../lib/exif.js";

export const info = {
  name: "Brat",

  menu: ["Brat"],
  case: ["brat"],

  description: "Brat Sticker",
  hidden: false,

  owner: false,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,

  allowPrivate: true,
};

export default async function handler(panjy) {
  const { command, q, panjay, len, replyJid, PanjayText, msg } = panjy;

  switch (command) {
    case "brat":
      {
        if (!q)
          return PanjayText(
            "⚠ *Masukkan Teks Yang Ingin Diubah.*\n\nContoh : *.brat Panjay Keren*",
          );

        try {
          const encodedText = encodeURIComponent(q.trim());
          // const apiUrl = `https://api.fromscratch.web.id/v1/api/generate/brat?text=${encodedText}`;

          // const { data: response } = await axios.get(apiUrl);

          // if (response.status !== 200 || !response.data?.imageUrl) {
          //   console.error("API Brat Error Response:", response);
          //   return PanjayText(
          //     `❌ *Gagal Membuat Brat:*\nStatus: ${response.message || "Error tidak diketahui"}`,
          //   );
          // }

          const imageUrl = `https://aqul-brat.hf.space/?text=${encodedText}`;

          const { data: imageBuffer } = await axios.get(imageUrl, {
            responseType: "arraybuffer",
          });

          if (!imageBuffer || imageBuffer.length === 0) {
            return PanjayText("❌ Gagal Mengunduh Gambar Hasil Brat.");
          }

          const stickerPath = await writeExif(
            {
              mimetype: "image/jpeg",
              data: imageBuffer,
            },
            { packname: globalThis.spackname, author: globalThis.sauthor },
          );

          await panjay.sendMessage(
            replyJid,
            { sticker: { url: stickerPath } },
            { quoted: msg },
          );
        } catch (error) {
          console.error("Error Brat Generator via API:", error.message);
          PanjayText(`❌ *Terlalu Banyak Request, Harap Memberi Jeda.*`);
        }
      }
      break;
  }
}
