import type { PluginContext, PluginInfo } from "../../types.ts";


import { downloadContentFromMessage } from "@whiskeysockets/baileys";

export const info: PluginInfo = {
  name: "Sticker",
  menu: ["Sticker"],
  case: ["s", "stiker", "sticker"],
  description: "Membuat Sticker Dari Gambar atau Video",

  hidden: false,
  owner: false,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,
  allowPrivate: true,
};

async function downloadMedia(
  message: Parameters<typeof downloadContentFromMessage>[0],
  type: Parameters<typeof downloadContentFromMessage>[1],
): Promise<Buffer> {
  const stream = await downloadContentFromMessage(message, type);
  let buffer = Buffer.from([]);

  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }

  return buffer;
}

export default async function handler(panjy: PluginContext) {
  const { command, msg, len, panjay, replyJid, PanjayText, PanjayInvalid } = panjy;

  switch (command) {
    case "s":
    case "stiker":
    case "sticker":
      {
        const message = msg.message;

        const quoted = message?.extendedTextMessage?.contextInfo?.quotedMessage;

        let media: Parameters<typeof downloadContentFromMessage>[0] | null = null;
        let type: "image" | "video" | null = null;

        if (message?.imageMessage) {
          media = message.imageMessage;
          type = "image";
        } else if (message?.videoMessage) {
          media = message.videoMessage;
          type = "video";
        } else if (quoted?.imageMessage) {
          media = quoted.imageMessage;
          type = "image";
        } else if (quoted?.videoMessage) {
          media = quoted.videoMessage;
          type = "video";
        }

        if (!media) {
          return PanjayInvalid({
            title: "MEDIA REQUIRED",
            message: "Kirim atau reply gambar/video untuk dijadikan sticker.",
            examples: [`${command}`],
          });
        }

        try {
          if (type === "image") {
            const buffer = await downloadMedia(media, "image");

            await panjay.sendImageAsSticker(replyJid, buffer, len, {
              packname: globalThis.spackname,
              author: globalThis.sauthor,
            });
          } else if (type === "video") {
            const seconds =
              "seconds" in media && typeof media.seconds === "number"
                ? media.seconds
                : 0;

            if (seconds > 5)
              return PanjayInvalid({
                title: "INVALID MEDIA",
                message: "Durasi video maksimal 5 detik.",
                example: `${command}`,
              });

            const buffer = await downloadMedia(media, "video");

            await panjay.sendVideoAsSticker(replyJid, buffer, len, {
              packname: globalThis.spackname,
              author: globalThis.sauthor,
            });
          }
        } catch (err) {
          console.error("Sticker Error:", err);

          return PanjayText("❌ Gagal Membuat Sticker.");
        }
      }
      break;
  }
}
