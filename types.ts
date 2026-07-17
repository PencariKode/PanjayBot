import type {
  AuthenticationCreds,
  GroupMetadata,
  proto,
  WAMessage,
  WAMessageKey,
  WASocket
} from "@whiskeysockets/baileys";
import type { CommandResponseOptions } from "./lib/response.ts";

export type Awaitable<T> = T | Promise<T>;

export type JsonRecord = Record<string, unknown>;

export interface StickerOptions {
  packname?: string;
  author?: string;
  categories?: string[];
}

export type StickerInput = Buffer | string;

export interface DownloadableMessage {
  msg?: {
    mimetype?: string | null;
  };
  mimetype?: string | null;
  mtype?: string;
}


export interface LunaButtonBuilder {
  setTitle(text: string): this;
  setSubtitle(text: string): this;
  setBody(text: string): this;
  setFooter(text: string): this;
  setVideo(url: string | Buffer, options?: Record<string, unknown>): this;
  setImage(url: string | Buffer, options?: Record<string, unknown>): this;
  setDocument(url: string | Buffer, options?: Record<string, unknown>): this;
  setMedia(obj: Record<string, unknown>): this;
  clearButtons(): this;
  setParams(obj: Record<string, unknown>): this;
  addButton(name: string, params: {display_text: string; id: string} | string): this;
  addReply(text: string, id: string, options?: { icon?: string }): this;
  addUrl(text: string, url: string, webview?: boolean, options?: { icon?: string }): this;
  addCopy(text: string, code: string, options?: { icon?: string }): this;
  addCall(text: string, id: string, options: Record<string, unknown>): this;
  addReminder(text: string, id: string, options: Record<string, unknown>): this;
  addCancelReminder(text: string, id: string, options: Record<string, unknown>): this;
  addAddress(text: string, id: string, options: Record<string, unknown>): this;
  addLocation(options: Record<string, unknown>): this;
  addSelection(title: string): this;
  makeSection(title: string): this;
  makeRow(header: string, title: string, description: string, id: string): this;
  toCard(): Promise<unknown>;
  setContextInfo(obj: Record<string, unknown>): this;
  addPayload(obj: Record<string, unknown>): this;
  build(jid: string, options?: { quoted?: WAMessage;[key: string]: unknown }): Promise<unknown>;
  send(jid: string, options?: { quoted?: WAMessage;[key: string]: unknown }): Promise<unknown>;
}

export interface LunaButtonV2Builder {
  setTitle(text: string): this;
  setSubtitle(text: string): this;
  setBody(text: string): this;
  setFooter(text: string): this;
  setThumbnail(url: string | Buffer): this;
  addButton(text: string, id?: string): this;
  addRawButton(button: { buttonId: string; buttonText: {displayText: string}, type: number}): this;
  setContextInfo(obj: Record<string, unknown>): this;
  addPayload(obj: Record<string, unknown>): this;
  setMedia(obj: Record<string, unknown>): this;
  build(jid: string, options?: { quoted?: WAMessage;[key: string]: unknown }): Promise<unknown>;
  send(jid: string, options?: { quoted?: WAMessage;[key: string]: unknown }): Promise<unknown>;
}

export interface LunaCarouselBuilder {
  setBody(text: string): this;
  setFooter(text: string): this;
  addCard(card: unknown): this;
  setContextInfo(obj: Record<string, unknown>): this;
  addPayload(obj: Record<string, unknown>): this;
  build(jid: string, options?: { quoted?: WAMessage;[key: string]: unknown }): Promise<unknown>;
  send(jid: string, options?: { quoted?: WAMessage;[key: string]: unknown }): Promise<unknown>;
}

export interface LunaMessageBuilder {
  setType(type: "Button" | "ButtonV2" | "Carousel" | "AIRich"): this;
  setTitle(text: string): this;
  setSubtitle(text: string): this;
  setBody(text: string): this;
  setFooter(text: string): this;
  setImage(url: string | Buffer): this;
  setThumbnail(url: string | Buffer): this;
  setContextInfo(obj: Record<string, unknown>): this;
  addPayload(obj: Record<string, unknown>): this;
  addReply(text: string, id: string, options?: { icon?: string }): this;
  addUrl(text: string, url: string, webview?: boolean, options?: { icon?: string }): this;
  addCopy(text: string, code: string, options?: { icon?: string }): this;
  addButton(text: string, id?: string): this;
  addSelection(title: string): this;
  makeSection(title: string): this;
  makeRow(header: string, title: string, description: string, id: string): this;
  addCard(card: unknown): this;
  addText(text: string): this;
  addCode(lang: string, code: string): this;
  addTable(data: string[][]): this;
  addImage(url: string): this;
  addVideo(url: string): this;
  addProduct(data: Record<string, unknown> | Record<string, unknown>[]): this;
  addReels(data: Record<string, unknown> | Record<string, unknown>[]): this;
  addPost(data: Record<string, unknown> | Record<string, unknown>[]): this;
  addSuggest(items: string[]): this;
  addTip(text: string): this;
  addSource(sources: [string, string, string][]): this;
  send(options?: unknown): Promise<unknown>;
}

