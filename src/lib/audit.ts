import prisma from './prisma';

export async function logAudit(
  userNama: string,
  aksi: string,
  entitas: string,
  detail?: string
) {
  try {
    await prisma.auditLog.create({
      data: { userNama, aksi, entitas, detail }
    });
  } catch {
    // Never throw — logging should never break the main flow
  }
}
