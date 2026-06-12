import type { PluginContext, PluginInfo } from "../../types.ts";


import path from "path";
import fs from "fs";

export const info: PluginInfo = {
  name: "Cek Direktori",

  menu: ["Dir"],
  case: ["dir"],

  description: "Cek Direktori",
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
  const { command, q, PanjayText, PanjayInvalid } = panjy;

  let targetPath = q.trim() || process.cwd();
  if (targetPath.includes("..")) {
    return PanjayText("❌ *Akses Direktori Di Luar Batas.*");
  }

  const resolvedPath = path.resolve(targetPath);

  try {
    if (!fs.existsSync(resolvedPath)) {
      return PanjayText(
        `❌ *Direktori atau File Tidak Ditemukan:* \`${targetPath}\``,
      );
    }

    const stats = fs.statSync(resolvedPath);

    if (stats.isFile()) {
      const fileName = path.basename(resolvedPath);

      if (
        fileName.toLowerCase().includes(".env") ||
        fileName.toLowerCase().endsWith(".pem") ||
        fileName.toLowerCase().endsWith(".key")
      ) {
        return PanjayText(
          "🚫 Akses Diblokir: File Ini Mengandung Kredensial Sensitif.",
        );
      }

      const fileContent = fs.readFileSync(resolvedPath, "utf-8");

      // if (fileContent.length > 4000) {
      //      return PanjayText(`⚠ Konten File *${fileName}* Terlalu Panjang (${fileContent.length} Karakter).`);
      // }

      const response = `${fileContent}`;

      await PanjayText(response);
      return;
    }

    if (stats.isDirectory()) {
      const items = fs.readdirSync(resolvedPath, { withFileTypes: true });

      let response = `*[+] Direktori/File:*\n\n \`${targetPath}\`\n\n`;
      const folders: string[] = [];
      const files: string[] = [];

      items.forEach((item) => {
        if (item.name.toLowerCase() === ".env") {
          return;
        }

        if (item.isDirectory()) {
          folders.push(`📁 ${item.name}`);
        } else {
          files.push(`📄 ${item.name}`);
        }
      });

      if (folders.length > 0) {
        response += `*Folders (${folders.length}):*\n${folders.join("\n")}\n\n`;
      }
      if (files.length > 0) {
        response += `*Files (${files.length}):*\n${files.join("\n")}`;
      }

      if (folders.length === 0 && files.length === 0) {
        response += "*(Direktori kosong atau hanya berisi file tersembunyi)*";
      }

      await PanjayText(response);
      return;
    }

    PanjayInvalid({
      title: "INVALID PATH",
      message: "Tipe path tidak didukung. Tentukan file atau folder.",
      example: `${command} database`,
    });
  } catch (error) {
    console.error("Error DIR Command:", error);
    PanjayText(
      `❌ Gagal membaca path. Pastikan path benar dan bot memiliki izin.\nDetail: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
