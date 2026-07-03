import type { PluginContext, PluginInfo } from "../../types.ts";


export const info: PluginInfo = {
  name: "Testing",

  menu: ["testing"],
  case: ["testing", "t"],

  description: "Menu untuk Testing",
  hidden: true,

  owner: true,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,
  allowPrivate: false,
};

// Handler Utama
export default async function handler(panjy: PluginContext) {
  const {
    command,
    args,
    q,
    panjay,
    m,
    msg,
    len,
    replyJid,
    panjayreply,
    PanjayText,
    PanjayInvalid,
    PanjayWait,
    PanjayVideo,
    PanjayImage,
    PanjayAudio,
    PanjayFile,
    PanjayReact,
    isGroup,
    isAdmin,
    isBotAdmin,
    isPremium,
    isPanjay,
  } = panjy;

  // console.log(msg.message?.extendedTextMessage?.contextInfo);
  console.log("TESTING", msg);

  // await panjay.sendMessage(
  //   replyJid,
  //   {
  //     text: JSON.stringify(msg)
  //   },
  //   {
  //     quoted: msg
  //   },
  // );


  // await panjay.sendMessage(replyJid, { react: { text: "✅", key: msg.key } });
  await PanjayReact("♱");
  
}
