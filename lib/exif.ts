

import fs from "fs";
import { tmpdir } from "os";
import Crypto from "crypto";
import ff from "fluent-ffmpeg";
import webp from "node-webpmux";
import path from "path";
import type { StickerOptions } from "../types.ts";

const stickerFilter =
  "scale='min(320,iw)':'min(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0,format=rgba";

export async function imageToWebp(media: Buffer): Promise<Buffer> {
  const tmpFileOut = path.join(
    tmpdir(),
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`,
  );
  const tmpFileIn = path.join(
    tmpdir(),
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.jpg`,
  );

  fs.writeFileSync(tmpFileIn, media);

  await new Promise<boolean>((resolve, reject) => {
    ff(tmpFileIn)
      .on("error", reject)
      .on("end", () => resolve(true))
      .addOutputOptions([
        "-vcodec",
        "libwebp",
        "-vf",
        stickerFilter,
      ])
      .save(tmpFileOut);
  });

  const buff = fs.readFileSync(tmpFileOut);
  fs.unlinkSync(tmpFileOut);
  fs.unlinkSync(tmpFileIn);

  return buff;
}

export async function videoToWebp(media: Buffer): Promise<Buffer> {
  const tmpFileOut = path.join(
    tmpdir(),
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`,
  );
  const tmpFileIn = path.join(
    tmpdir(),
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.mp4`,
  );

  fs.writeFileSync(tmpFileIn, media);

  await new Promise<boolean>((resolve, reject) => {
    ff(tmpFileIn)
      .on("error", reject)
      .on("end", () => resolve(true))
      .addOutputOptions([
        "-vcodec",
        "libwebp",
        "-vf",
        stickerFilter,
        "-loop",
        "0",
        "-ss",
        "00:00:00",
        "-t",
        "00:00:05",
        "-preset",
        "default",
        "-an",
        "-vsync",
        "0",
      ])
      .save(tmpFileOut);
  });

  const buff = fs.readFileSync(tmpFileOut);
  fs.unlinkSync(tmpFileOut);
  fs.unlinkSync(tmpFileIn);

  return buff;
}

interface ExifMedia {
  data: Buffer;
  mimetype: string;
}

export async function writeExif(
  media: ExifMedia,
  metadata: StickerOptions = {},
): Promise<string> {
  let wMedia: Buffer;
  if (/webp/.test(media.mimetype)) {
    wMedia = media.data;
  } else if (/image/.test(media.mimetype)) {
    wMedia = await imageToWebp(media.data);
  } else if (/video/.test(media.mimetype)) {
    wMedia = await videoToWebp(media.data);
  } else {
    throw new Error("Media type not supported!");
  }

  const tmpFileIn = path.join(
    tmpdir(),
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`,
  );
  const tmpFileOut = path.join(
    tmpdir(),
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`,
  );

  fs.writeFileSync(tmpFileIn, wMedia);

  const img = new webp.Image();
  const json = {
    "sticker-pack-id": `https://PencariKode.github.com/`,
    "sticker-pack-name": metadata.packname || "Panjay Bot",
    "sticker-pack-publisher": metadata.author || "Panjay",
    emojis: metadata.categories ? metadata.categories : [""],
  };

  const exifAttr = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
    0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
  ]);

  const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
  const exif = Buffer.concat([exifAttr, jsonBuff]);
  exif.writeUIntLE(jsonBuff.length, 14, 4);

  await img.load(tmpFileIn);
  if (fs.existsSync(tmpFileIn)) fs.unlinkSync(tmpFileIn);

  img.exif = exif;
  await img.save(tmpFileOut);

  return tmpFileOut;
}

export async function writeExifImg(
  media: Buffer,
  metadata: StickerOptions,
): Promise<string> {
  return await writeExif({ data: media, mimetype: "image" }, metadata);
}

export async function writeExifVid(
  media: Buffer,
  metadata: StickerOptions,
): Promise<string> {
  return await writeExif({ data: media, mimetype: "video" }, metadata);
}
