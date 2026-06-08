/*

     Create: Shannyie
     Telegram: t.me/Shannyiee

*/

export const info = {
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

export default async function handler(panjy) {
  const { command, q, msg, panjay, replyJid, len, PanjayText } = panjy;

  switch (command) {
    case "upsw":
    case "groupstatus":
    case "swgrup": {

      // Validasi Reply Media
      const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quotedMsg)
        return PanjayText(`👻 Reply media (Gambar/Video/Audio) yang ingin dijadikan Status Grup`);

      const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

      // Ekstrak media
      let mediaType;
      let mediaData;

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
        return PanjayText("👻 Format tidak didukung! Harus Gambar, Video, atau Audio.");
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
        PanjayText(`👻 *GAGAL!*\n${err.message}`);
      }

      break;
    }
  }
}