export interface LunaProductProps {
  title: string;
  brand: string;
  price: string;
  sale_price?: string;
  product_url?: string;
  icon_url?: string;
  image_url?: string;
}

export interface LunaReelsProps {
  username: string;
  profile_url: string;
  thumbnail: string;
  url: string;
  title: string;
  like: number;
  share: number;
  view: number;
  source: string;
  verified: boolean;
}

type LunaPostSourceType = 'INSTAGRAM' | 'FACEBOOOK' | 'THREADS';
export interface LunaPostProps {
  profile_url: string;
  username: string;
  title: string;
  subtitle: string;
  caption: string;
  verified: boolean;
  url: string;
  thumbnail: string;
  source: LunaPostSourceType | string;
  footer: string;
  deeplink: string;
  icon: string;
  orientation: 'LANDSCAPE' | 'PORTRAIT';
  post_type: 'PHOTO' | 'VIDEO' | string;
  comment: number;
  share: number;
  like: number;
}

type NestedStringArray = string | NestedStringArray[];
export interface LunaAIRichBuilder {
  setTitle(text: string): this;
  setFooter(text: string): this;
  setContextInfo(obj: Record<string, unknown>): this;
  addPayload(obj: Record<string, unknown>): this;
  addSubmessage(submessage: Record<string, unknown>[]): this;
  addSection(section: Record<string, unknown>[]): this;
  addSuggest(items: string[]): this;
  addTip(text: string): this;
  addText(text: string, options?: { hyperlink: boolean; citation: boolean; latex: boolean}): this;
  addProduct(data: LunaProductProps | LunaProductProps[]): this;
  addCode(lang: string, code: string): this;
  addTable(data: NestedStringArray[]): this;
  addSource(sources: [string, string, string][]): this;
  addImage(url: string): this;
  addVideo(url: string): this;
  addReels(data: LunaReelsProps | LunaReelsProps[]): this;
  addPost(data: LunaPostProps | LunaPostProps[]): this;
  build(recipient: string, options?: { forwarded: boolean; includesUnifiedResponse: boolean; includesSubmessages: boolean; quoted: WAMessage }): Promise<void>;
  send(recipient: string, options?: { forwarded: boolean; includesUnifiedResponse: boolean; includesSubmessages: boolean; quoted: WAMessage }): Promise<void>;
}


// export interface PanjaySocket {
//   authState: {
//     creds: AuthenticationCreds;
//   };
//   user?: {
//     id: string;
//     lid?: string;
//   };
//   ev: {
//     on(event: "creds.update", listener: () => Awaitable<void>): void;
//     on(
//       event: "connection.update",
//       listener: (update: {
//         connection?: "close" | "open" | string;
//       }) => Awaitable<void>,
//     ): void;
//     on(
//       event: "messages.upsert",
//       listener: (message: MessageUpsert) => Awaitable<void>,
//     ): void;
//   };
//   requestPairingCode(phoneNumber: string): Promise<string>;
//   sendMessage(
//     jid: string,
//     content: unknown,
//     options?: unknown,
//   ): Promise<unknown>;
//   groupMetadata(jid: string): Promise<GroupMetadata>;
//   profilePictureUrl(jid: string, type: "image" | "preview"): Promise<string>;
//   downloadMediaMessage(message: unknown): Promise<Buffer>;
//   sendImageAsSticker(
//     jid: string,
//     path: StickerInput,
//     quoted: unknown,
//     options?: StickerOptions,
//   ): Promise<Buffer | string>;
//   sendVideoAsSticker(
//     jid: string,
//     path: StickerInput,
//     quoted: unknown,
//     options?: StickerOptions,
//   ): Promise<Buffer | string>;
//   groupParticipantsUpdate(
//     jid: string,
//     participants: string[],
//     action: "add" | "remove" | "promote" | "demote",
//   ): Promise<unknown>;
//   relayMessage(
//     jid: string,
//     message: proto.IMessage,
//     options: unknown,
//   ): Promise<unknown>;
// }
export interface PanjaySocket extends WASocket {
  // Temporary cache — data sementara selama bot aktif (hilang saat restart)
  cache: Record<string, unknown>;
  downloadMediaMessage(message: unknown): Promise<Buffer>;
  messageBuilder(jid: string, options?: { quoted?: WAMessage }): LunaMessageBuilder;
  sendImageAsSticker(
    jid: string,
    path: StickerInput,
    quoted?: WAMessage,
    options?: StickerOptions,
  ): Promise<Buffer | string>;
  sendVideoAsSticker(
    jid: string,
    path: StickerInput,
    quoted?: WAMessage,
    options?: StickerOptions,
  ): Promise<Buffer | string>;
  sendOrder(
    jid: string,
    orderProps: {
      orderId: string;
      itemCount: number;
      status: number;
      orderTitle: string;
      message: string;
      totalAmount: number;
      totalCurrencyCode: string;
      thumbnail?: string;
    }
  ): Promise<Buffer | string>;
  sendAlbum(
    jid: string,
    album: {
      image: { url: string };
      caption?: string;
    }[],
    options?: { quoted?: WAMessage },
  ): Promise<Buffer | string>;
  sendStickerPack(
    jid: string,
    packProps: {
      name: string;
      publisher: string;
      description?: string;
      cover: Buffer;
      stickers: { data: Buffer; emojis: string[] }[];
    }
  ): Promise<Buffer | string>;
  getPNFromLid(m: MessageUpsert, lid: string): Promise<string>;
  getLidFromPN(m: MessageUpsert, phoneNumber: string): Promise<string>;
}

