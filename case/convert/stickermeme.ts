import type { PluginContext, PluginInfo } from "../../types.ts";
import fs from "fs";
import path from "path";
import Crypto from "crypto";
import { tmpdir } from "os";
import { spawn } from "child_process";
import {
  DEF_MEDIA_HOST,
  downloadContentFromMessage,
  type proto,
} from "@whiskeysockets/baileys";
import webp, { type WebPFrame } from "node-webpmux";
import { writeExif } from "../../lib/exif.ts";

export const info: PluginInfo = {
  name: "Sticker Meme",
  menu: ["Sticker Meme"],
  case: ["smeme", "stickermeme"],
  description: "Membuat Sticker Meme Dari Gambar, Video, atau Sticker",

  hidden: false,
  owner: false,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,
  allowPrivate: true,
};

const IMPACT_FONT = "C\\:/Windows/Fonts/impact.ttf";
type MediaKind = "image" | "video" | "sticker";
type Downloadable = Parameters<typeof downloadContentFromMessage>[0];

function hasDirectPath(message: Downloadable): boolean {
  return (
    typeof message === "object" &&
    message !== null &&
    "directPath" in message &&
    typeof message.directPath === "string" &&
    message.directPath.length > 0
  );
}

function isWhatsappCdnDnsFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const cause =
    "cause" in error && error.cause instanceof Error ? error.cause : error;

  return (
    cause.message.includes("ENOTFOUND") &&
    cause.message.includes("a.whatsapp.net")
  );
}

async function streamToBuffer(
  stream: Awaited<ReturnType<typeof downloadContentFromMessage>>,
): Promise<Buffer> {
  let buffer = Buffer.from([]);

  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }

  return buffer;
}

async function downloadMedia(
  message: Downloadable,
  type: Parameters<typeof downloadContentFromMessage>[1],
): Promise<Buffer> {
  try {
    return await streamToBuffer(await downloadContentFromMessage(message, type));
  } catch (error) {
    if (!isWhatsappCdnDnsFailure(error) || !hasDirectPath(message)) {
      throw error;
    }

    return await streamToBuffer(
      await downloadContentFromMessage(message, type, {
        host: DEF_MEDIA_HOST,
      }),
    );
  }
}

interface MemeMedia {
  media: Downloadable | null;
  type: MediaKind | null;
  animated: boolean;
}

function getMedia(message: proto.IMessage | null | undefined): MemeMedia {
  const quoted = message?.extendedTextMessage?.contextInfo?.quotedMessage;

  if (message?.imageMessage)
    return { media: message.imageMessage, type: "image", animated: false };
  if (message?.videoMessage)
    return { media: message.videoMessage, type: "video", animated: true };
  if (message?.stickerMessage)
    return {
      media: message.stickerMessage,
      type: "sticker",
      animated: Boolean(message.stickerMessage.isAnimated),
    };

  if (quoted?.imageMessage)
    return { media: quoted.imageMessage, type: "image", animated: false };
  if (quoted?.videoMessage)
    return { media: quoted.videoMessage, type: "video", animated: true };
  if (quoted?.stickerMessage)
    return {
      media: quoted.stickerMessage,
      type: "sticker",
      animated: Boolean(quoted.stickerMessage.isAnimated),
    };

  return { media: null, type: null, animated: false };
}

function parseText(text: string): { top: string; bottom: string } {
  const separator = text.includes("|") ? "|" : "/";
  const [top = "", ...bottom] = text.split(separator);

  return {
    top: top.trim().toUpperCase(),
    bottom: bottom.join(separator).trim().toUpperCase(),
  };
}

function escapeDrawtext(text: string): string {
  return text
    .replaceAll("\\", "\\\\")
    .replaceAll(":", "\\:")
    .replaceAll("'", "\\'")
    .replaceAll("%", "\\%")
    .replaceAll(",", "\\,");
}

