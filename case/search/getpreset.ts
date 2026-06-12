import type { PluginContext, PluginInfo } from "../../types.ts";
/*

  Fitur  : Random Preset Alight Motion
  Author : Panjay
  NumpangNama: @Sakanaa
  
*/

import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";

const RAW_JSON_URL = "https://raw.githubusercontent.com/SakanaaDesuKa/AlightMotionPreset-Metadata/refs/heads/main/preset.json";

export const info: PluginInfo = {
  name: "Random Preset Alight Motion",
  menu: ["preset"],
  case: ["preset", "priset", "getpreset"],
  description: "Ambil preset Alight Motion secara random",
  hidden: false,
  owner: false,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,
  allowPrivate: true,
};

interface PresetItem {
  id?: unknown;
  editby?: string;
  preset_link?: string;
  xml_link?: string;
  source?: string;
}

interface TiktokPresetData {
  watermark?: string;
  no_watermark?: string;
  title?: string;
}

interface TiktokPresetResponse {
  status?: number;
  message?: string;
  data?: TiktokPresetData;
}

function cleanTitle(title = ""): string | null {
  const cleaned = (title.split("#")[0] ?? "").trim();
  return cleaned || null;
}

export default async function handler(panjy: PluginContext) {
  const { PanjayText, PanjayWait, replyJid, panjay, msg } = panjy;

  await PanjayWait();

  let tmpPath: string | null = null;

  try {
    let presetList: PresetItem[];
    try {
      const { data } = await axios.get<unknown>(RAW_JSON_URL, { timeout: 10000 });
      presetList = Array.isArray(data)
        ? data.filter((p: unknown): p is PresetItem => {
            return p !== null && typeof p === "object" && "id" in p;
          })
        : [];
    } catch {
      return PanjayText("⚠️ Gagal Mengambil Data.");
    }

    if (!presetList.length) return PanjayText("⚠️ Daftar preset kosong.");


    const preset = presetList[Math.floor(Math.random() * presetList.length)];
    if (!preset) return PanjayText("⚠️ Daftar preset kosong.");

    const editby     = preset.editby      || "KurangTau";
    const presetLink = preset.preset_link || "";
    const xmlLink    = preset.xml_link    || "";
    const sourceUrl  = preset.source      || "";

    if (!sourceUrl) return PanjayText("😎 Preset ini tidak memiliki source video.");

    let ttData: TiktokPresetData | undefined;
    try {
      const ttRes = await axios.get<TiktokPresetResponse>(
        `https://api.fromscratch.web.id/v1/api/down/tiktok?url=${encodeURIComponent(sourceUrl)}`,
        { timeout: 15000 }
      );

      if (ttRes.data?.status !== 200) throw new Error(ttRes.data?.message || "API error");
      ttData = ttRes.data.data;
    } catch (e) {
      return PanjayText(
        `⚠️ Gagal Mengambil Video.\n${e instanceof Error ? e.message : String(e)}`,
      );
    }

    const videoUrl = ttData?.watermark || ttData?.no_watermark;
    if (!videoUrl) return PanjayText("⚠️ URL video tidak tersedia.");
    
    const title = cleanTitle(ttData?.title ?? "");
    
    tmpPath = path.join(os.tmpdir(), `panjay_preset_${Date.now()}.mp4`);

    const videoRes = await axios.get(videoUrl, {
      responseType: "arraybuffer",
      timeout: 60000,
    });

    fs.writeFileSync(tmpPath, Buffer.from(videoRes.data));

    let caption = `*Random Preset Alight Motion*\n\n`;
    if (title) caption += `*${title}*\n\n`;
    caption += `*Credit :* ${editby}\n`;
    caption += `*Preset 5mb/5mb+ :* ${presetLink}\n\n`;
    if (xmlLink) caption += `*XML :* ${xmlLink}\n\n`;
    caption += `*Source :* ${sourceUrl}\n`;
    caption += `> Harap Mencantumkan Nama Kreator Preset Jika Ingin MengUpload Hasilnya Ke Media Sosial`;
    
    await panjay.sendMessage(
      replyJid,
      {
        video: fs.readFileSync(tmpPath),
        caption,
        mimetype: "video/mp4",
      },
      { quoted: msg }
    );

  } catch (err) {
    console.error("[PRESET ERROR]", err);
    PanjayText(
      `⚠️ *Terjadi Kesalahan*\n${err instanceof Error ? err.message : String(err)}`,
    );
  } finally {
    if (tmpPath && fs.existsSync(tmpPath)) {
      try {
        fs.unlinkSync(tmpPath);
      } catch {
      }
    }
  }
}
