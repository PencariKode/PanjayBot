import fs from "fs";
import { botConfig } from "../config.ts";

// ─── DataStore Interface ───

export interface DataStore {
  isPremiumUser(jid: string): Promise<boolean>;
  isCreator(jid: string): Promise<boolean>;
}

// ─── File-based DataStore (behaviour lama, baca dari JSON) ───

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function readStringArraySync(pathFile: string): string[] {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(pathFile, "utf8"));
    return isStringArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

class FileDataStore implements DataStore {
  async isPremiumUser(jid: string): Promise<boolean> {
    const users = readStringArraySync(botConfig.paths.premiumUsers);
    return users.includes(jid);
  }

  async isCreator(jid: string): Promise<boolean> {
    const creators = readStringArraySync(botConfig.paths.creators);
    return creators.includes(jid);
  }
}

// ─── Database DataStore (Prisma/PostgreSQL) ───

class DbDataStore implements DataStore {
  async isPremiumUser(jid: string): Promise<boolean> {
    const { isPremiumUser } = await import("./database.ts");
    return isPremiumUser(jid);
  }

  async isCreator(jid: string): Promise<boolean> {
    const { isCreator } = await import("./database.ts");
    return isCreator(jid);
  }
}

// ─── Factory ───

let _store: DataStore | undefined;

export function getDataStore(): DataStore {
  if (!_store) {
    _store =
      botConfig.database.sessionStore === "database"
        ? new DbDataStore()
        : new FileDataStore();
  }
  return _store;
}
