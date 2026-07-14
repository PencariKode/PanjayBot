

import fs from "fs";
import {
  imageToWebp,
  videoToWebp,
  writeExifImg,
  writeExifVid,
} from "./exif.ts";
import type { PanjaySocket, StickerInput, StickerOptions } from "../types.ts";
import type { proto, WAMessage } from "@whiskeysockets/baileys";

export default function attachSticker(panjay: PanjaySocket): void {
  panjay.sendImageAsSticker = async (jid: string, path: string | Buffer, quoted?: WAMessage, options: StickerOptions = {}) => {
    const buff = Buffer.isBuffer(path)
      ? path
      : fs.existsSync(path)
        ? fs.readFileSync(path)
        : Buffer.alloc(0);

    let buffer: Buffer | string;

    if (options.packname || options.author) {
      buffer = await writeExifImg(buff, options);
    } else {
      buffer = await imageToWebp(buff) as Buffer;
    }

    await panjay.sendMessage(
      jid,
      { sticker: typeof buffer === "string" ? { url: buffer} : buffer, ...options },
      quoted ? { quoted } : undefined,
    );

    return buffer;
  };

  panjay.sendVideoAsSticker = async (jid: string, path: string | Buffer, quoted?: WAMessage, options: StickerOptions = {}) => {
    const buff = Buffer.isBuffer(path)
      ? path
      : fs.existsSync(path)
        ? fs.readFileSync(path)
        : Buffer.alloc(0);

    let buffer: Buffer | string;

    if (options.packname || options.author) {
      buffer = await writeExifVid(buff, options);
    } else {
      buffer = await videoToWebp(buff);
    }

    await panjay.sendMessage(
      jid,
      { sticker: typeof buffer === "string" ? { url: buffer} : buffer, ...options },
      quoted ? { quoted } : undefined,
    );

    return buffer;
  };
}
