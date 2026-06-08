import fs from "fs";
import path from "path";
import Crypto from "crypto";
import { tmpdir } from "os";
import { spawn } from "child_process";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import { writeExif } from "../../lib/exif.js";

export const info = {
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

async function downloadMedia(message, type) {
  const stream = await downloadContentFromMessage(message, type);
  let buffer = Buffer.from([]);

  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }

  return buffer;
}

function getMedia(message) {
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

function parseText(text) {
  const separator = text.includes("|") ? "|" : "/"; 
  const [top = "", ...bottom] = text.split(separator);

  return {
    top: top.trim().toUpperCase(),
    bottom: bottom.join(separator).trim().toUpperCase(),
  };
}

function escapeDrawtext(text) {
  return text
    .replaceAll("\\", "\\\\")
    .replaceAll(":", "\\:")
    .replaceAll("'", "\\'")
    .replaceAll("%", "\\%")
    .replaceAll(",", "\\,");
}

function drawtext(text, y) {
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

async function makeMemeSticker(buffer, type, animated, top, bottom) {
  const ext = type === "video" ? "mp4" : type === "sticker" ? "webp" : "jpg";
  const tmpIn = path.join(
    tmpdir(),
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.${ext}`,
  );
  const tmpOut = path.join(
    tmpdir(),
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`,
  );

  fs.writeFileSync(tmpIn, buffer);

  const filters = [
    "scale=512:512:force_original_aspect_ratio=decrease",
    "pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0",
    "setsar=1",
    "fps=15",
    "format=rgba",
  ];

  if (top) filters.push(drawtext(top, "24"));
  if (bottom) filters.push(drawtext(bottom, "h-text_h-24"));

  const args = [
    "-y",
    "-i",
    tmpIn,
    "-vcodec",
    "libwebp",
    "-vf",
    filters.join(","),
    "-loop",
    "0",
    "-preset",
    "default",
    "-an",
  ];

  if (animated) args.push("-t", "00:00:05", "-vsync", "0");
  else args.push("-vframes", "1");

  args.push(tmpOut);

  try {
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", args);

      ffmpeg.on("error", reject);
      ffmpeg.on("close", (code) => {
        if (code === 0) resolve(true);
        else reject(new Error(`FFmpeg exited with code ${code}`));
      });
    });

    return fs.readFileSync(tmpOut);
  } finally {
    if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn);
    if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
  }
}

export default async function handler(panjy) {
  const { command, q, msg, len, panjay, replyJid, PanjayText } = panjy;

  switch (command) {
    case "smeme":
    case "stickermeme":
      {
        const { media, type, animated } = getMedia(msg.message);

        if (!media) {
          return PanjayText(
            "Kirim atau Reply Gambar/Video/Sticker Dengan Caption *.smeme teks atas|teks bawah*",
          );
        }

        if (!q?.trim()) {
          return PanjayText("Contoh: *.smeme PANJAY|Keren Banget*");
        }

        if (animated && (media.seconds || 0) > 5) {
          return PanjayText("Maksimal Durasi Video/Sticker 5 Detik!");
        }

        try {
          const { top, bottom } = parseText(q);
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
            { quoted: len || msg },
          );
        } catch (err) {
          console.error("Sticker Meme Error:", err);
          return PanjayText("Gagal Membuat Sticker Meme.");
        }
      }
      break;
  }
}
