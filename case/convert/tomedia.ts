import type { PluginContext, PluginInfo } from "../../types.ts";


import { spawn } from 'child_process';
import { downloadContentFromMessage } from "@whiskeysockets/baileys";

export const info: PluginInfo = {
  name: "Toimage",
  menu: ["Toimage"],
  case: ["toimg", "toimage"],
  description: "Mengubah Sticker Menjadi Gambar",
  hidden: false,
  owner: false,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,
  allowPrivate: true,
};

async function downloadSticker(
  message: Parameters<typeof downloadContentFromMessage>[0],
): Promise<Buffer> {
  const stream = await downloadContentFromMessage(message, "sticker");

  let buffer = Buffer.from([]);

  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }

  return buffer;
}

export default async function handler(panjy: PluginContext) {
  const { command, msg, panjay, replyJid, PanjayText } = panjy;

  switch (command) {
    case "toimg":
    case "toimage":
      {
        const quoted = msg.message?.extendedTextMessage?.contextInfo;
        const quotedMsg = quoted?.quotedMessage;

        if (!quotedMsg?.stickerMessage) {
          return PanjayText("⚠️ Reply Sticker Dengan *Toimg*");
        }

        try {
          const buffer = await downloadSticker(quotedMsg.stickerMessage);

          let out: Buffer<ArrayBufferLike> = Buffer.alloc(0);

          // Convert sticker to image using ffmpeg
          // So we dont need sharp anymore.
          out = await new Promise<Buffer<ArrayBufferLike>>((resolve, reject) => {
            const proc = spawn("ffmpeg", [
              "-i", "pipe:0",
              "-vcodec", "png",
              "-f", "image2pipe",
              "-vframes", "1",
              "pipe:1"
            ]);

            const chunks: Buffer[] = [];
            
            proc.stdout.on('data', (chunk: Buffer) => {
              chunks.push(chunk);
            });

            proc.stderr.on('data', (data: Buffer) => {
              console.error('FFmpeg stderr:', data.toString());
            });

            proc.on('close', (code) => {
              if (code !== 0) {
                reject(new Error(`FFmpeg process exited with code ${code}`));
              } else {
                const buffer = Buffer.concat(chunks);
                if (buffer.length === 0) {
                  reject(new Error("Conversion failed - empty output"));
                } else {
                  resolve(buffer);
                }
              }
            });

            proc.on('error', (err) => {
              reject(err);
            });

            proc.stdin.write(buffer);
            proc.stdin.end();
          });

          await panjay.sendMessage(replyJid, {
            image: out,
            caption: "🎁 Sticker Berhasil Diubah Menjadi Gambar",
          });
        } catch (err) {
          console.error("ToImg Error:", err);
          return PanjayText("❌ Gagal Convert Sticker.");
        }
      }
      break;
  }
}
