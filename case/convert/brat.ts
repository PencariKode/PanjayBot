import { createCanvas, loadImage } from "@napi-rs/canvas";
import { bratGen } from "brat-canvas";
import type { PluginContext, PluginInfo } from "../../types.ts";
import { writeExif } from "../../lib/exif.ts";

export const info: PluginInfo = {
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

async function centerBratVertically(buffer: Buffer): Promise<Buffer> {
  const image = await loadImage(buffer);
  const width = image.width;
  const height = image.height;
  const scanCanvas = createCanvas(width, height);
  const scanCtx = scanCanvas.getContext("2d");

  scanCtx.drawImage(image, 0, 0);

  const pixels = scanCtx.getImageData(0, 0, width, height).data;
  let top = height;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const alpha = pixels[index + 3] ?? 0;
      const red = pixels[index] ?? 255;
      const green = pixels[index + 1] ?? 255;
      const blue = pixels[index + 2] ?? 255;

      if (alpha > 0 && (red < 245 || green < 245 || blue < 245)) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }

  if (bottom < top) return buffer;

  const contentHeight = bottom - top + 1;
  const targetTop = Math.round((height - contentHeight) / 2);
  const offsetY = targetTop - top;

  if (offsetY === 0) return buffer;

  const outputCanvas = createCanvas(width, height);
  const outputCtx = outputCanvas.getContext("2d");
  outputCtx.fillStyle = "#ffffff";
  outputCtx.fillRect(0, 0, width, height);
  outputCtx.drawImage(image, 0, offsetY);

  return await outputCanvas.encode("png");
}

export default async function handler(panjy: PluginContext) {
  const { command, q, panjay, replyJid, PanjayText, PanjayInvalid, msg } = panjy;

  switch (command) {
    case "brat": {
      if (!q.trim()) {
        return PanjayInvalid({
          title: "INPUT REQUIRED",
          message: "Masukkan teks yang ingin diubah menjadi brat sticker.",
          example: `${command} Panjay Keren`,
        });
      }

      try {
        const rawBuffer = await bratGen(q.trim(), {
          theme: "white",
          emojiStyle: "apple",
          W: 500,
          H: 500,
          BOX_W: 500,
          BOX_H: 500,
          BOX_PAD: 20,
          BLUR: 2,
        });
        const buffer = await centerBratVertically(rawBuffer);

        if (buffer.length === 0) {
          return PanjayText("❌ Gagal membuat gambar Brat.");
        }

        const stickerPath = await writeExif(
          {
            mimetype: "image/png",
            data: buffer,
          },
          { packname: globalThis.spackname, author: globalThis.sauthor },
        );

        await panjay.sendMessage(
          replyJid,
          { sticker: { url: stickerPath } },
          { quoted: msg },
        );
      } catch (error) {
        console.error(
          "Error Brat Generator:",
          error instanceof Error ? error.message : String(error),
        );
        return PanjayText("❌ *Gagal Membuat Brat Sticker.*");
      }

      break;
    }
  }
}
