import type {
  AuthenticationCreds,
  AuthenticationState,
  SignalDataTypeMap,
  SignalDataSet,
} from "@whiskeysockets/baileys";
import { proto } from "@whiskeysockets/baileys";
import { prisma } from "./database.ts";

// ─── BufferJSON ───
// Baileys menyimpan data sesi sebagai JSON yang mengandung Buffer objects.
// Kita perlu replacer/reviver untuk serialize/deserialize Buffer.

const BufferJSON = {
  replacer(_key: string, value: unknown): unknown {
    if (
      value !== null &&
      typeof value === "object" &&
      "type" in (value as Record<string, unknown>) &&
      (value as Record<string, unknown>).type === "Buffer" &&
      "data" in (value as Record<string, unknown>)
    ) {
      return {
        type: "Buffer",
        data: Buffer.from(
          (value as { data: number[] }).data,
        ).toString("base64"),
      };
    }
    return value;
  },

  reviver(_key: string, value: unknown): unknown {
    if (
      value !== null &&
      typeof value === "object" &&
      "type" in (value as Record<string, unknown>) &&
      (value as Record<string, unknown>).type === "Buffer" &&
      "data" in (value as Record<string, unknown>)
    ) {
      return Buffer.from(
        (value as { data: string }).data,
        "base64",
      );
    }
    return value;
  },
};

// ─── initAuthCreds ───
// Re-export dari Baileys internal. Karena tidak di-export langsung,
// kita import dari path internal.

async function loadInitAuthCreds(): Promise<() => AuthenticationCreds> {
  const mod = await import(
    "@whiskeysockets/baileys/lib/Utils/auth-utils.js"
  ) as { initAuthCreds: () => AuthenticationCreds };
  return mod.initAuthCreds;
}

// ─── DB Operations ───

async function writeData(id: string, data: unknown): Promise<void> {
  const jsonStr = JSON.stringify(data, BufferJSON.replacer);
  await prisma.session.upsert({
    where: { id },
    update: { data: jsonStr },
    create: { id, data: jsonStr },
  });
}

async function readData(id: string): Promise<unknown> {
  const row = await prisma.session.findUnique({ where: { id } });
  if (!row) return null;
  return JSON.parse(row.data, BufferJSON.reviver) as unknown;
}

async function removeData(id: string): Promise<void> {
  await prisma.session.deleteMany({ where: { id } });
}

// ─── Main Export ───

export async function usePostgresAuthState(): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}> {
  const initAuthCreds = await loadInitAuthCreds();

  const credsData = await readData("creds.json");
  const creds: AuthenticationCreds = (credsData as AuthenticationCreds | null) ?? initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async <T extends keyof SignalDataTypeMap>(
          type: T,
          ids: string[],
        ): Promise<Record<string, SignalDataTypeMap[T]>> => {
          const data: Record<string, SignalDataTypeMap[T]> = {};

          await Promise.all(
            ids.map(async (id) => {
              let value = (await readData(`${type}-${id}.json`)) as
                | SignalDataTypeMap[T]
                | null;

              if (type === "app-state-sync-key" && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(
                  value as Record<string, unknown>,
                ) as unknown as SignalDataTypeMap[T];
              }

              if (value) {
                data[id] = value;
              }
            }),
          );

          return data;
        },

        set: async (data: SignalDataSet): Promise<void> => {
          const tasks: Promise<void>[] = [];

          for (const category in data) {
            const categoryKey = category as keyof SignalDataSet;
            const entries = data[categoryKey];
            if (!entries) continue;

            for (const id in entries) {
              const value = entries[id];
              const file = `${category}-${id}.json`;
              tasks.push(
                value !== null && value !== undefined
                  ? writeData(file, value)
                  : removeData(file),
              );
            }
          }

          await Promise.all(tasks);
        },
      },
    },
    saveCreds: async () => {
      await writeData("creds.json", creds);
    },
  };
}
