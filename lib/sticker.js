

import fs from "fs";
import {
  imageToWebp,
  videoToWebp,
  writeExifImg,
  writeExifVid,
} from "./exif.js";

export default function attachSticker(panjay) {
  panjay.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
    let buff = Buffer.isBuffer(path)
      ? path
      : fs.existsSync(path)
        ? fs.readFileSync(path)
        : Buffer.alloc(0);

    let buffer;

    if (options.packname || options.author) {
      buffer = await writeExifImg(buff, options);
    } else {
      buffer = await imageToWebp(buff);
    }

    await panjay.sendMessage(
      jid,
      { sticker: { url: buffer }, ...options },
      { quoted },
    );

    return buffer;
  };

  panjay.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
    let buff = Buffer.isBuffer(path)
      ? path
      : fs.existsSync(path)
        ? fs.readFileSync(path)
        : Buffer.alloc(0);

    let buffer;

    if (options.packname || options.author) {
      buffer = await writeExifVid(buff, options);
    } else {
      buffer = await videoToWebp(buff);
    }

    await panjay.sendMessage(
      jid,
      { sticker: { url: buffer }, ...options },
      { quoted },
    );

    return buffer;
  };
}
