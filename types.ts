import type {
  GroupMetadata,
  proto,
  WAMessage,
  WAMessageKey,
} from "@whiskeysockets/baileys";

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

export interface PanjaySocket {
  authState: {
    creds: {
      registered: boolean;
    };
  };
  user?: {
    id: string;
    lid?: string;
  };
  ev: {
    on(event: "creds.update", listener: () => Awaitable<void>): void;
    on(
      event: "connection.update",
      listener: (update: { connection?: "close" | "open" | string }) => Awaitable<void>,
    ): void;
    on(
      event: "messages.upsert",
      listener: (message: MessageUpsert) => Awaitable<void>,
    ): void;
  };
  requestPairingCode(phoneNumber: string): Promise<string>;
  sendMessage(
    jid: string,
    content: unknown,
    options?: unknown,
  ): Promise<unknown>;
  groupMetadata(jid: string): Promise<GroupMetadata>;
  profilePictureUrl(jid: string, type: "image" | "preview"): Promise<string>;
  downloadMediaMessage(message: unknown): Promise<Buffer>;
  sendImageAsSticker(
    jid: string,
    path: StickerInput,
    quoted: unknown,
    options?: StickerOptions,
  ): Promise<Buffer | string>;
  sendVideoAsSticker(
    jid: string,
    path: StickerInput,
    quoted: unknown,
    options?: StickerOptions,
  ): Promise<Buffer | string>;
  groupParticipantsUpdate(
    jid: string,
    participants: string[],
    action: "add" | "remove" | "promote" | "demote",
  ): Promise<unknown>;
  relayMessage(jid: string, message: proto.IMessage, options: unknown): Promise<unknown>;
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
  command: string;
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
  PanjayWait: () => Promise<unknown>;
  PanjayVideo: (url: string, caption?: string) => Promise<unknown>;
  PanjayImage: (url: string, caption?: string) => Promise<unknown>;
  PanjayAudio: (url: string, ptt?: boolean) => Promise<unknown>;
  PanjayFile: (buffer: Buffer, fileName: string, mime: string) => Promise<unknown>;
  mediaType: string | null;
  isGroup: boolean;
  isAdmin: boolean;
  isBotAdmin: boolean;
  isPremium: boolean;
  isPanjay: boolean;
  plugins: PluginHandler[];
  commands: Map<string, PluginCommand>;
  normalizedSender: string;
  deleteMessage: (msgKey: WAMessageKey | undefined, tag?: string) => Promise<void>;
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
