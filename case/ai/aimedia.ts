import type { PluginContext, PluginInfo } from "../../types.ts";
/*   
  
   Made By Ditzzy
   Base : Panjay 
   WhatsApp : wa.me/6283829814737 
   Telegram : t.me/ipanjay 
   Youtube : @Panjay 
  
   Channel : https://whatsapp.com/channel/0029VaGdzBSGZNCmoTgN2K0u 
  
   Copy Code?, Recode?, Rename?, Reupload?, Reseller? Taruh Credit Ya :D 
  
   Mohon Untuk Tidak Menghapus Watermark Di Dalam Kode Ini 
  
 */

import axios from "axios";
import FormData from "form-data";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";

export const info: PluginInfo = {
  name: "Remini",

  menu: ["Remini"],
  case: ["hd", "remini"],

  description: "AI Untuk Media Seperti Photo",
  hidden: false,

  owner: false,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,

  allowPrivate: false,
};

interface EnhanceOptions {
  method?: number;
  size?: "low" | "medium" | "high";
}

async function enhancer(
  buffer: Buffer,
  { method = 1, size = "low" }: EnhanceOptions = {},
): Promise<Buffer> {
  const availableSizes = ["low", "medium", "high"];

  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("Image buffer is required");
  }

  if (method < 1 || method > 4) {
    throw new Error("Available methods: 1, 2, 3, 4");
  }

  if (!availableSizes.includes(size)) {
    throw new Error(`Available sizes: ${availableSizes.join(", ")}`);
  }

  const form = new FormData();
  form.append("method", method.toString());
  form.append("is_pro_version", "false");
  form.append("is_enhancing_more", "false");
  form.append("max_image_size", size);
  form.append("file", buffer, `${Date.now()}.jpg`);

  try {
    const response = await axios.post("https://ihancer.com/api/enhance", form, {
      headers: {
        ...form.getHeaders(),
        "accept-encoding": "gzip",
        host: "ihancer.com",
        "user-agent": "Dart/3.5 (dart:io)",
      },
      responseType: "arraybuffer",
    });

    return Buffer.from(response.data);
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    }
    throw new Error("Unknown error occurred");
  }
}

async function downloadImage(
  message: Parameters<typeof downloadContentFromMessage>[0],
): Promise<Buffer> {
  const stream = await downloadContentFromMessage(message, "image");

  let buffer = Buffer.from([]);

  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }

  return buffer;
}

export default async function handler(panjy: PluginContext) {
  const { command, msg, panjay, replyJid, PanjayText, PanjayInvalid, PanjayWait, len } = panjy;

  switch (command) {
    case "hd":
    case "remini": {
      const quoted = msg.message?.extendedTextMessage?.contextInfo;
      const quotedMsg = quoted?.quotedMessage;

      const imageMessage = quotedMsg?.imageMessage ?? msg.message?.imageMessage;

      if (!imageMessage) {
        return PanjayInvalid({
          title: "IMAGE REQUIRED",
          message: "Kirim atau reply gambar yang ingin ditingkatkan.",
          examples: [`${command}`],
        });
      }

      PanjayWait();

      try {
        const buffer = await downloadImage(imageMessage);
        const enhancedImage = await enhancer(buffer, {
          method: 1,
          size: "high",
        });

        await panjay.sendMessage(
          replyJid,
          {
            image: enhancedImage,
            caption:
              "🎁 *Gambar Berhasil Ditingkatkan*\n*[+] Thanks To Ditzzy For His Commits*",
          },
          { quoted: msg },
        );
      } catch (err) {
        console.error("Enhancer Error:", err);
        return PanjayInvalid({ title: "GAGAL", message: "Gagal Meningkatkan Gambar." });
      }

      break;
    }
  }
}
