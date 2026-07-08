import "dotenv/config";
import path from "path";
import { envBoolean, envList, envString, rootDir } from "./lib/configUtil.ts";
import type { GlobalMessages } from "./types.ts";

export const botConfig = {
  enabled: envBoolean("WHATSAPP_ENABLED", true),
  identity: {
    name: envString("BOT_NAME", "Panjay"),
    displayName: envString("BOT_DISPLAY_NAME", "Panjay Bot"),
    version: envString("BOT_VERSION", "1.0"),
    description: envString("BOT_DESCRIPTION", "Panjay WhatsApp Bot"),
  },
  owner: {
    name: envString("OWNER_NAME", "Panji Depari"),
    contact: envString("OWNER_CONTACT", "wa.me/6287869164526"),
    stickerContact: envString("STICKER_OWNER_CONTACT", "Bot: 0838-4034-9166"),
    email: envString("OWNER_EMAIL", "pencaricode@gmail.com"),
    instagram: envString("OWNER_INSTAGRAM", "panjidepari"),
    youtube: envString("OWNER_YOUTUBE", "Panjay"),
  },
  sticker: {
    packId: envString("STICKER_PACK_ID", "https://PencariKode.github.com/"),
    packName: envString("STICKER_PACK_NAME", "Panjay Bot"),
    author: envString("STICKER_AUTHOR", "Bot: 0838-4034-9166"),
    categories: envList("STICKER_CATEGORIES", [""]),
  },
  command: {
    prefixes: envList("BOT_PREFIXES", ["#", ".", "!", "/"]),
    noPrefix: envBoolean("BOT_NO_PREFIX", false),
  },
  whatsapp: {
    usePairingCode: envBoolean("WA_USE_PAIRING_CODE", true),
    sessionDir: path.resolve(rootDir, envString("WA_SESSION_DIR", "PanjaySesi")),
    browser: [
      envString("WA_BROWSER_OS", "Ubuntu"),
      envString("WA_BROWSER_NAME", "Chrome"),
      envString("WA_BROWSER_VERSION", "20.0.04"),
    ] as [string, string, string],
    defaultPushName: envString("WA_DEFAULT_PUSH_NAME", "Panjay"),
  },
  paths: {
    menuImage: path.resolve(rootDir, envString("MENU_IMAGE_PATH", "database/image/panjay.jpeg")),
    orders: path.resolve(rootDir, envString("ORDERS_DB_PATH", "database/orders.json")),
    premiumUsers: path.resolve(rootDir, envString("PREMIUM_DB_PATH", "database/premium.json")),
    creators: path.resolve(rootDir, envString("CREATOR_DB_PATH", "database/creator.json")),
    itlgStudents: path.resolve(rootDir, envString("ITLG_STUDENT_DB_PATH", "database/itlg_students.json")),    
    itlgGroups: path.resolve(rootDir, envString("ITLG_GROUP_DB_PATH", "database/itlg_groups.json")),    
    pluginState: path.resolve(rootDir, envString("PLUGIN_STATE_PATH", "database/system/plugins.json")),
  },
  branding: {
    footer: envString("BOT_FOOTER", "Panjay Bot"),
    startupTitle: envString("STARTUP_TITLE", "Script Panjay Rebuild"),
    baseName: envString("BASE_NAME", "Panjay"),
  },
  database: {
      sessionStore: envString("SESSION_STORE", "file") as "file" | "database",
      dataStore: envString("DATA_STORE", "file") as "file" | "database",
  },
  messages: {
    wait: envString("MSG_WAIT", "╭─〔 *WAIT* 〕\n│ ◇ One moment, please.\n╰────────────"),
    error: envString("MSG_ERROR", "╭─〔 *ERROR* 〕\n│ ◇ Gagal saat melakukan proses.\n╰────────────"),
    default: envString("MSG_DEFAULT", "╭─〔 *UNKNOWN COMMAND* 〕\n│ ◇ Perintah tidak dikenali.\n╰────────────"),
    admin: envString("MSG_ADMIN", "╭─〔 *ADMIN ONLY* 〕\n│ ◇ Fitur ini khusus admin grup.\n╰────────────"),
    botadmin: envString("MSG_BOT_ADMIN", "╭─〔 *BOT ADMIN* 〕\n│ ◇ Bot harus menjadi admin terlebih dahulu.\n╰────────────"),
    group: envString("MSG_GROUP", "╭─〔 *GROUP ONLY* 〕\n│ ◇ Fitur ini hanya bisa digunakan di grup.\n╰────────────"),
    private: envString("MSG_PRIVATE", "╭─〔 *PRIVATE ONLY* 〕\n│ ◇ Fitur ini hanya bisa digunakan di private chat.\n╰────────────"),
    premium: envString("MSG_PREMIUM", "╭─〔 *PREMIUM ONLY* 〕\n│ ◇ Fitur ini khusus user premium.\n╰────────────"),
    itlggroup: envString("MSG_ITLG_GROUP", "╭─〔 *ITLG GROUP ONLY* 〕\n│ ◇ Fitur ini hanya bisa digunakan di grup ITLG yang terdaftar.\n╰────────────"),
    itlgstudent: envString("MSG_ITLG_STUDENT", "╭─〔 *ITLG STUDENT ONLY* 〕\n│ ◇ Fitur ini hanya bisa digunakan oleh mahasiswa ITLG\n│ ◇ Silahkan enroll terlebih dahulu!\n╰────────────"),
    order: envString("MSG_ORDER", "╭─〔 *PRIVATE PAYMENT* 〕\n│ ◇ Pembayaran hanya bisa dilakukan di private chat.\n╰────────────"),
    creator: envString("MSG_CREATOR", "╭─〔 *OWNER ONLY* 〕\n│ ◇ Fitur ini khusus owner.\n╰────────────"),
    disable: envString("MSG_DISABLE", "╭─〔 *DISABLED* 〕\n│ ◇ Fitur ini sedang dinonaktifkan.\n╰────────────"),
    maintenance: envString("MSG_MAINTENANCE", "╭─〔 *MAINTENANCE* 〕\n│ ◇ Fitur ini sedang dalam perbaikan.\n╰────────────"),
  } satisfies GlobalMessages,
  secrets: {
    removeBgApiKey: envString("REMOVEBG_API_KEY"),
  },
} as const;

export type BotConfig = typeof botConfig;
