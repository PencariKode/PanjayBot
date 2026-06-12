import type { PluginContext, PluginInfo } from "../../types.ts";


import axios from "axios";

export const info: PluginInfo = {
  name: "Quote Sticker",
  menu: ["Quote"],
  case: ["qc", "quote"],
  description: "Membuat Sticker Quote",
  hidden: false,
  owner: false,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,
  allowPrivate: true,
};

interface QuoteResponse {
  result?: {
    image?: string;
  };
}

export default async function handler(panjy: PluginContext) {
  const { command, msg, panjay, PanjayWait, replyJid, args, PanjayText, PanjayInvalid } = panjy;

  switch (command) {
    case "qc":
    case "quote":
      {
        const text = args.join(" ");

        if (!text) {
          return PanjayInvalid({
            title: "INPUT REQUIRED",
            message: "Masukkan teks yang ingin dibuat menjadi quote sticker.",
            example: `${command} Halo Panjay`,
          });
        }

        try {
          const sender = msg.key.participant || msg.key.remoteJid;
          if (!sender)
            return PanjayInvalid({
              title: "INVALID SENDER",
              message: "Sender pesan tidak valid.",
              example: `${command} Halo Panjay`,
            });
          const name = msg.pushName || "Panjay User";

          let ppUrl: string;

          try {
            ppUrl = await panjay.profilePictureUrl(sender, "image");
          } catch {
            ppUrl =
              "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
          }

          await PanjayWait();

          const payload = {
            type: "quote",
            format: "png",
            backgroundColor: "#ffffff",
            width: 512,
            height: 768,
            scale: 2,
            messages: [
              {
                entities: [],
                avatar: true,
                from: {
                  id: 1,
                  name: name,
                  photo: { url: ppUrl },
                },
                text: text,
                replyMessage: {},
              },
            ],
          };


          const res = await axios.post<QuoteResponse>(
            "https://bot.lyo.su/quote/generate",
            payload,
            {
              headers: { "Content-Type": "application/json" },
            },
          );

          const image = res.data.result?.image;
          if (!image) throw new Error("Quote API tidak mengembalikan gambar.");
          const buffer = Buffer.from(image, "base64");

          await panjay.sendImageAsSticker(replyJid, buffer, msg, {
            packname: globalThis.spackname,
            author: globalThis.sauthor,
          });
        } catch (err) {
          console.error("QC Error:", err);
          return PanjayText("❌ Gagal Membuat Quote Sticker.");
        }
      }
      break;
  }
}
