import type { PluginContext, PluginInfo } from "../../types.ts";
import type { proto } from "@whiskeysockets/baileys";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import { parse, Row } from "@fast-csv/parse";
import { addITLGStudent } from "../../lib/database.ts";

type StudentRow = {
  isverified: "0" | "1";
  nowa: string;
  nim: string;
  namalengkap: string;
};

export const info: PluginInfo = {
  name: "Add ITLG Students",
  menu: ["addstudent"],
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
      const csv = await downloadCSVToString(docMess);
      const totalRows = await csvParser(csv);
      await PanjayReact("✅");
      return panjay.sendMessage(replyJid, {
        text: `Berhasil menambahkan ${totalRows} mahasiswa dari file CSV`,
      });
    } catch {
      await PanjayReact("err");
      return PanjayInvalid({
        title: "ERROR",
        message: "Terjadi kesalahan saat memproses file CSV",
      });
    }
  }

  if (!q.trim() || args.length < 2) {
    await PanjayReact("err");
    return PanjayInvalid({
      title: "NO INPUT",
      message:
        "Silakan input sesuai format atau kirimkan teks/file CSV sambil menggunakan command",
      usage: `${command} <status> <no telp> [nim] [nama lengkap]`,
      example: `${command} 1 087869164526 241402034 Panji Briant Depari`,
    });
  }

  const isRawCsv =
    /(?=[^]*\bisverified\b)(?=[^]*\bnowa\b)(?=[^]*\bnim\b)(?=[^]*\bnamalengkap\b)[a-z]+(,[a-z]+){3}/.test(
      q.toLowerCase(),
    );

  try {
    const totalRows = isRawCsv
      ? await csvParser(q.trim())
      : (await addStudentByText(args), 1);
    await PanjayReact("✅");
    return panjay.sendMessage(replyJid, {
      text: `Berhasil menambahkan ${totalRows} mahasiswa dari ${isRawCsv ? "file CSV" : "teks"}`,
    });
  } catch (error) {
    await PanjayReact("err");
    return PanjayInvalid({
      title: "ERROR",
      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menambahkan mahasiswa",
    });
  }
}

async function addStudentByText(args: string[]) {
  if (isNaN(Number(args[0]))) throw new Error("Invalid status");

  const [isverified, nowa, nim, ...namaArr] = args;
  await addStudentByRow({
    isverified: isverified as "0" | "1",
    nowa: nowa as string,
    nim: nim as string,
    namalengkap: namaArr.join(" "),
  });
}

async function downloadCSVToString(docMess: proto.Message.IDocumentMessage) {
  const stream = await downloadContentFromMessage(docMess, "document");
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}

async function csvParser(csv: string): Promise<number> {
  return new Promise((resolve, reject) => {
    let rowCount = 0;
    const parser = parse<Row, StudentRow>({
      headers: (headers) =>
        headers.map((h) => h?.trim().toLowerCase().replace(/\s+/g, "")),
      ignoreEmpty: true,
    })
      .on("data", (row) => {
        rowCount++;
        addStudentByRow(row);
      })
      .on("end", () => resolve(rowCount))
      .on("error", (err) => reject(err));

    parser.write(csv);
    parser.end();
  });
}

async function addStudentByRow(row: StudentRow) {
  let jid = row.nowa.replace(/[+ -]/g, "");
  if (jid.startsWith("08")) jid = "62" + jid.substring(1);
  if (!jid.endsWith("@s.whatsapp.net")) jid += "@s.whatsapp.net";

  try {
    await addITLGStudent(jid, row.isverified === "1", row.namalengkap, row.nim);
  } catch (error) {
    console.error("Database Error:", error);
  }
}