export interface MessageUpsert {
  messages: WAMessage[];
}

export interface HandlerMeta {
  body: string;
  mediaType: string | null;
  sender: string;
  pushname: string;
}

export interface PluginInfo {
  name: string;
  menu: string[];
  case: string[];
  description?: string;
  hidden?: boolean;
  owner?: boolean;
  premium?: boolean;
  group?: boolean;
  private?: boolean;
  admin?: boolean;
  botAdmin?: boolean;
  allowPrivate?: boolean;
  itlg?: boolean;
  enabled?: boolean;
  maintenance?: boolean;
}

export type PluginHandler = (context: PluginContext) => Awaitable<unknown>;

export interface PluginCommand {
  execute: PluginHandler;
  info: PluginInfo;
  category: string;
}

export interface PluginModule {
  default?: PluginHandler;
  info?: PluginInfo;
}

// Before Plugin — dijalankan sebelum command matching, return false untuk hentikan pipeline
export type BeforeHandler = (context: PluginContext) => Awaitable<boolean>;

export interface BeforePluginModule {
  default?: BeforeHandler;
  info?: {
    name: string;
    description?: string;
  };
}

export interface QuotedContactMessage {
  key: {
    participant: string;
    remoteJid: string;
  };
  message: {
    contactMessage: {
      displayName: string;
      vcard: string;
      jpegThumbnail: Buffer;
      thumbnail: Buffer;
      sendEphemeral: boolean;
    };
  };
}

export interface PluginContext {
  body: string;
  command: string;
  usedPrefix: string | null;
  args: string[];
  q: string;
  panjay: PanjaySocket;
  m: MessageUpsert;
  msg: WAMessage;
  len: QuotedContactMessage;
  replyJid: string;
  senderJid: string | null;
  panjayreply: (text: string) => Promise<unknown>;
  PanjayText: (text: string) => Promise<unknown>;
  PanjayInvalid: (options: CommandResponseOptions, react?: boolean) => Promise<unknown>;
  PanjayWait: () => Promise<unknown>;
  PanjayVideo: (url: string, caption?: string) => Promise<unknown>;
  PanjayImage: (url: string, caption?: string) => Promise<unknown>;
  PanjayAudio: (url: string, ptt?: boolean) => Promise<unknown>;
  PanjayFile: (
    buffer: Buffer,
    fileName: string,
    mime: string,
  ) => Promise<unknown>;
  PanjayReact: (emoji: string | undefined) => Promise<WAMessage | undefined>;
  mediaType: string | null;
  isGroup: boolean;
  isAdmin: boolean;
  isBotAdmin: boolean;
  isPremium: boolean;
  isPanjay: boolean;
  plugins: PluginHandler[];
  commands: Map<string, PluginCommand>;
  normalizedSender: string;
  deleteMessage: (
    msgKey: WAMessageKey | undefined,
    tag?: string,
  ) => Promise<void>;
  PanjayButton: () => LunaButtonBuilder;
  PanjayButtonV2: () => LunaButtonV2Builder;
  PanjayCarousel: () => LunaCarouselBuilder;
  PanjayAIRich: () => LunaAIRichBuilder;
}

export interface GlobalMessages {
  wait: string;
  error: string;
  default: string;
  admin: string;
  botadmin: string;
  group: string;
  private: string;
  premium: string;
  itlggroup: string;
  itlgstudent: string;
  order: string;
  creator: string;
  disable: string;
  maintenance: string;
}

declare global {
  var spackname: string;
  var sauthor: string;
  var prefix: string[];
  var noprefix: boolean;
  var MenuImage: string;
  var mess: GlobalMessages;
  var panjaymenu: string;
  var storelist: string;
  var commands: Map<string, PluginCommand>;
  var getOrderStats: () => {
    totalOrders: number;
    totalAmount: number;
  };
}
