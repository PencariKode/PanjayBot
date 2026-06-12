import { botConfig } from "./config.ts";

globalThis.spackname = botConfig.sticker.packName;
globalThis.sauthor = botConfig.sticker.author;
globalThis.prefix = [...botConfig.command.prefixes];
globalThis.noprefix = botConfig.command.noPrefix;
globalThis.MenuImage = botConfig.paths.menuImage;
globalThis.mess = botConfig.messages;
