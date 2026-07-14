import type { PluginContext, PluginInfo } from "../../types.ts";
import type { proto } from "@whiskeysockets/baileys";
import { parse, Row } from "@fast-csv/parse";
import { addITLGStudent } from "../../lib/database.ts";
import {
  downloadDocumentAsString,
  extractFlag,
  isNowaCsv,
  normalizeJid,
} from "../../lib/utils.ts";

type StudentRow = {
  nowa: string;
  nim?: string;
  namalengkap?: string;
  isverified?: string;
};

export const info: PluginInfo = {
  name: "Add ITLG Students",
  menu: ["addstudent <nowa> [--nim <nim>] [--nama <nama>] [--verified <0|1>]"],
  case: [
    "addstudent",
    "tambahstudent",
    "additlgstudent",
    "csvstudent",
    "itlgcsv",
  ],
  description: "Menambahkan student ke dalam database",
  hidden: true,
  owner: true,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,
  itlg: true,
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
      const totalRows = await csvParser(csv);
      await PanjayReact("✅");
      return panjay.sendMessage(replyJid, {
        text: `Berhasil menambahkan *${totalRows}* mahasiswa dari file CSV`,
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
        "Gunakan format teks untuk menambah satu mahasiswa, atau kirim file CSV untuk tambah massal.",
      usage:
        `${command} <no telp> [--nim <nim>] [--nama <nama lengkap>] [--verified <0|1>]\n` +
        `atau kirimkan file CSV dengan header: nowa,nim,namalengkap,isverified`,
      example: `${command} 087869164526 --nim 241402034 --nama Panji Briant Depari --verified 1`,
    });
  }

  const isRawCsv = isNowaCsv(q);

  if (isRawCsv) {
    try {
      const totalRows = await csvParser(q.trim());
      await PanjayReact("✅");
      return panjay.sendMessage(replyJid, {
        text: `Berhasil menambahkan *${totalRows}* mahasiswa dari teks CSV`,
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

  try {
    await addStudentByNowa(nowa, isVerified, nama, nim);
    const changes: string[] = [`Nomor → *${nowa}*`];
    if (nim) changes.push(`NIM → *${nim}*`);
    if (nama) changes.push(`Nama → *${nama}*`);
    changes.push(`Verified → *${isVerified ? "Ya" : "Tidak"}*`);

    await PanjayReact("✅");
    return panjayreply(`Berhasil menambahkan mahasiswa:\n${changes.join("\n")}`);
  } catch (err) {
    await PanjayReact("err");
    return PanjayInvalid({
      title: "ERROR",
      message:
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menambahkan mahasiswa",
    });
  }
}


async function addStudentByNowa(
  nowa: string,
  isVerified?: boolean,
  nama?: string | null,
  nim?: string | null,
) {
  const jid = normalizeJid(nowa);
  await addITLGStudent(jid, isVerified, nama, nim);
}

async function csvParser(csv: string): Promise<number> {
  return new Promise((resolve, reject) => {
    let rowCount = 0;
    const promises: Promise<void>[] = [];

    const parser = parse<Row, StudentRow>({
      headers: (headers) =>
        headers.map((h) => h?.trim().toLowerCase().replace(/\s+/g, "")),
      ignoreEmpty: true,
    })
      .on("data", (row: StudentRow) => {
        promises.push(
          addStudentByRow(row).then(() => { rowCount++; }),
        );
      })
      .on("end", async () => {
        try {
          await Promise.all(promises);
          resolve(rowCount);
        } catch (err) {
          reject(err);
        }
      })
      .on("error", (err) => reject(err));

    parser.write(csv);
    parser.end();
  });
}

async function addStudentByRow(row: StudentRow) {
  if (!row.nowa) return;

  const jid = normalizeJid(row.nowa);
  const isVerified = row.isverified === "1" ? true : row.isverified === "0" ? false : undefined;
  const nim = row.nim?.trim() || undefined;
  const nama = row.namalengkap?.trim() || undefined;

  try {
    await addITLGStudent(jid, isVerified, nama, nim);
  } catch (error) {
    console.error(`[addstudent] Database Error for ${jid}:`, error);
  }
}
