import type { PluginContext, PluginInfo } from "../../types.ts";



const BASE_URL = "https://www.screenshotmachine.com";
type ScreenshotMode = "desktop" | "android" | "fullpage";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function getUserAgent(mode: ScreenshotMode): string {
  if (mode === "android") {
    return "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36";
  }
  return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";
}

function isMobile(mode: ScreenshotMode): boolean {
  return mode === "android";
}

function extractCookies(res: Response): string {
  const headers = res.headers as Headers & { getSetCookie?: () => string[] };
  const cookieHeader = headers.getSetCookie?.() ?? [];
  return cookieHeader.map((c: string) => c.split(";")[0] ?? "").join("; ");
}

interface CaptureData {
  link?: string;
}

async function captureScreenshot(url: string, mode: ScreenshotMode): Promise<Buffer> {
  const formParams: Record<string, string> = {
    url,
    device: mode === "android" ? "phone" : "desktop",
    cacheLimit: "0",
    "homepage-tab": "screenshot",
  };

  if (mode === "fullpage") {
    formParams.device = "desktop";
    formParams.full = "on";
  }

  const postBody = new URLSearchParams(formParams);

  const captureHeaders = {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    Accept: "*/*",
    "Accept-Language": "id-ID",
    "Sec-Ch-Ua": '"Chromium";v="127", "Not)A;Brand";v="99", "Microsoft Edge Simulate";v="127", "Lemur";v="127"',
    "Sec-Ch-Ua-Mobile": isMobile(mode) ? "?1" : "?0",
    "Sec-Ch-Ua-Platform": isMobile(mode) ? '"Android"' : '"Windows"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": getUserAgent(mode),
    "X-Requested-With": "XMLHttpRequest",
    Origin: BASE_URL,
    Referer: BASE_URL + "/",
  };

  const captureRes = await fetch(`${BASE_URL}/capture.php`, {
    method: "POST",
    headers: captureHeaders,
    body: postBody,
  });

  if (!captureRes.ok) throw new Error(`capture.php HTTP ${captureRes.status}`);

  const sessionCookie = extractCookies(captureRes);
  if (!sessionCookie) throw new Error("Tidak ada session cookie dari server");

  const captureText = await captureRes.text();
  let captureData: CaptureData = {};
  try {
    const parsed: unknown = JSON.parse(captureText);
    captureData =
      parsed && typeof parsed === "object" ? (parsed as CaptureData) : {};
  } catch {
    throw new Error(`Gagal parse response: ${captureText.slice(0, 200)}`);
  }

  if (!captureData.link) throw new Error("Tidak ada link screenshot dari server");

  await sleep(4000);

  const serveUrl = `${BASE_URL}/${captureData.link}`;
  const serveHeaders = {
    Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "Accept-Language": "id-ID",
    Cookie: sessionCookie,
    "Sec-Ch-Ua": '"Chromium";v="127", "Not)A;Brand";v="99", "Microsoft Edge Simulate";v="127", "Lemur";v="127"',
    "Sec-Ch-Ua-Mobile": isMobile(mode) ? "?1" : "?0",
    "Sec-Ch-Ua-Platform": isMobile(mode) ? '"Android"' : '"Windows"',
    "Sec-Fetch-Dest": "image",
    "Sec-Fetch-Mode": "no-cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": getUserAgent(mode),
    Referer: BASE_URL + "/",
  };

  const serveRes = await fetch(serveUrl, { headers: serveHeaders });
  const contentType = serveRes.headers.get("content-type") ?? "";

  if (!serveRes.ok) {
    const body = await serveRes.text();
    throw new Error(`serve.php HTTP ${serveRes.status}: ${body.slice(0, 200)}`);
  }

  if (!contentType.includes("image")) {
    const body = await serveRes.text();
    throw new Error(`Expected image tapi dapat: ${contentType}\n${body.slice(0, 200)}`);
  }

  const imageBuffer = Buffer.from(await serveRes.arrayBuffer());
  if (imageBuffer.length < 1000) throw new Error(`Gambar terlalu kecil (${imageBuffer.length} bytes)`);

  return imageBuffer;
}

export const info: PluginInfo = {
  name: "Screenshot Website",
  menu: ["ss"],
  case: ["ss", "screenshot", "skrinsut", "webss"],
  description: "Screenshot Website Kamu Dalam Tiga Mode [ Desktop, Android, Fullpage ]",
  hidden: false,
  owner: false,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,
  allowPrivate: true,
};

export default async function handler(panjy: PluginContext) {
  const { command,
    q,
    panjay,
    msg,
    replyJid,
    PanjayText,
    PanjayWait,
    PanjayInvalid,
  } = panjy;

  const parts = q.trim().split(/\s+/);
  let url = parts[0];
  const modeArg = parts[1]?.toLowerCase();

  if (!url) {
    return PanjayInvalid({
      title: "SCREENSHOT WEBSITE",
      message: "Screenshot Website Kamu Dalam Tiga Mode",
      customFields: {
        "Compatible": ["`Desktop`", "`Android`", "`Fullpage`"]
      },
      examples: [
        `${command} https://api.fromscratch.web.id/`,
        `${command} https://api.fromscratch.web.id/ android`
      ]
    });
  }

  if (!/^https?:\/\//i.test(url)) url = "https://" + url;

  const validModes = ["desktop", "android", "fullpage"] as const;
  const mode: ScreenshotMode =
    modeArg && (validModes as readonly string[]).includes(modeArg)
      ? (modeArg as ScreenshotMode)
      : "desktop";

  await PanjayWait();

  try {
    const imageBuffer = await captureScreenshot(url, mode);

    const timestamp = Date.now();
    const fileName = `screenshot_${mode}_${timestamp}.jpg`;
    const modeLabel: string = {
      desktop: "Desktop",
      android: "Android",
      fullpage: "Fullpage",
    }[mode];

    await panjay.sendMessage(
      replyJid,
      {
        image: imageBuffer,
        caption:
          `*Screenshot Berhasil!*\n` +
          `\`${modeLabel}\` Mode`,
      },
      { quoted: msg }
    );
  } catch (err) {
    console.error("[SKRINSUT] Error:", err);
    return PanjayText(
      `⚠️ *Gagal screenshot!*\n\nError: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
