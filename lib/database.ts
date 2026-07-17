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

export async function findITLGStudentByJid(jid: string){
  const row = await prisma.itlgStudent.findUnique({ where: { jid } });
  return row ?? null;
}
export async function findITLGStudentByNIM(nim: string){
  const rows = await prisma.itlgStudent.findMany({ where: { nim } });
  return rows ?? null;
}

export async function checkITLGVerification(jid: string): Promise<boolean|null> {
  const row = await prisma.itlgStudent.findUnique({ where: { jid } });
  return row?.isVerified ?? null;
}

export async function addITLGStudent(
  jid: string,
  isVerified?: boolean,
  name?: string | null,
  nim?: string | null,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const currentStudent = await tx.itlgStudent.findUnique({ where: { jid } });

    const targetNim = nim !== undefined ? nim : currentStudent?.nim;
    const targetVerified = isVerified !== undefined ? isVerified : (currentStudent?.isVerified ?? false);

    if (targetVerified && targetNim) {
      const existingVerified = await tx.itlgStudent.findFirst({
        where: {
          nim: targetNim,
          isVerified: true,
          NOT: { jid }, 
        },
      });

      if (existingVerified) throw new Error(`NIM ${targetNim} sudah digunakan oleh mahasiswa terverifikasi lain.`);
    }

    await tx.itlgStudent.upsert({
      where: { jid },
      update: {
        ...(isVerified !== undefined ? { isVerified } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(nim !== undefined ? { nim } : {}),
      },
      create: {
        jid,
        isVerified: isVerified ?? false,
        name: name ?? null,
        nim: nim ?? null,
      },
    });
  });
}

export async function removeITLGStudent(jid: string): Promise<void> {
  await prisma.itlgStudent.deleteMany({ where: { jid } });
}

// ─── ITLG Groups Helpers ───

export async function isITLGGroup(jid: string): Promise<boolean> {
  const row = await prisma.itlgGroup.findUnique({ where: { jid } });
  return row !== null;
}

export async function getITLGGroups(): Promise<string[]> {
  const rows = await prisma.itlgGroup.findMany({ select: { jid: true } });
  return rows.map((r: { jid: string }) => r.jid);
}

export async function addITLGGroup(jid: string): Promise<void> {
  await prisma.itlgGroup.upsert({
    where: { jid },
    update: {},
    create: { jid },
  });
}

export async function removeITLGGroup(jid: string): Promise<void> {
  await prisma.itlgGroup.deleteMany({ where: { jid } });
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
