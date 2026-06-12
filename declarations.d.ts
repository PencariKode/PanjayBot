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
