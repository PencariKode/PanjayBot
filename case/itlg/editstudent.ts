import type { PluginContext, PluginInfo } from "../../types.ts";
import type { proto } from "@whiskeysockets/baileys";
import { parse, Row } from "@fast-csv/parse";
import {
  addITLGStudent,
  findITLGStudentByJid,
} from "../../lib/database.ts";
import {
  downloadDocumentAsString,
  extractFlag,
  isNowaCsv,
  normalizeJid,
} from "../../lib/utils.ts";

type EditRow = {
  nowa: string;
  nim?: string;
  namalengkap?: string;
  isverified?: string;
};

export const info: PluginInfo = {
  name: "Edit ITLG Student",

  menu: ["editstudent <nowa> [--nim <nim>] [--nama <nama>] [--verified <0|1>]"],
  case: ["editstudent", "edititlg"],

  description: "Edit data ITLG student (satu per satu atau massal via CSV)",
  hidden: true,

  owner: true,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,
  itlg: false,

  allowPrivate: true,
};

export default async function handler(panjy: PluginContext) {
  const {
    command,
    args,
    q,
    panjay,
    msg,
    replyJid,
    PanjayInvalid,
    PanjayReact,
    panjayreply,
  } = panjy;

  const ctx = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const docMess =
    msg.message?.documentMessage ||
    ctx?.documentMessage ||
    ctx?.documentWithCaptionMessage?.message?.documentMessage ||
    null;

  await PanjayReact("⌛");

  if (docMess) {
    if (docMess.mimetype !== "text/csv") {
      await PanjayReact("err");
      return PanjayInvalid({
        title: "WRONG FORMAT",
        message: "Fitur ini hanya menerima file dalam format CSV",
      });
    }

    try {
      const csv = await downloadDocumentAsString(docMess);
      const { updated, skipped } = await csvEditParser(csv);
      await PanjayReact("✅");
      return panjay.sendMessage(replyJid, {
        text:
          `Berhasil mengubah *${updated}* data mahasiswa dari file CSV` +
          (skipped > 0 ? `\n_${skipped} baris dilewati (nomor tidak ditemukan)_` : ""),
      });
    } catch (err) {
      await PanjayReact("err");
      return PanjayInvalid({
        title: "ERROR",
        message:
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat memproses file CSV",
      });
    }
  }

  if (!q.trim() || !args.length) {
    await PanjayReact("err");
    return PanjayInvalid({
      title: "NO INPUT",
      message:
        "Gunakan format teks untuk edit satu mahasiswa, atau kirim file CSV untuk edit massal.",
      usage:
        `${command} <no telp> [--nim <nim>] [--nama <nama lengkap>] [--verified <0|1>]\n` +
        `atau kirimkan file CSV dengan header: nowa,nim,namalengkap,isverified`,
      example: `${command} 087869164526 --nim 241402034 --nama Panji Briant Depari --verified 1`,
    });
  }

  const isRawCsv = isNowaCsv(q);

  if (isRawCsv) {
    try {
      const { updated, skipped } = await csvEditParser(q.trim());
      await PanjayReact("✅");
      return panjay.sendMessage(replyJid, {
        text:
          `Berhasil mengubah *${updated}* data mahasiswa dari teks CSV` +
          (skipped > 0 ? `\n_${skipped} baris dilewati (nomor tidak ditemukan)_` : ""),
      });
    } catch (err) {
      await PanjayReact("err");
      return PanjayInvalid({
        title: "ERROR",
        message:
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat memproses CSV",
      });
    }
  }

  // ── Mode satu per satu (flag-based) ────────────────────────────────────────
  // Format: editstudent <nowa> [--nim <nim>] [--nama <nama>] [--verified <0|1>]
  const rawArgs = [...args] as string[];
  const nowa = rawArgs.shift()!;

  const nim = extractFlag(rawArgs, "--nim");
  const nama = extractFlag(rawArgs, "--nama", true);
  const verifiedFlag = extractFlag(rawArgs, "--verified");

  const isVerified =
    verifiedFlag === "1" ? true : verifiedFlag === "0" ? false : undefined;

  if (verifiedFlag !== undefined && isVerified === undefined) {
    await PanjayReact("err");
    return PanjayInvalid({
      title: "NILAI VERIFIED SALAH",
      message: "Nilai --verified harus 0 atau 1",
    });
  }

  if (!nim && !nama && isVerified === undefined) {
    await PanjayReact("err");
    return PanjayInvalid({
      title: "TIDAK ADA PERUBAHAN",
      message: "Tentukan minimal satu field yang ingin diubah: --nim, --nama, atau --verified",
      usage: `${command} <no telp> [--nim <nim>] [--nama <nama>] [--verified <0|1>]`,
    });
  }

  let jid = nowa.replace(/[+ -]/g, "");
  if (jid.startsWith("08")) jid = "62" + jid.substring(1);
  if (!jid.endsWith("@s.whatsapp.net")) jid += "@s.whatsapp.net";

  try {
    const student = await findITLGStudentByJid(jid);
    if (!student) {
      await PanjayReact("err");
      return PanjayInvalid({
        title: "MAHASISWA TIDAK DITEMUKAN",
        message: `Nomor *${nowa}* tidak terdaftar dalam database ITLG.`,
      });
    }

    await addITLGStudent(jid, isVerified, nama ?? undefined, nim ?? undefined);

    const changes: string[] = [];
    if (nim) changes.push(`NIM → *${nim}*`);
    if (nama) changes.push(`Nama → *${nama}*`);
    if (isVerified !== undefined) changes.push(`Verified → *${isVerified ? "Ya" : "Tidak"}*`);

    await PanjayReact("✅");
    return panjayreply(
      `Data mahasiswa *${nowa}* berhasil diperbarui:\n${changes.join("\n")}`,
    );
  } catch (err) {
    await PanjayReact("err");
    return panjayreply(
      `Terjadi kesalahan: ${err instanceof Error ? err.message : err}`,
    );
  }
}


async function csvEditParser(
  csv: string,
): Promise<{ updated: number; skipped: number }> {
  return new Promise((resolve, reject) => {
    let updated = 0;
    let skipped = 0;
    const promises: Promise<void>[] = [];

    const parser = parse<Row, EditRow>({
      headers: (headers) =>
        headers.map((h) => h?.trim().toLowerCase().replace(/\s+/g, "")),
      ignoreEmpty: true,
    })
      .on("data", (row: EditRow) => {
        promises.push(
          editStudentByRow(row).then((ok) => {
            if (ok) updated++;
            else skipped++;
          }),
        );
      })
      .on("end", async () => {
        try {
          await Promise.all(promises);
          resolve({ updated, skipped });
        } catch (err) {
          reject(err);
        }
      })
      .on("error", (err) => reject(err));

    parser.write(csv);
    parser.end();
  });
}

async function editStudentByRow(row: EditRow): Promise<boolean> {
  if (!row.nowa) return false;

  const jid = normalizeJid(row.nowa);

  const student = await findITLGStudentByJid(jid);
  if (!student) return false;

  const isVerified =
    row.isverified === "1" ? true : row.isverified === "0" ? false : undefined;

  const nim = row.nim?.trim() || undefined;
  const nama = row.namalengkap?.trim() || undefined;

  try {
    await addITLGStudent(jid, isVerified, nama, nim);
    return true;
  } catch (err) {
    console.error(`[editstudent] Error updating ${jid}:`, err);
    return false;
  }
}
