

// [ ===== Import File ===== ]
import "./pan.ts";
import "./database/Menu/PanjayMenu.ts";

// [ ===== Import Pustaka ===== ]
import fs from "fs";
import { type GroupMetadata, jidNormalizedUser, type WAMessageKey, WASocket } from "@whiskeysockets/baileys";
import path from "path";
import chalk from "chalk";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { botConfig } from "./config.ts";
import { CommandResponseOptions, formatCommandResponse } from "./lib/response.ts";
import { getDataStore } from "./lib/dataStore.ts";
import type {
  BeforeHandler,
  HandlerMeta,
  MessageUpsert,
  PanjaySocket,
  PluginCommand,
  PluginHandler,
  PluginInfo,
  PluginModule,
  QuotedContactMessage,
} from "./types.ts";
import reactList from "./lib/reactList.ts";
import { Button, ButtonV2, Carousel, AIRich } from "@ryuu-reinzz/luna-lib";

// Track Messages
const processedMessages = new Set<string>();
const groupMetadataCache = new Map<string, { data: GroupMetadata; time: number }>();

const dataStore = getDataStore();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read Json File
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function readStringArraySync(pathFile: string): string[] {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(pathFile, "utf8"));
    return isStringArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface PluginState {
  disable: string[];
  maintenance: string[];
}

const pluginStatePath = botConfig.paths.pluginState;

if (!fs.existsSync(pluginStatePath)) {
  fs.mkdirSync(path.dirname(pluginStatePath), { recursive: true });
  fs.writeFileSync(
    pluginStatePath,
    JSON.stringify({ disable: [], maintenance: [] }, null, 2),
  );
}

function isPluginState(value: unknown): value is PluginState {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return isStringArray(record.disable) && isStringArray(record.maintenance);
}

function readPluginState(): PluginState {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(pluginStatePath, "utf8"));
    return isPluginState(parsed) ? parsed : { disable: [], maintenance: [] };
  } catch {
    return { disable: [], maintenance: [] };
  }
}

fs.watchFile(pluginStatePath, { interval: 1000 }, async () => {
  console.log(chalk.yellow.bold("[+] Plugins.json Berubah, Reloading State"));

  try {
    await loadPlugins();
    console.log(
      chalk.green.bold(`[+] Reload Selesai (${commands.size} Commands)`),
    );
  } catch (err) {
    console.error(chalk.red("❌ Gagal reload plugins.json:"), err);
  }
});

const caseDir = path.join(__dirname, "case");

let plugins: PluginHandler[] = [];
let beforePlugins: BeforeHandler[] = [];
const commands = new Map<string, PluginCommand>();
const categories = new Map<string, PluginInfo[]>();

