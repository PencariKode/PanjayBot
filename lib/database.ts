import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { botConfig } from "../config.ts";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Singleton Prisma Client — hindari multiple instances saat hot-reload
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// ─── Premium User Helpers ───

export async function getPremiumUsers(): Promise<string[]> {
  const rows = await prisma.premiumUser.findMany({ select: { jid: true } });
  return rows.map((r: { jid: string }) => r.jid);
}

export async function isPremiumUser(jid: string): Promise<boolean> {
  const row = await prisma.premiumUser.findUnique({ where: { jid } });
  return row !== null;
}

export async function addPremiumUser(jid: string): Promise<void> {
  await prisma.premiumUser.upsert({
    where: { jid },
    update: {},
    create: { jid },
  });
}

export async function removePremiumUser(jid: string): Promise<void> {
  await prisma.premiumUser.deleteMany({ where: { jid } });
}

// ─── ITLG Students Helpers ───

export async function isITLGStudent(jid: string): Promise<boolean> {
  const row = await prisma.itlgStudent.findUnique({ where: { jid } });
  return row !== null;
}

export async function getITLGStudents(): Promise<string[]> {
  const rows = await prisma.itlgStudent.findMany({ select: { jid: true } });
  return rows.map((r: { jid: string }) => r.jid);
}

export async function addITLGStudent(jid: string, isRealNum: boolean, name: string, nim: string): Promise<void> {
  await prisma.itlgStudent.upsert({
    where: { jid },
    update: {isRealNum, name, nim},
    create: { jid, isRealNum, name, nim },
  });
}

export async function removeITLGStudent(jid: string): Promise<void> {
  await prisma.itlgStudent.deleteMany({ where: { jid } });
}


// ─── Creator Helpers ───

export async function getCreators(): Promise<string[]> {
  const rows = await prisma.creator.findMany({ select: { jid: true } });
  return rows.map((r: { jid: string }) => r.jid);
}

export async function isCreator(jid: string): Promise<boolean> {
  const row = await prisma.creator.findUnique({ where: { jid } });
  return row !== null;
}

export async function addCreator(jid: string): Promise<void> {
  await prisma.creator.upsert({
    where: { jid },
    update: {},
    create: { jid },
  });
}

export async function removeCreator(jid: string): Promise<void> {
  await prisma.creator.deleteMany({ where: { jid } });
}