function drawtext(text: string, y: string): string {
  return [
    "drawtext=",
    `fontfile='${IMPACT_FONT}'`,
    `:text='${escapeDrawtext(text)}'`,
    ":fontcolor=white",
    ":fontsize=44",
    ":borderw=4",
    ":bordercolor=black",
    ":x=(w-text_w)/2",
    `:y=${y}`,
  ].join("");
}

function buildFilters(top: string, bottom: string): string {
  const filters = [
    "scale=512:512:force_original_aspect_ratio=decrease",
    "pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0",
    "setsar=1",
    "fps=15",
    "format=rgba",
  ];

  if (top) filters.push(drawtext(top, "24"));
  if (bottom) filters.push(drawtext(bottom, "h-text_h-24"));

  return filters.join(",");
}

async function runFfmpeg(args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", args);
    const stderr: string[] = [];

    ffmpeg.stderr.on("data", (chunk: Buffer) => {
      stderr.push(chunk.toString("utf8"));
    });

    ffmpeg.on("error", reject);
    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `FFmpeg exited with code ${code}\n${stderr.join("").slice(-2000)}`,
        ),
      );
    });
  });
}

async function convertAnimatedInputToMp4(
  inputPath: string,
): Promise<string> {
  const tmpMp4 = path.join(
    tmpdir(),
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.mp4`,
  );
  const args = [
    "-y",
    "-i",
    inputPath,
    "-t",
    "00:00:05",
    "-vf",
    "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0,setsar=1,fps=15,format=yuv420p",
    "-an",
    "-movflags",
    "+faststart",
    tmpMp4,
  ];

  await runFfmpeg(args);
  return tmpMp4;
}

async function processStaticWebpFrame(
  frameBuffer: Buffer,
  top: string,
  bottom: string,
): Promise<Buffer> {
  const tmpIn = path.join(
    tmpdir(),
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`,
  );
  const tmpOut = path.join(
    tmpdir(),
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`,
  );

  fs.writeFileSync(tmpIn, frameBuffer);

  try {
    await runFfmpeg([
      "-y",
      "-i",
      tmpIn,
      "-vcodec",
      "libwebp",
      "-vf",
      buildFilters(top, bottom),
      "-vframes",
      "1",
      "-lossless",
      "0",
      "-q:v",
      "75",
      tmpOut,
    ]);

    return fs.readFileSync(tmpOut);
  } finally {
    if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn);
    if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
  }
}

function toFrameDelay(frame: WebPFrame | undefined): number {
  const delay = frame?.delay;
  return typeof delay === "number" && delay > 0 ? delay : 100;
}

async function makeAnimatedWebpStickerMeme(
  buffer: Buffer,
  top: string,
  bottom: string,
): Promise<Buffer> {
  const image = new webp.Image();
  await image.load(buffer);
  image.iccp = undefined;
  image.exif = undefined;
  image.xmp = undefined;

  if (!image.hasAnim) {
    return await processStaticWebpFrame(buffer, top, bottom);
  }

  const sourceFrames = image.frames ?? [];
  const frameBuffers = await image.demux({ buffers: true });
  if (!frameBuffers || frameBuffers.length === 0) {
    throw new Error("Animated sticker tidak memiliki frame yang bisa diproses.");
  }

  const processedFrames: WebPFrame[] = [];
  let totalDuration = 0;

  for (let index = 0; index < frameBuffers.length; index += 1) {
    const frameBuffer = frameBuffers[index];
    if (!frameBuffer) continue;

    const delay = toFrameDelay(sourceFrames[index]);
    if (processedFrames.length >= 75 || totalDuration >= 5000) break;

    processedFrames.push({
      buffer: await processStaticWebpFrame(frameBuffer, top, bottom),
      delay,
      x: 0,
      y: 0,
      blend: true,
      dispose: false,
    });
    totalDuration += delay;
  }

  const output = await webp.Image.save(null, {
    width: 512,
    height: 512,
    frames: processedFrames,
    loops: 0,
    bgColor: [0, 0, 0, 0],
  });

  if (!Buffer.isBuffer(output)) {
    throw new Error("Gagal membuat buffer sticker animasi.");
  }

  return output;
}

async function makeMemeSticker(
  buffer: Buffer,
  type: MediaKind,
  animated: boolean,
  top: string,
  bottom: string,
): Promise<Buffer> {
  if (type === "sticker") {
    return await makeAnimatedWebpStickerMeme(buffer, top, bottom);
  }

  const isVideo = type === "video";
  const ext = isVideo ? "mp4" : "jpg";
  const tmpIn = path.join(
    tmpdir(),
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.${ext}`,
  );
  const tmpOut = path.join(
    tmpdir(),
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`,
  );
  let tmpMp4: string | null = null;

  fs.writeFileSync(tmpIn, buffer);

  try {
    const inputPath = animated ? await convertAnimatedInputToMp4(tmpIn) : tmpIn;
    tmpMp4 = inputPath === tmpIn ? null : inputPath;

    const args = [
      "-y",
      "-i",
      inputPath,
      "-vcodec",
      "libwebp",
      "-vf",
      buildFilters(top, bottom),
      "-loop",
      "0",
      "-preset",
      "default",
      "-an",
    ];

    if (animated) args.push("-t", "00:00:05", "-vsync", "0");
    else args.push("-vframes", "1");

    args.push(tmpOut);

    await runFfmpeg(args);

    return fs.readFileSync(tmpOut);
  } finally {
    if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn);
    if (tmpMp4 && fs.existsSync(tmpMp4)) fs.unlinkSync(tmpMp4);
    if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
  }
}

export default async function handler(panjy: PluginContext) {
  const { command, q, msg, len, panjay, replyJid, PanjayText, PanjayInvalid, PanjayWait } = panjy;

  switch (command) {
    case "smeme":
    case "stickermeme":
      {
        const { media, type, animated } = getMedia(msg.message);

        if (!media) {
          return PanjayInvalid({
            title: "MEDIA REQUIRED",
            message: "Kirim atau reply gambar, video, atau sticker untuk dibuat meme.",
            example: `${command} PANJAY|Keren Banget`,
          });
        }

        if (!q?.trim()) {
          return PanjayInvalid({
            title: "INPUT REQUIRED",
            message: "Masukkan teks atas dan/atau teks bawah untuk sticker meme.",
            usage: "teks atas|teks bawah",
            example: `${command} PANJAY|Keren Banget`,
          });
        }

        const seconds =
          "seconds" in media && typeof media.seconds === "number"
            ? media.seconds
            : 0;

        await PanjayWait();

        if (animated && seconds > 5) {
          return PanjayInvalid({
            title: "INVALID MEDIA",
            message: "Durasi video atau sticker animasi maksimal 5 detik.",
            example: `${command} PANJAY|Keren Banget`,
          });
        }

        // if (animated) {
        //   console.log("wow");
        //   await PanjayText(globalThis.mess.wait);
        // }

        try {
          const { top, bottom } = parseText(q);
          if (!type)
            return PanjayInvalid({
              title: "INVALID MEDIA",
              message: "Media tidak valid untuk dibuat sticker meme.",
              example: `${command} PANJAY|Keren Banget`,
            });



          const buffer = await downloadMedia(media, type);
          const stickerBuffer = await makeMemeSticker(
            buffer,
            type,
            animated,
            top,
            bottom,
          );
          const stickerPath = await writeExif(
            { mimetype: "image/webp", data: stickerBuffer },
            { packname: globalThis.spackname, author: globalThis.sauthor },
          );

          await panjay.sendMessage(
            replyJid,
            { sticker: { url: stickerPath } },
            { quoted: msg },
          );
        } catch (err) {
          console.error("Sticker Meme Error:", err);
          return PanjayInvalid({ title: "GAGAL", message: "Gagal Membuat Sticker Meme." });
        }
      }
      break;
  }
}
