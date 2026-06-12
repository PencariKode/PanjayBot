import type { PluginContext, PluginInfo } from "../../types.ts";
/*

   Author: @SakanaaDesu
   Saluran: https://whatsapp.com/channel/0029Vb7Q3tA0bIdwP0cpwA3J

*/

import axios from 'axios';

export const info: PluginInfo = {
  name: "Dapatkan Waifu Segara",
  menu: ["waifu"],
  case: ["waifu", "mykisah", "getwaifu", "mywaifu"],
  description: "Get Random Waifu illustration no nsfw",
  hidden: false,
  owner: false,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,

  allowPrivate: true,
};

interface WaifuArtist {
  name: string;
}

interface WaifuItem {
  url?: string;
  source?: string;
  artists?: WaifuArtist[];
}

interface WaifuResponse {
  items?: WaifuItem[];
}

export default async function handler(panjy: PluginContext) {
  const { PanjayText, PanjayWait, replyJid, panjay, msg, PanjayInvalid } = panjy;

  await PanjayWait();

  try {
    const apiUrl = 'https://api.waifu.im/images?IncludedTags=waifu&IsNsfw=false';
    const { data } = await axios.get<WaifuResponse>(apiUrl, { timeout: 15000 });

    if (!data.items || data.items.length === 0) {
      return PanjayInvalid({ title: "GAGAL", message: "Gagal Mencari Waifu." });
    }

    const item = data.items[0];
    if (!item?.url) return PanjayInvalid({ title: "GAGAL", message: "Gagal Mencari Waifu." });
    const imageUrl = item.url;
    const source = item.source || '-';
    
    const artists = item.artists && item.artists.length > 0 
      ? item.artists.map((a: WaifuArtist) => a.name).join(', ') 
      : 'TidakTau';

    let caption = `🎁 *Random Waifu illustration*\n\n`;
    caption += `*Artist :* ${artists}\n`;
    caption += `*Source :* ${source}`;

    await panjay.sendMessage(
      replyJid,
      {
        image: { url: imageUrl },
        caption: caption
      },
      { quoted: msg }
    );

  } catch (error) {
    console.error('[Error] waifu:', error);
    return PanjayInvalid({
      title: "ERROR",
      message: `Terjadi Kesalahan: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}
