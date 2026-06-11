import type { PluginContext, PluginInfo } from "../../types.ts";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import webp from "node-webpmux";

export const info: PluginInfo = {
  name: "Emoji Mix",

  menu: ["Emojimix"],
  case: ["emojimix", "mix"],

  description: "Gabungkan Dua Emoji Menjadi Sticker!",
  hidden: false,

  owner: false,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,

  allowPrivate: false,
};

export default async function handler(panjy: PluginContext) {
  const { command, q, msg, panjay, replyJid, PanjayText } = panjy;

  switch (command) {
    case "emojimix":
    case "mix": {

      if (!q)
        return PanjayText(
          `👻 Format salah!\n\n*Cara pakai:*\n.emojimix 😭+🔥\n.emojimix 😭 🔥\n.emojimix 😭🔥`
        );

      // Parse emoji pakai Intl.Segmenter
      const input = q.replace(/\+/g, "").replace(/\s/g, "");
      const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
      const emojis = Array.from(segmenter.segment(input)).map((s) => s.segment);

      if (emojis.length < 2)
        return PanjayText("👻 Masukkan minimal 2 emoji!\n*Contoh:* .emojimix 😭🔥");

      const emoji1 = emojis[0];
      const emoji2 = emojis[1];
      if (!emoji1 || !emoji2) return PanjayText("👻 Masukkan minimal 2 emoji!");

      await panjay.sendMessage(replyJid, { react: { text: "⏳", key: msg.key } });

      try {
        const apiUrl = `https://shiny-beta.vercel.app/tools/emojimix?emoji1=${encodeURIComponent(emoji1)}&emoji2=${encodeURIComponent(emoji2)}`;

        const res = await fetch(apiUrl);
        const contentType = res.headers.get("content-type");

        let imageBuffer: Buffer;

        if (contentType && contentType.includes("application/json")) {
          const json = (await res.json()) as Record<string, unknown>;
          const imageUrl =
            typeof json.result === "string"
              ? json.result
              : typeof json.url === "string"
                ? json.url
                : typeof json.data === "string"
                  ? json.data
                  : null;
          if (!imageUrl) throw new Error("Kombinasi emoji ini tidak didukung.");
          const imgRes = await fetch(imageUrl);
          imageBuffer = Buffer.from(await imgRes.arrayBuffer());
        } else {
          imageBuffer = Buffer.from(await res.arrayBuffer());
        }

        if (!res.ok && !imageBuffer?.length)
          throw new Error("404");

        await panjay.sendMessage(replyJid, { react: { text: "📥", key: msg.key } });

        // Tmp files
        const tmpIn  = path.join(process.cwd(), `tmp_${Date.now()}_emojimix.png`);
        const tmpOut = path.join(process.cwd(), `tmp_${Date.now()}_emojimix.webp`);

        fs.writeFileSync(tmpIn, imageBuffer);

        // Convert ke WebP via ffmpeg
        await new Promise<void>((resolve, reject) => {
          ffmpeg(tmpIn)
            .on("error", reject)
            .on("end", () => resolve())
            .addOutputOptions([
              "-vcodec", "libwebp",
              "-vf", "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color='#00000000'",
            ])
            .toFormat("webp")
            .save(tmpOut);
        });

        // Inject EXIF metadata
        const img = new webp.Image();
        await img.load(tmpOut);

        const json = {
          "sticker-pack-id": "panjay-scm-mix",
          "sticker-pack-name": globalThis.spackname || "Panjay SCM",
          "sticker-pack-publisher": globalThis.sauthor || "Panjay",
          emojis: [emoji1, emoji2],
        };

        const exifAttr = Buffer.from([
          0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
          0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
        ]);
        const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
        const exif = Buffer.concat([exifAttr, jsonBuff]);
        exif.writeUIntLE(jsonBuff.length, 14, 4);

        img.exif = exif;
        await img.save(tmpOut);
        const finalBuffer = fs.readFileSync(tmpOut);

        await panjay.sendMessage(replyJid, { sticker: finalBuffer }, { quoted: msg });
        await panjay.sendMessage(replyJid, { react: { text: "✨", key: msg.key } });

      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const responseStatus =
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          typeof err.response === "object" &&
          err.response !== null &&
          "status" in err.response
            ? err.response.status
            : undefined;
        console.error("[EMOJIMIX ERROR]", message);
        await panjay.sendMessage(replyJid, { react: { text: "❌", key: msg.key } });

        if (
          message.includes("404") ||
          message.includes("tidak didukung") ||
          responseStatus === 404
        ) {
          PanjayText(`👻 Kombinasi ${emoji1} + ${emoji2} belum ada. Coba kombinasi lain!`);
        } else {
          PanjayText(`👻 Gagal memproses emojimix!\n${message}`);
        }
      } finally {
        // Cleanup tmp files
        const tmpIn  = path.join(process.cwd(), `tmp_*_emojimix.png`);
        const tmpOut = path.join(process.cwd(), `tmp_*_emojimix.webp`);
        try { fs.readdirSync(process.cwd()).filter(f => f.includes("emojimix")).forEach(f => fs.unlinkSync(path.join(process.cwd(), f))); } catch {}
      }

      break;
    }
  }
}