async function loadPlugins(): Promise<void> {
  plugins = [];
  beforePlugins = [];
  commands.clear();
  categories.clear();

  const state = readPluginState();
  const disableList = state.disable || [];
  const maintenanceList = state.maintenance || [];

  // Load before plugins dari root case/ directory
  for (const entry of fs.readdirSync(caseDir)) {
    const entryPath = path.join(caseDir, entry);
    if (fs.statSync(entryPath).isDirectory()) continue;
    if (!entry.endsWith(".ts") || !entry.startsWith("_")) continue;
    try {
      const mod: PluginModule = await import(
        `./case/${entry}?update=${Date.now()}`
      );
      if (mod.default) {
        beforePlugins.push(mod.default as unknown as BeforeHandler);
        // console.log(chalk.cyan(`  [BEFORE] ${entry}`));
      }
    } catch (err) {
      console.error(chalk.red(`❌ Gagal load before plugin ${entry}:`), err);
    }
  }

  const folders = fs.readdirSync(caseDir);

  for (let folder of folders) {
    const folderPath = path.join(caseDir, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    categories.set(folder.toLowerCase(), []);

    const files = fs.readdirSync(folderPath);

    for (let file of files) {
      if (!file.endsWith(".ts")) continue;

      const module: PluginModule = await import(
        `./case/${folder}/${file}?update=${Date.now()}`
      );

      // Before plugin (file dimulai underscore)
      if (file.startsWith("_")) {
        if (module.default) {
          beforePlugins.push(module.default as unknown as BeforeHandler);
          // console.log(chalk.cyan(`  [BEFORE] ${folder}/${file}`));
        }
        continue;
      }

      const plugin = module.default;
      const info = module.info;

      if (!plugin || !info) continue;

      const mainCommand = info.menu?.[0]?.toLowerCase();

      if (mainCommand) {
        info.enabled = !disableList.includes(mainCommand);
        info.maintenance = maintenanceList.includes(mainCommand);
      } else {
        info.enabled = true;
        info.maintenance = false;
      }

      plugins.push(plugin);

      for (let cmd of info.case) {
        commands.set(cmd.toLowerCase(), {
          execute: plugin,
          info,
          category: folder.toLowerCase(),
        });
      }

      categories.get(folder.toLowerCase())?.push(info);
    }
  }
}

await loadPlugins();
globalThis.commands = commands;

let reloadTimeout: NodeJS.Timeout | undefined;

function watchPlugins(): void {
  fs.watch(caseDir, { recursive: true }, (_eventType, filename) => {
    if (!filename || !filename.endsWith(".ts")) return;

    if (reloadTimeout) clearTimeout(reloadTimeout);

    reloadTimeout = setTimeout(async () => {
      console.log(chalk.yellow.bold(`[+] Reloading Plugins`));

      try {
        await loadPlugins();
        console.log(
          chalk.green.bold(`[+] Reload Selesai (${commands.size} Commands)`),
        );
      } catch (err) {
        console.error(chalk.red("❌ Gagal reload:"), err);
      }
    }, 500);
  });
}

watchPlugins();

// Export Handler
export default async function handler(
  panjay: PanjaySocket,
  m: MessageUpsert,
  meta: HandlerMeta,
): Promise<unknown> {
  const { body, mediaType, sender: originalSender, pushname } = meta;
  const msg = m.messages[0];
  if (!msg?.message) return;

  const remoteJid = msg.key.remoteJid;
  if (!remoteJid) return;
  const replyJid: string = remoteJid;

  let authJid = originalSender;

  const key = msg.key;
  const keyRecord = key as typeof key & {
    participantAlt?: string;
    remoteJidAlt?: string;
  };
  if (keyRecord.participantAlt) {
    authJid = keyRecord.participantAlt;
  } else if (keyRecord.remoteJidAlt) {
    authJid = keyRecord.remoteJidAlt;
  }

  const sender = authJid;
  const normalizedSender = jidNormalizedUser(sender);

  const senderJid = sender
    ? ((sender.split(":")[0] ?? "").split("@")[0] ?? "") // Ambil Nomor Saja
    : null;

  // console.log(chalk.yellow(`[DEBUG JID] Sender Original: ${originalSender}`));
  // console.log(chalk.yellow(`[DEBUG JID] Sender Auth (PN): ${sender}`));
  // console.log(chalk.green(`[DEBUG JID] Sender Normal: ${normalizedSender}`));

  // if (msg.key.fromMe) return;

  // Anti Double
  if (!msg.key.id) return;
  if (processedMessages.has(msg.key.id)) return;
  processedMessages.add(msg.key.id);
  setTimeout(() => {
    if (msg.key.id) processedMessages.delete(msg.key.id);
  }, 30000);

  const pplu = fs.readFileSync(globalThis.MenuImage);
  const len: QuotedContactMessage = {
    key: {
      participant: `0@s.whatsapp.net`,
      remoteJid: replyJid,
    },
    message: {
      contactMessage: {
        displayName: `${pushname}`,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:XL;${botConfig.identity.name},;;;\nFN: ${botConfig.identity.displayName} V${botConfig.identity.version}\nitem1.TEL;waid=${sender.split("@")[0] ?? ""}:+${sender.split("@")[0] ?? ""}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
        jpegThumbnail: pplu,
        thumbnail: pplu,
        sendEphemeral: true,
      },
    },
  };

  // Custom Reply
  const panjayreply = (teks: string) =>
    panjay.sendMessage(replyJid, { text: teks }, { quoted: msg });

  // Gambar Menu
  const MenuImage = fs.readFileSync(globalThis.MenuImage);

  // Deteksi Grup & Admin
  const isGroup = replyJid.endsWith("@g.us");

  // Bot Admin
  let isAdmin = false;
  let isBotAdmin = false;

  const GROUP_CACHE_TTL = 10 * 1000; // 10 Detik

  if (isGroup) {
    let metadataData = groupMetadataCache.get(replyJid);

    if (!metadataData || Date.now() - metadataData.time > GROUP_CACHE_TTL) {
      try {
        const metadata = await panjay.groupMetadata(replyJid);
        groupMetadataCache.set(replyJid, { data: metadata, time: Date.now() });
        metadataData = groupMetadataCache.get(replyJid);
      } catch (e) {
        console.error("Gagal mengambil metadata grup:", e);
      }
    }

    const metadata = metadataData?.data;

    if (metadata) {
      const participants = metadata.participants;

      // Deteksi Format JID
      const isLidGroup = participants.some((p) => p.id.endsWith("@lid"));

      const normalizeJid = (jid: string | undefined) => {
        if (!jid) return "";
        return (jid.split(":")[0] ?? "").split("@")[0] + "@s.whatsapp.net";
      };

      let botJidForSearch: string;

      if (isLidGroup) {
        const rawLid = panjay.user?.lid ?? panjay.user?.id;
        if (!rawLid) return;
        botJidForSearch = (rawLid.split(":")[0] ?? "").split("@")[0] + "@lid";
      } else {
        botJidForSearch = normalizeJid(panjay.user?.id);
      }

      const senderJidClean = msg.key.participant ?? "";
      const userParticipant = participants.find((p) => p.id === senderJidClean);

      if (userParticipant) {
        isAdmin =
          userParticipant.admin === "admin" ||
          userParticipant.admin === "superadmin";
      }

      const botParticipant = participants.find((p) => p.id === botJidForSearch);

      isBotAdmin =
        botParticipant?.admin === "admin" ||
        botParticipant?.admin === "superadmin" ||
        false;

      // console.log("[BOT SEARCH JID]", botJidForSearch);
      // console.log("[BOT PARTICIPANT]", botParticipant);
      // console.log("[IS BOT ADMIN]", isBotAdmin);
    }
  }

  // Premium
  const isPremium = await dataStore.isPremiumUser(normalizedSender);

  //ITLG
  const isITLGGroup = await dataStore.isITLGGroup(replyJid);

  // Creator
  const isPanjay = msg.key.fromMe ? msg.key.fromMe : (await dataStore.isCreator(normalizedSender));

  // Delete Message
  async function deleteMessage(msgKey: WAMessageKey | undefined, tag = "DELETE") {
    if (!msgKey) return;
    if (!msgKey.id) return;
    const messageId = msgKey.id;
    const targetJid: string = replyJid;
    try {
      await panjay.sendMessage(targetJid, {
        delete: {
          remoteJid: replyJid,
          fromMe: msgKey.fromMe ?? true,
          id: messageId,
          ...(msgKey.participant ? { participant: msgKey.participant } : {}),
        },
      });
      console.log(chalk.red.bold(`[${tag}]`), `Pesan Dihapus (${messageId})`);
    } catch (err) {
      console.error(`[${tag}] Gagal hapus pesan:`, err);
    }
  }

  // Inisialisasi temporary cache
  panjay.cache = panjay.cache ?? {};

  let usedPrefix: string | null = null;
  for (const pre of globalThis.prefix) {
    if (body.startsWith(pre)) {
      usedPrefix = pre;
      break;
    }
  }

  const args = usedPrefix
    ? body.slice(usedPrefix.length).trim().split(" ")
    : body.trim().split(" ");

  const command = args.shift()?.toLowerCase() ?? "";
  const q = args.join(" ");

  // Helper
  const PanjayText = (text: string) =>
    panjay.sendMessage(replyJid, { text }, { quoted: msg });

  const PanjayReact = (emoji: string | undefined) => {
    emoji = emoji === undefined ? emoji : emoji in reactList ? reactList[emoji] : emoji;
    return panjay.sendMessage(
      replyJid,
      { react: { text: emoji ?? "", key: msg.key } },
      { quoted: msg },
    );
  }

  const PanjayInvalid = (options: CommandResponseOptions, react?: boolean) => {
    if (react) PanjayReact("❌");
    return PanjayText(
      formatCommandResponse({
        prefix: usedPrefix ?? "",
        command,
        ...options,
      }),
    );
  }

  const PanjayWait = () => panjayreply(globalThis.mess.wait);

  // Send Video
  const PanjayVideo = (url: string, caption = "") =>
    panjay.sendMessage(replyJid, { video: { url }, caption }, { quoted: msg });

  // Send Image
  const PanjayImage = (url: string, caption = "") =>
    panjay.sendMessage(replyJid, { image: { url }, caption }, { quoted: msg });

  // Send Audio
  const PanjayAudio = (url: string, ptt = false) =>
    panjay.sendMessage(
      replyJid,
      { audio: { url }, mimetype: "audio/mpeg", ptt },
      { quoted: msg },
    );

  // Send File
  const PanjayFile = (buffer: Buffer, fileName: string, mime: string) =>
    panjay.sendMessage(
      replyJid,
      { document: buffer, fileName, mimetype: mime },
      { quoted: msg },
    );

  // Factory builders luna-lib (chain methods lalu panggil .send(replyJid, { quoted: msg }))
  const PanjayButton = () =>
    (new (Button as unknown as new (s: unknown) => import("./types.ts").LunaButtonBuilder)(panjay));

  const PanjayButtonV2 = () =>
    (new (ButtonV2 as unknown as new (s: unknown) => import("./types.ts").LunaButtonV2Builder)(panjay));

  const PanjayCarousel = () =>
    (new (Carousel as unknown as new (s: unknown) => import("./types.ts").LunaCarouselBuilder)(panjay));

  const PanjayAIRich = () =>
    (new (AIRich as unknown as new (s: unknown) => import("./types.ts").LunaAIRichBuilder)(panjay));

  // [ ===== Plugin Before ===== ]
  for (const bp of beforePlugins) {
    const shouldContinue = await bp({
      body,
      command,
      usedPrefix,
      args,
      q,
      panjay,
      m,
      msg,
      mediaType,
      len,
      replyJid,
      senderJid,
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
      plugins,
      commands,
      normalizedSender,
      deleteMessage,
      PanjayButton,
      PanjayButtonV2,
      PanjayCarousel,
      PanjayAIRich,
    });
    if (shouldContinue === false) return;
  }

  // Cek prefix — setelah before plugins, sebelum command handler
  if (!usedPrefix && !globalThis.noprefix) return;

  if (!commands.has(command)) {
    /*return PanjayText(
      formatCommandResponse({
        prefix: usedPrefix ?? "",
        command,
        title: "UNKNOWN COMMAND",
        message: "Perintah tidak dikenali.",
        details: "Gunakan menu untuk melihat daftar perintah.",
      }),
    );*/

    return ;
  }

  const pluginData = commands.get(command);
  if (!pluginData) return;
  const { execute, info } = pluginData;

  // Control
  if (info.enabled === false) return PanjayText(globalThis.mess.disable);

  if (info.maintenance === true && !isPanjay)
    return PanjayText(globalThis.mess.maintenance);

  if (!isGroup) {
    if (!isPremium && !isPanjay) {
      if (!info.allowPrivate) {
        return PanjayText(
          formatCommandResponse({
            prefix: usedPrefix ?? "",
            command,
            title: "PREMIUM REQUIRED",
            message: "Fitur ini tidak tersedia di private chat untuk user non-premium.",
            details: "Gunakan di grup atau upgrade ke premium untuk akses private chat.",
          }),
        );
      }
    }
  }

  if (info.owner && !isPanjay) return PanjayText(globalThis.mess.creator);

  if (info.premium && !isPremium && !isPanjay)
    return PanjayText(globalThis.mess.premium);

  if (info.group && !isGroup) return PanjayText(globalThis.mess.group);

  if (info.private && isGroup) return PanjayText(globalThis.mess.private);

  if (info.admin && !isAdmin) return PanjayText(globalThis.mess.admin);

  if (info.botAdmin && !isBotAdmin) return PanjayText(globalThis.mess.botadmin);

  if (!isPanjay && (info.group && info.itlg && !isITLGGroup)) return PanjayText(globalThis.mess.itlggroup);

  await execute({
    body,
    command,
    usedPrefix,
    args,
    q,
    panjay,
    m,
    msg,
    mediaType,
    len,
    replyJid,
    senderJid,
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
    plugins,
    commands,
    normalizedSender,
    deleteMessage,
    PanjayButton,
    PanjayButtonV2,
    PanjayCarousel,
    PanjayAIRich,
  });
}
