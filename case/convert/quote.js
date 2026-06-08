

import axios from "axios";

export const info = {
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

export default async function handler(panjy) {
  const { command, msg, panjay, panjayWait, replyJid, args, PanjayText } = panjy;

  switch (command) {
    case "qc":
    case "quote":
      {
        const text = args.join(" ");

        if (!text) {
          return PanjayText("*Contoh: .Qc Halo Panjay*");
        }

        try {
          const sender = msg.key.participant || msg.key.remoteJid;
          const name = msg.pushName || "Panjay User";

          let ppUrl;

          try {
            ppUrl = await panjay.profilePictureUrl(sender, "image");
          } catch {
            ppUrl =
              "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
          }

          await panjayWait

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


          const res = await axios.post(
            "https://bot.lyo.su/quote/generate",
            payload,
            {
              headers: { "Content-Type": "application/json" },
            },
          );

          const buffer = Buffer.from(res.data.result.image, "base64");

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
