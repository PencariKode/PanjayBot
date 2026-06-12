import type { PluginContext, PluginInfo } from "../../types.ts";


import FormData from "form-data";
import axios from "axios";

// Apikeys
const REMOVEBG_API_KEY = "sk-sakanaa-eb8614f0b2dd958a1191b4d0588393f4780b66942af824c2";

export const info: PluginInfo = {
  name: "Remove Background",
  menu: ["removebg"],
  case: ["removebg", "rmbg", "hapusbg", "mbg"],
  description: "Hapus Background HD Ultra Max",
  hidden: false,
  owner: false,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,
  // Tambahin RateLimiter 😡
  allowPrivate: true,
};

export default async function handler(panjy: PluginContext) {
  const {
    panjay,
    msg,
    len,
    replyJid,
    PanjayText,
    PanjayWait,
    mediaType,
  } = panjy;

  let imageMsg = null;
  let sourceLabel = "";

  if (msg.message?.imageMessage) {
    imageMsg = msg.message.imageMessage;
    sourceLabel = "direct";
  }

  const quotedMsg =
    msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!imageMsg && quotedMsg?.imageMessage) {
    imageMsg = quotedMsg.imageMessage;
    sourceLabel = "quoted";
  }

  if (!imageMsg) {
    return PanjayText(
      "⚠️ *Kirim atau reply foto yang ingin dihapus backgroundnya!*"
    );
  }

  await PanjayWait();

  try {
    const imageBuffer = await panjay.downloadMediaMessage(imageMsg);

    const form = new FormData();
    form.append("image", imageBuffer, {
      filename: "photo.jpg",
      contentType: imageMsg.mimetype || "image/jpeg",
    });
    form.append("hd", "true");

    const response = await axios.post(
      "https://removbg-sakanaa.replit.app/api/remove-background",
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${REMOVEBG_API_KEY}`,
        },
        responseType: "arraybuffer",
        timeout: 60_000,
      }
    );

    const resultBuffer = Buffer.from(response.data);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `panjay_rbg_${timestamp}.png`;

    await panjay.sendMessage(
      replyJid,
      {
        document: resultBuffer,
        fileName,
        mimetype: "image/png",
        caption: "*Background Berhasil Dihapus!* ☕",
      },
      { quoted: msg }
    );
  } catch (err) {
    console.error("[REMOVEBG] Error:", err);
    const responseData =
      typeof err === "object" &&
      err !== null &&
      "response" in err &&
      typeof err.response === "object" &&
      err.response !== null &&
      "data" in err.response
        ? err.response.data
        : undefined;
    const errMsg = responseData
      ? Buffer.from(responseData as ArrayBuffer).toString()
      : err instanceof Error
        ? err.message
        : String(err);
    return PanjayText(`😎 *Gagal memproses gambar!*\n\nError: ${errMsg}`);
  }
}
