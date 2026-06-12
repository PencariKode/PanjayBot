import type { PluginContext, PluginInfo } from "../../types.ts";


import fs from "fs";
import path from "path";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";

const caseDir = path.join(process.cwd(), "case");
const trashDir = path.join(process.cwd(), "temp");

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
}

export const info: PluginInfo = {
  name: "Manajemen Fitur Via Command",

  menu: [
    "Addfitur",
    "Delfitur",
    "Getfitur",
    "Listtemp",
    "Restore",
    "Cleartemp",
  ],
  case: [
    "addfitur",
    "delfitur",
    "getfitur",
    "listtemp",
    "restore",
    "cleartemp",
  ],

  description: "Manajemen Fitur Via Command",
  hidden: false,

  owner: true,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,

  allowPrivate: false,
};

export default async function handler(panjy: PluginContext) {
  const { command, q, msg, PanjayText, PanjayInvalid, panjay, replyJid } = panjy;

  switch (command) {
    case "addfitur":
      {
        if (!q)
          return PanjayInvalid({
            title: "INPUT REQUIRED",
            message: "Masukkan kategori dan nama fitur, lalu reply kode atau file .ts.",
            usage: "[kategori] [nama]",
            example: `${command} ai ai4chat`,
          });

        const args = q.split(" ");
        const kategori = args[0]?.toLowerCase();
        let fileName = args[1];

        if (!kategori)
          return PanjayInvalid({
            title: "CATEGORY REQUIRED",
            message: "Masukkan kategori fitur.",
            example: `${command} ai ai4chat`,
          });

        const existingFolders = fs
          .readdirSync(caseDir)
          .filter((folder) =>
            fs.statSync(path.join(caseDir, folder)).isDirectory(),
          )
          .map((f) => f.toLowerCase());

        if (!existingFolders.includes(kategori)) {
          return PanjayInvalid({
            title: "CATEGORY NOT FOUND",
            message: `Kategori ${kategori} tidak ditemukan.`,
            details: `Kategori tersedia: ${existingFolders.join(", ")}`,
            example: `${command} ai ai4chat`,
          });
        }

        const kategoriPath = path.join(caseDir, kategori);

        const quoted = msg.message?.extendedTextMessage?.contextInfo;
        const quotedMsg = quoted?.quotedMessage;

        if (!quotedMsg)
          return PanjayInvalid({
            title: "MESSAGE REQUIRED",
            message: "Reply kode atau file .ts yang ingin ditambahkan.",
            example: `${command} ai ai4chat`,
          });

        let code = "";

        if (quotedMsg.documentMessage) {
          const doc = quotedMsg.documentMessage;

          const documentFileName = doc.fileName;
          if (!documentFileName)
            return PanjayInvalid({
              title: "INVALID FILE",
              message: "Nama file dokumen tidak valid.",
              example: `${command} ai ai4chat`,
            });

          if (!documentFileName.endsWith(".ts"))
            return PanjayInvalid({
              title: "INVALID FILE",
              message: "File fitur harus berformat .ts.",
              example: `${command} ai ai4chat`,
            });

          fileName = documentFileName.replace(".ts", "");

          const stream = await downloadContentFromMessage(doc, "document");

          let buffer = Buffer.from([]);
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
          }

          code = buffer.toString("utf-8");
        } else {
          code =
            quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || "";

          if (!code)
            return PanjayInvalid({
              title: "INVALID MESSAGE",
              message: "Pesan yang direply tidak mengandung teks kode.",
              example: `${command} ai ai4chat`,
            });

          if (!fileName)
            return PanjayInvalid({
              title: "FILE NAME REQUIRED",
              message: "Masukkan nama file fitur.",
              example: `${command} ai ai4chat`,
            });
        }

        fileName = fileName
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, "")
          .trim();

        if (!fileName) fileName = "panjay_plugin";

        const fullPath = path.join(kategoriPath, `${fileName}.ts`);

        if (fs.existsSync(fullPath))
          return PanjayInvalid({
            title: "FILE EXISTS",
            message: `File ${fileName}.ts sudah ada.`,
            example: `${command} ai ai4chat`,
          });

        try {
          fs.writeFileSync(fullPath, code);

          await PanjayText(
            `🎁 *Fitur Berhasil Ditambahkan*\n📁 *${kategori}/${fileName}.ts*`,
          );
        } catch (err) {
          console.error(err);
          return PanjayText("❌ Gagal Membuat Fitur.");
        }
      }
      break;

    case "delfitur":
      if (!q)
        return PanjayInvalid({
          title: "TARGET REQUIRED",
          message: "Masukkan nama file fitur yang ingin dihapus.",
          example: `${command} ai4chat.ts`,
        });

      let targetFile = q.trim();

      targetFile = targetFile.replace(/[^a-zA-Z0-9_.-]/g, "");

      if (!targetFile.endsWith(".ts"))
        return PanjayInvalid({
          title: "INVALID FILE",
          message: "Hanya file .ts yang bisa dihapus dari fitur.",
          example: `${command} ai4chat.ts`,
        });

      let foundPath = null;

      const folders = fs.readdirSync(caseDir).filter((folder) => {
        const full = path.join(caseDir, folder);
        return (
          fs.statSync(full).isDirectory() && folder.toLowerCase() !== "temp"
        );
      });

      for (const folder of folders) {
        const folderPath = path.join(caseDir, folder);
        const files = fs.readdirSync(folderPath);

        for (const file of files) {
          if (file.toLowerCase() === targetFile.toLowerCase()) {
            foundPath = path.join(folderPath, file);
            break;
          }
        }

        if (foundPath) break;
      }

      if (!foundPath)
        return PanjayInvalid({
          title: "FILE NOT FOUND",
          message: "File tidak ditemukan di dalam folder case.",
          example: `${command} ai4chat.ts`,
        });

      try {
        if (!fs.existsSync(trashDir)) {
          fs.mkdirSync(trashDir);
        }

        const newPath = path.join(trashDir, targetFile);

        let finalPath = newPath;
        if (fs.existsSync(newPath)) {
          const timestamp = Date.now();
          finalPath = path.join(
            trashDir,
            `${targetFile.replace(".ts", "")}_${timestamp}.ts`,
          );
        }

        fs.renameSync(foundPath, finalPath);

        await PanjayText(
          `📁 *Fitur Berhasil Dihapus*\n🗑️ *${path.relative(caseDir, finalPath)}*`,
        );
      } catch (err) {
        console.error(err);
        return PanjayText("❌ *Gagal Menghapus Fitur&.");
      }
      break;

    case "getfitur":
      if (!q)
        return PanjayInvalid({
          title: "TARGET REQUIRED",
          message: "Masukkan nama command fitur yang ingin diambil.",
          example: `${command} ai`,
        });

      const targetCase = q.trim().toLowerCase();

      let foundFile = null;

      try {
        const folders = fs
          .readdirSync(caseDir)
          .filter((folder) =>
            fs.statSync(path.join(caseDir, folder)).isDirectory(),
          );

        for (const folder of folders) {
          const folderPath = path.join(caseDir, folder);
          const files = fs
            .readdirSync(folderPath)
            .filter((file) => file.endsWith(".ts"));

          for (const file of files) {
            const fullPath = path.join(folderPath, file);
            const content = fs.readFileSync(fullPath, "utf-8");

            const match = content.match(/case\s*:\s*\[(.*?)\]/s);

            if (match?.[1]) {
              const caseList = match[1]
                .split(",")
                .map((c) => c.replace(/['"`\s]/g, "").toLowerCase());

              if (caseList.includes(targetCase)) {
                foundFile = fullPath;
                break;
              }
            }
          }

          if (foundFile) break;
        }

        if (!foundFile)
          return PanjayInvalid({
            title: "FEATURE NOT FOUND",
            message: "Fitur tidak ditemukan.",
            example: `${command} ai`,
          });

        const fileBuffer = fs.readFileSync(foundFile);

        await panjay.sendMessage(
          replyJid,
          {
            document: fileBuffer,
            fileName: path.basename(foundFile),
            mimetype: "application/javascript",
          },
          { quoted: msg },
        );
      } catch (err) {
        console.error(err);
        return PanjayText("❌ Gagal Mengambil Fitur.");
      }
      break;

    case "listtemp":
      try {
        if (!fs.existsSync(trashDir)) {
          return PanjayText("📂 *Folder temp Belum Ada.*");
        }

        const files = fs.readdirSync(trashDir);

        if (files.length === 0) {
          return PanjayText("🗑️ *Folder Temp Kosong.*");
        }

        const grouped: Record<string, { files: string[]; size: number }> = {};
        let totalSize = 0;

        for (const file of files) {
          const fullPath = path.join(trashDir, file);
          const stats = fs.statSync(fullPath);

          if (!stats.isFile()) continue;

          const ext =
            path.extname(file).toLowerCase().replace(".", "") || "other";

          if (!grouped[ext]) {
            grouped[ext] = {
              files: [],
              size: 0,
            };
          }

          grouped[ext].files.push(file);
          grouped[ext].size += stats.size;
          totalSize += stats.size;
        }

        const sortedExt = Object.keys(grouped).sort((a, b) => {
          if (a === "js") return -1;
          if (b === "js") return 1;
          return a.localeCompare(b);
        });

        let teks = "📂 *Isi Folder Temp*\n\n";
        let totalFile = 0;

        for (const ext of sortedExt) {
          const data = grouped[ext];
          if (!data) continue;
          totalFile += data.files.length;

          teks += `*[+] ${ext.toUpperCase()} (${data.files.length}) — ${formatSize(data.size)}*\n`;

          for (const file of data.files) {
            teks += ` - *${file}*\n`;
          }

          teks += "\n";
        }

        teks += "━━━━━━━━━━━━━━\n";
        teks += `*[+] Total File: ${totalFile}*\n`;
        teks += `*[+] Total Size: ${formatSize(totalSize)}*`;

        await PanjayText(teks);
      } catch (err) {
        console.error(err);
        return PanjayText("❌ Gagal Membaca Folder Temp.");
      }
      break;

    case "restore":
      if (!q)
        return PanjayInvalid({
          title: "TARGET REQUIRED",
          message: "Masukkan nama file di folder temp yang ingin direstore.",
          example: `${command} ai4chat.ts`,
        });

      if (!fs.existsSync(trashDir))
        return PanjayText("📂 *Folder Temp Belum Ada.*");

      let fileName = q.trim().replace(/[^a-zA-Z0-9_.-]/g, "");

      const fullPath = path.join(trashDir, fileName);

      if (!fs.existsSync(fullPath))
        return PanjayInvalid({
          title: "FILE NOT FOUND",
          message: "File tidak ditemukan di folder temp.",
          example: `${command} ai4chat.ts`,
        });

      const ext = path.extname(fileName).toLowerCase();
      const fileBuffer = fs.readFileSync(fullPath);

      try {
        if ([".jpg", ".jpeg", ".png"].includes(ext)) {
          await panjay.sendMessage(
            replyJid,
            {
              image: fileBuffer,
              caption: `📦 Restore: ${fileName}`,
            },
            { quoted: msg },
          );
        } else if (ext === ".mp3") {
          await panjay.sendMessage(
            replyJid,
            {
              audio: fileBuffer,
              mimetype: "audio/mpeg",
              fileName,
            },
            { quoted: msg },
          );
        } else if (ext === ".mp4") {
          await panjay.sendMessage(
            replyJid,
            {
              video: fileBuffer,
              caption: `📦 Restore: ${fileName}`,
            },
            { quoted: msg },
          );
        } else {
          await panjay.sendMessage(
            replyJid,
            {
              document: fileBuffer,
              fileName,
              mimetype: "application/javascript",
            },
            { quoted: msg },
          );
        }

        fs.unlinkSync(fullPath);

        await PanjayText(`📂 *File Berhasil Direstore dan Dihapus Dari Temp.*`);
      } catch (err) {
        console.error(err);
        return PanjayText("❌ *Gagal Mengirim File. File Tetap Aman Di Temp.*");
      }
      break;

    case "cleartemp":
      try {
        if (!fs.existsSync(trashDir)) {
          return PanjayText("📂 *Folder Temp Belum Ada.*");
        }

        const files = fs.readdirSync(trashDir);

        if (files.length === 0) {
          return PanjayText("🗑️ *Folder Temp Sudah Kosong.*");
        }

        let deleted = 0;

        for (const file of files) {
          const fullPath = path.join(trashDir, file);
          const stats = fs.statSync(fullPath);

          if (stats.isFile()) {
            fs.unlinkSync(fullPath);
            deleted++;
          }
        }

        await PanjayText(`🧹 *Berhasil Menghapus ${deleted} File Dari Temp.*`);
      } catch (err) {
        console.error(err);
        return PanjayText("❌ Gagal Membersihkan Temp.");
      }
      break;
  }
}
