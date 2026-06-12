import type { PluginContext, PluginInfo } from "../../types.ts";
/*

     Create: Shannyie
     Telegram: t.me/Shannyiee

*/

export const info: PluginInfo = {
  name: "Upload Status Grup",

  menu: ["Upsw"],
  case: ["upsw", "groupstatus", "swgrup"],

  description: "Upload Media Sebagai Status Grup",
  hidden: false,

  owner: false,
  premium: false,
  group: true,
  private: false,
  admin: true,
  botAdmin: false,

  allowPrivate: false,
};

export default async function handler(panjy: PluginContext) {
  const { command, q, msg, panjay, replyJid, len, PanjayText, PanjayInvalid } = panjy;

  switch (command) {
    case "upsw":
    case "groupstatus":
    case "swgrup": {

      // Validasi Reply Media
      const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quotedMsg)
        return PanjayInvalid({
          title: "MEDIA REQUIRED",
          message: "Reply media gambar, video, atau audio yang ingin dijadikan status grup.",
          examples: [`${command}`],
        });

      const sleep = (ms: number) =>
        new Promise<void>((res) => setTimeout(res, ms));

      // Ekstrak media
      let mediaType: "imageMessage" | "videoMessage" | "audioMessage";
      let mediaData: Record<string, unknown>;

      if (quotedMsg.imageMessage) {
        mediaType = "imageMessage";
        mediaData = { ...quotedMsg.imageMessage };
        if (q) mediaData.caption = q;
      } else if (quotedMsg.videoMessage) {
        mediaType = "videoMessage";
        mediaData = { ...quotedMsg.videoMessage };
        if (q) mediaData.caption = q;
      } else if (quotedMsg.audioMessage) {
        mediaType = "audioMessage";
        mediaData = { ...quotedMsg.audioMessage, ptt: true };
      } else {
        return PanjayInvalid({
          title: "INVALID MEDIA",
          message: "Format tidak didukung. Gunakan gambar, video, atau audio.",
          examples: [`${command}`],
        });
      }

      try {
        // Reaksi proses
        await panjay.sendMessage(replyJid, {
          react: { text: "♻️", key: msg.key },
        });

        // Relay ke Group Status V2
        await panjay.relayMessage(
          replyJid,
          {
            groupStatusMessageV2: {
              message: { [mediaType]: mediaData },
            },
          },
          {}
        );

        await sleep(2000);

        // Reaksi sukses
        await panjay.sendMessage(replyJid, {
          react: { text: "✅", key: msg.key },
        });

      } catch (err) {
        console.error("GroupStatus Error:", err);
        await panjay.sendMessage(replyJid, {
          react: { text: "❌", key: msg.key },
        });
        PanjayText(
          `👻 *GAGAL!*\n${err instanceof Error ? err.message : String(err)}`,
        );
      }

      break;
    }
  }
}
