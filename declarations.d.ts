declare module "fluent-ffmpeg" {
  interface FfmpegCommand {
    on(event: "error", listener: (error: Error) => void): FfmpegCommand;
    on(event: "end", listener: (...args: unknown[]) => void): FfmpegCommand;
    addOutputOptions(options: string[]): FfmpegCommand;
    toFormat(format: string): FfmpegCommand;
    save(path: string): void;
  }

  export default function ffmpeg(input: string): FfmpegCommand;
}

declare module "@ryuu-reinzz/luna-lib" {
  export class Button {
    constructor(socket: import("./types.ts").PanjaySocket);
    setTitle(text: string): this;
    setSubtitle(text: string): this;
    setBody(text: string): this;
    setFooter(text: string): this;
    setImage(url: string | Buffer): this;
    addReply(text: string, id: string, options?: { icon?: string }): this;
    addUrl(text: string, url: string, webview?: boolean, options?: { icon?: string }): this;
    addCopy(text: string, code: string, options?: { icon?: string }): this;
    addSelection(title: string): this;
    makeSection(title: string): this;
    makeRow(header: string, title: string, description: string, id: string): this;
    toCard(): Promise<unknown>;
    send(jid: string, options?: { quoted?: unknown; [key: string]: unknown }): Promise<unknown>;
  }

  export class ButtonV2 {
    constructor(socket: import("./types.ts").PanjaySocket);
    setTitle(text: string): this;
    setSubtitle(text: string): this;
    setBody(text: string): this;
    setFooter(text: string): this;
    setThumbnail(url: string | Buffer): this;
    addButton(text: string, id?: string): this;
    send(jid: string, options?: { quoted?: unknown; [key: string]: unknown }): Promise<unknown>;
  }

  export class Carousel {
    constructor(socket: import("./types.ts").PanjaySocket);
    setBody(text: string): this;
    setFooter(text: string): this;
    addCard(card: unknown): this;
    send(jid: string, options?: { quoted?: unknown; [key: string]: unknown }): Promise<unknown>;
  }

  

  export class AIRich {
    constructor(socket: import("./types.ts").PanjaySocket);
    setType(type: string): this;
    setTitle(text: string): this;
    setFooter(text: string): this;
    addText(text: string): this;
    addSuggest(items: string[]): this;
    addTip(text: string): this;
    addCode(lang: string, code: string): this;
    addTable(data: string[][]): this;
    addImage(url: string): this;
    addVideo(url: string): this;
    addSource(sources: [string, string, string][]): this;
    addProduct(data: import("./types.ts").LunaProductProps | import("./types.ts").LunaProductProps[]): this;
    addReels(data: import("./types.ts").LunaReelsProps | import("./types.ts").LunaReelsProps[]): this;
    addPost(data: import("./types.ts").LunaPostProps | import("./types.ts").LunaPostProps[]): this;
    send(jid: string, options?: { quoted?: unknown; [key: string]: unknown }): Promise<unknown>;
  }

  interface LunaLibDefault {
    addProperty(socket: import("./types.ts").PanjaySocket, baileysModule: unknown): void;
    Button: typeof Button;
    ButtonV2: typeof ButtonV2;
    Carousel: typeof Carousel;
    AIRich: typeof AIRich;
  }

  const lunaLib: LunaLibDefault;
  export default lunaLib;
}

declare module "node-webpmux" {
  export interface WebPFrame {
    buffer?: Buffer;
    path?: string;
    img?: Image;
    x?: number;
    y?: number;
    delay?: number;
    blend?: boolean;
    dispose?: boolean;
    width?: number;
    height?: number;
    raw?: unknown;
    type?: unknown;
    vp8?: unknown;
    vp8l?: unknown;
    alph?: unknown;
  }

  export interface WebPSaveOptions {
    width?: number;
    height?: number;
    frames?: WebPFrame[];
    bgColor?: [number, number, number, number];
    loops?: number;
    delay?: number;
    x?: number;
    y?: number;
    blend?: boolean;
    dispose?: boolean;
    exif?: boolean | Buffer;
    iccp?: boolean | Buffer;
    xmp?: boolean | Buffer;
  }

  export interface WebPDemuxOptions {
    path?: string;
    buffers?: boolean;
    frame?: number;
    prefix?: string;
    start?: number;
    end?: number;
  }

  export class Image {
    static save(
      path: string | null,
      options: WebPSaveOptions,
    ): Promise<Buffer | void>;

    exif: Buffer | undefined;
    iccp: Buffer | undefined;
    xmp: Buffer | undefined;
    readonly hasAnim: boolean;
    readonly frames?: WebPFrame[];
    readonly width?: number;
    readonly height?: number;
    load(source: string | Buffer): Promise<void>;
    demux(options?: WebPDemuxOptions): Promise<Buffer[] | void>;
    save(path: string | null, options?: WebPSaveOptions): Promise<Buffer | void>;
  }

  const webp: {
    Image: typeof Image;
  };

  export default webp;
}

declare module "brat-canvas" {
  export type BratEmojiStyle =
    | "apple"
    | "google"
    | "twitter"
    | "facebook"
    | "samsung"
    | "microsoft";

  export interface BratImageOptions {
    theme?: string;
    emojiStyle?: BratEmojiStyle;
    debugMode?: boolean;
    W?: number;
    H?: number;
    BOX_W?: number;
    BOX_H?: number;
    BOX_PAD?: number;
    LINE_H?: number;
    FS_MIN?: number;
    FS_MAX?: number;
    BASELINE_ADJ?: number;
    C_BG?: string;
    C_BOX?: string;
    C_TEXT?: string;
    BLUR?: number;
    FONT_NAME?: string;
    FONT_WEIGHT?: string | number;
    FALLBACK_FONT?: string;
    fontPaths?: string[];
  }

  export function bratGen(
    text: string,
    options?: BratImageOptions,
  ): Promise<Buffer>;

  export default bratGen;
}
