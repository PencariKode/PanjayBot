import type { proto } from "@whiskeysockets/baileys";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";

/**
 * Normalizes an Indonesian phone number string into a WhatsApp JID.
 *
 * @example
 * normalizeJid("087869164526") // "6287869164526@s.whatsapp.net"
 * normalizeJid("+62 878-6916-4526") // "6287869164526@s.whatsapp.net"
 */
export function normalizeJid(nowa: string): string {
  let jid = nowa.replace(/[+ -]/g, "");
  if (jid.startsWith("08")) jid = "62" + jid.substring(1);
  if (!jid.endsWith("@s.whatsapp.net")) jid += "@s.whatsapp.net";
  return jid;
}


/**
 * Extracts the value of a flag from an args array (mutates the array).
 *
 * @param args     - The args array to search in (will be mutated).
 * @param flag     - The flag name(s) to look for. Pass a string[] to support
 *                   aliases, e.g. ["--nama", "-n"].
 * @param multiWord - When true, consumes all tokens after the flag that do not
 *                   start with "--" and joins them with spaces. Useful for
 *                   values that may contain spaces (e.g. full names).
 *
 * Returns `undefined` when the flag is not present or has no value.
 *
 * @example
 * const args = ["--nim", "241402034", "--nama", "Panji", "Briant"];
 * extractFlag(args, "--nim");                        // "241402034"
 * extractFlag(args, ["--nama", "-n"], true);         // "Panji Briant"
 */
export function extractFlag(
  args: string[],
  flag: string | string[],
  multiWord = false,
): string | undefined {
  const flags = Array.isArray(flag) ? flag : [flag];
  const idx = args.findIndex((a) => flags.includes(a));
  if (idx === -1) return undefined;

  args.splice(idx, 1); // remove the flag itself

  if (multiWord) {
    const parts: string[] = [];
    while (args[idx] && !args[idx].startsWith("--")) {
      parts.push(args.splice(idx, 1)[0]!);
    }
    return parts.join(" ") || undefined;
  }

  // Single-word: take the next token
  const value = args[idx];
  if (value !== undefined) args.splice(idx, 1);
  return value;
}


/**
 * Downloads a Baileys document message and returns its content as a UTF-8
 * string. Intended for CSV files.
 */
export async function downloadDocumentAsString(
  docMess: proto.Message.IDocumentMessage,
): Promise<string> {
  const stream = await downloadContentFromMessage(docMess, "document");
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}

/**
 * Returns `true` when the first line of `text` looks like a CSV header row
 * that contains a `nowa` column.
 */
export function isNowaCsv(text: string): boolean {
  return /(?=[^]*\bnowa\b)(,[a-z]+){1,3}/.test(
    text.toLowerCase().split("\n")[0] ?? "",
  );
}
