/*

   Author: @SakanaaDesu
   Saluran: https://whatsapp.com/channel/0029Vb7Q3tA0bIdwP0cpwA3J

*/

import axios from 'axios';

export const info = {
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

export default async function handler(panjy) {
  const { PanjayText, PanjayWait, replyJid, panjay, msg } = panjy;

  await PanjayWait();

  try {
    const apiUrl = 'https://api.waifu.im/images?IncludedTags=waifu&IsNsfw=false';
    const { data } = await axios.get(apiUrl, { timeout: 15000 });

    if (!data.items || data.items.length === 0) {
      return PanjayText("⚠️ Gagal Mencari Waifu.");
    }

    const item = data.items[0];
    const imageUrl = item.url;
    const source = item.source || '-';
    
    const artists = item.artists && item.artists.length > 0 
      ? item.artists.map(a => a.name).join(', ') 
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
    return PanjayText(`⚠️ Terjadi Kesalahan: ${error.message}`);
  }
}
