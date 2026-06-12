

// Import Module
import {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  downloadContentFromMessage,
  getContentType,
} from "@whiskeysockets/baileys";
import { pino } from "pino";
import chalk from "chalk";
import readline from "readline";
import os from "os";
import fs from "fs";

import attachSticker from "./lib/sticker.ts";
import { botConfig } from "./config.ts";
import type {
  HandlerMeta,
  MessageUpsert,
  PanjaySocket,
} from "./types.ts";

// Simpan ID Interval Polling
let pollingIntervalId: NodeJS.Timeout | null = null;

// Fungsi Input Terminal
async function question(prompt: string): Promise<string> {
  process.stdout.write(prompt);
  const r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    r1.question("", (ans) => {
      r1.close();
      resolve(ans);
    });
  });
}

async function connectToWhatsApp(): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState(
    botConfig.whatsapp.sessionDir,
  );

  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`${botConfig.identity.name} Using WA v${version.join(".")}, isLatest: ${isLatest}`);

  const panjay = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: !botConfig.whatsapp.usePairingCode,
    auth: state,
    browser: botConfig.whatsapp.browser,
    version,
    syncFullHistory: true,
    generateHighQualityLinkPreview: true,
    getMessage: async () => undefined,
  }) as unknown as PanjaySocket;

  attachSticker(panjay);

  // startPolling(panjay)

  // Handle Pairing
  if (botConfig.whatsapp.usePairingCode && !panjay.authState.creds.registered) {
    try {
      const phoneNumber = await question(
        "☘️ Masukan Nomor Yang Diawali Dengan 62 :\n",
      );
      const code = await panjay.requestPairingCode(phoneNumber.trim());
      console.log(`🎁 Pairing Code : ${code}`);
    } catch (err) {
      console.error("Failed to get pairing code:", err);
    }
  }

  panjay.ev.on("creds.update", saveCreds);

  panjay.ev.on("connection.update", (update) => {
    const { connection } = update;
    if (connection === "close") {
      console.log(chalk.red("❌  Koneksi Terputus, Mencoba Menyambung Ulang"));

      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
        console.log(chalk.yellow("[POLLING] Polling lama dihentikan."));
      }

      // Sambungkan Ulang
      void connectToWhatsApp();
    } else if (connection === "open") {
      console.log(chalk.green("✔  Bot Berhasil Terhubung Ke WhatsApp"));
    }
  });

  // Console Log
  panjay.ev.on("messages.upsert", async (m: MessageUpsert) => {
    const msg = m.messages[0];
    if (!msg?.message) return;

    const sender = msg.key.remoteJid;
    if (!sender) return;
    const pushname = msg.pushName || botConfig.whatsapp.defaultPushName;

    // Deteksi Tipe Pesan
    const messageType = getContentType(msg.message);
    let body = "";
    let mediaType: string | null = null;

    switch (messageType) {
      case "conversation":
        body = msg.message.conversation ?? "";
        break;
      case "extendedTextMessage":
        body = msg.message.extendedTextMessage?.text ?? "";
        break;
      case "imageMessage":
        mediaType = "Image";
        body = msg.message.imageMessage?.caption || "";
        break;
      case "videoMessage":
        mediaType = "Video";
        body = msg.message.videoMessage?.caption || "";
        break;
      case "stickerMessage":
        mediaType = "Sticker";
        break;
      case "audioMessage":
        mediaType = "Audio";
        break;
      case "documentMessage":
        mediaType = "Document";
        break;
      default:
        body = "";
    }

    panjay.downloadMediaMessage = async (message: unknown) => {
      const record =
        typeof message === "object" && message !== null
          ? (message as { msg?: { mimetype?: string | null }; mimetype?: string | null; mtype?: string })
          : {};
      const mime = (record.msg || record).mimetype || "";

      const rawDownloadType = record.mtype
        ? record.mtype.replace(/Message/gi, "")
        : mime.split("/")[0];
      const downloadType = (rawDownloadType ||
        "document") as Parameters<typeof downloadContentFromMessage>[1];

      const stream = await downloadContentFromMessage(
        message as Parameters<typeof downloadContentFromMessage>[0],
        downloadType,
      );

      let buffer = Buffer.from([]);

      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      return buffer;
    };

    // Filter Pesan Kosong
    if (!body.trim() && !mediaType) return;

    // Log Pesan
    const listColor = [
      "red",
      "green",
      "yellow",
      "magenta",
      "cyan",
      "white",
      "blue",
    ] as const;
    const randomColor =
      listColor[Math.floor(Math.random() * listColor.length)] ?? "white";
    const logTag = mediaType ? `[${mediaType}]` : "";

    console.log(
      chalk.yellow.bold(`Credit : ${botConfig.owner.name}`),
      chalk.green.bold("[WhatsApp]"),
      chalk[randomColor](pushname),
      chalk[randomColor](" : "),
      chalk.magenta.bold(`${logTag}`),
      chalk.white(` ${body}`),
    );

    // Import Handler
    const { default: handler } = await import("./panjay.ts");
    const meta: HandlerMeta = { body, mediaType, sender, pushname };
    await handler(panjay, m, meta);
  });
}

// Export
export default connectToWhatsApp;
