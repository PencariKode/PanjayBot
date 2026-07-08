import fs from "fs";
import { botConfig } from "../config.ts";

// ─── DataStore Interface ───

export interface DataStore {
  isPremiumUser(jid: string): Promise<boolean>;
  isCreator(jid: string): Promise<boolean>;
  isITLGStudent(jid: string): Promise<boolean>;
  isITLGGroup(jid: string): Promise<boolean>;
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

  async isITLGStudent(jid: string): Promise<boolean> {
    const students = readStringArraySync(botConfig.paths.itlgStudents);
    return students.includes(jid);
  }

  async isITLGGroup(jid: string): Promise<boolean> {
    const groups = readStringArraySync(botConfig.paths.itlgGroups);
    return groups.includes(jid);
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

  async isITLGStudent(jid: string): Promise<boolean> {
    const { isITLGStudent } = await import("./database.ts");
    return isITLGStudent(jid);
  }

  async isITLGGroup(jid: string): Promise<boolean> {
    const { isITLGGroup } = await import("./database.ts");
    return isITLGGroup(jid);
  }
}

// ─── Factory ───

let _store: DataStore | undefined;

export function getDataStore(): DataStore {
  if (!_store) {
    _store =
      botConfig.database.dataStore === "database"
        ? new DbDataStore()
        : new FileDataStore();
  }
  return _store;
}
