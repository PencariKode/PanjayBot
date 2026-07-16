import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import type { PluginContext, PluginInfo } from "../../types.ts";
import { getDataStore } from "../../lib/dataStore.ts";
import { botConfig } from "../../config.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const casePath = path.join(__dirname, "../");
const folders = fs
  .readdirSync(casePath)
  .filter((f) => fs.statSync(path.join(casePath, f)).isDirectory());

const categoryMenus = folders.map((f) => `${f.toLowerCase()}menu`);

export const info: PluginInfo = {
  name: "Menu",
  menu: ["menu", "help", "allmenu", ...categoryMenus],
  case: ["menu", "help", "allmenu", ...categoryMenus],
  description: "Menampilkan daftar menu",
  hidden: true,
};

type PluginLabel =
  | "Public"
  | "Owner"
  | "Premium"
  | "Admin"
  | "BotAdmin"
  | "Group"
  | "Private"
  | "ITLG";

function getLabel(info: PluginInfo): PluginLabel {
  if (info.owner) return "Owner";
  if (info.premium) return "Premium";
  if (info.admin) return "Admin";
  if (info.botAdmin) return "BotAdmin";
  if (info.group) return "Group";
  if (info.private) return "Private";
  if (info.itlg) return "ITLG";
  return "Public";
}

const labelPriority: Record<PluginLabel, number> = {
  Public: 0,
  Owner: 1,
  ITLG: 2,
  Premium: 3,
  Admin: 4,
  BotAdmin: 5,
  Group: 6,
  Private: 7,
};

export default async function handler(panjy: PluginContext) {
  const { command, panjay, msg, replyJid, normalizedSender, panjayreply } =
    panjy;

  const dataStore = getDataStore();
  const isItlgStudent = await dataStore.isITLGStudent(normalizedSender);

  // Build categories map locally to avoid using the internal state of panjay.ts
  const categories = new Map<string, PluginInfo[]>();
  for (const [cmd, data] of panjy.commands.entries()) {
    const cat = data.category;
    if (!categories.has(cat)) categories.set(cat, []);
    const catList = categories.get(cat)!;
    
    // Avoid duplicate PluginInfo in a category (since commands mapping is by case string)
    if (!catList.includes(data.info)) {
      catList.push(data.info);
    }
  }

  const MenuImage = fs.readFileSync(globalThis.MenuImage);

  // All Menu
  if (command === "allmenu") {
    let text = globalThis.panjaymenu;

    for (let [cat, list] of categories) {
      let visible = list.filter((i) => !i.hidden);
      if (!isItlgStudent && cat.toLowerCase() === "itlg") continue;

      if (visible.length === 0) continue;

      text += `\n╭─〔 *${cat.toUpperCase()}* 〕\n`;

      visible
        .sort((a, b) => {
          const labelA = getLabel(a);
          const labelB = getLabel(b);

          const priorityDiff = labelPriority[labelA] - labelPriority[labelB];

          if (priorityDiff !== 0) return priorityDiff;

          return a.name.localeCompare(b.name);
        })
        .forEach((item) => {
          const label = getLabel(item);
          let tag = label !== "Public" ? ` [${label}]` : "";

          if (item.maintenance) tag += " [MTNC]";
          if (item.enabled === false) tag += " [OFF]";

          item.menu
            .sort((a, b) => a.localeCompare(b))
            .forEach((cmd) => {
              text += `│ › .${cmd.toLowerCase()}${tag}\n`;
            });
        });

      text += "╰────────────\n";
    }

    await panjay.sendMessage(
      replyJid,
      {
        image: MenuImage,
        caption: `${text}\n╰─〔 *${botConfig.branding.footer}* 〕`,
        mentions: [normalizedSender],
      },
      { quoted: msg },
    );
    return;
  }

  // Category Menu
  if (command === "menu" || command === "help") {
    let text = globalThis.panjaymenu || "╭─〔 *DAFTAR MENU* 〕\n";

    text += "\n╭─〔 *AVAILABLE CATEGORIES* 〕\n";

    folders
      .sort((a, b) => a.localeCompare(b))
      .forEach((folder) => {
        if (folder.toLowerCase() === "itlg" && !isItlgStudent) return;
        text += `│ › .${folder.toLowerCase()}menu\n`;
      });

    text += "╰────────────\n";

    await panjay.sendMessage(
      replyJid,
      {
        image: MenuImage,
        caption: `${text}\n╰─〔 *${botConfig.branding.footer}* 〕`,
        mentions: [normalizedSender],
      },
      { quoted: msg },
    );
    return;
  }

  // Category Menu Dynamic
  if (command.endsWith("menu") && command !== "allmenu") {
    const kategori = command.replace("menu", "").toLowerCase();

    if (!folders.includes(kategori)) return;

    // Additional security for ITLG
    if (kategori === "itlg" && !isItlgStudent) return;

    let text = `╭─〔 *${kategori.toUpperCase()} MENU* 〕\n`;

    const list = categories.get(kategori) || [];
    const visible = list.filter((i) => !i.hidden);

    visible
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((item) => {
        const label = getLabel(item);
        let tag = label !== "Public" ? ` [${label}]` : "";

        if (item.maintenance) tag += " [Main]";
        if (item.enabled === false) tag += " [Off]";

        item.menu
          .sort((a, b) => a.localeCompare(b))
          .forEach((cmd) => {
            text += `│ › .${cmd.toLowerCase()}${tag}\n`;
          });
      });

    text += "╰────────────\n";

    await panjayreply(`${text}\n╰─〔 *${botConfig.branding.footer}* 〕`);
    return;
  }
}
