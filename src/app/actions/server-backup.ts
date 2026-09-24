'use server';

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '@/lib/jwt';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) return null;
  const payload = await verifyAdminToken(token);
  if (!payload || !['ADMIN', 'PROCTOR'].includes(payload.role)) return null;
  return payload;
}

export type BackupFileInfo = {
  filename: string;
  size: number;
  formattedSize: string;
  createdAt: string;
};

export type DatabaseStatusInfo = {
  dbSize: number;
  formattedDbSize: string;
  walSize: number;
  formattedWalSize: string;
  lastModified: string;
  backups: BackupFileInfo[];
};

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export async function getDatabaseBackupInfo(): Promise<DatabaseStatusInfo | null> {
  const user = await verifyAuth();
  if (!user) return null;

  const dbPath = path.join(process.cwd(), 'dev.db');
  const walPath = path.join(process.cwd(), 'dev.db-wal');
  const backupDir = path.join(process.cwd(), 'backups');

  let dbSize = 0;
  let lastModified = '-';
  if (fs.existsSync(dbPath)) {
    const stat = fs.statSync(dbPath);
    dbSize = stat.size;
    lastModified = new Date(stat.mtime).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  }

  let walSize = 0;
  if (fs.existsSync(walPath)) {
    const stat = fs.statSync(walPath);
    walSize = stat.size;
  }

  const backups: BackupFileInfo[] = [];
  if (fs.existsSync(backupDir)) {
    const files = fs.readdirSync(backupDir);
    for (const file of files) {
      if (file.endsWith('.db')) {
        const filePath = path.join(backupDir, file);
        const stat = fs.statSync(filePath);
        backups.push({
          filename: file,
          size: stat.size,
          formattedSize: formatBytes(stat.size),
          createdAt: new Date(stat.mtime).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
        });
      }
    }
  }

  // Urutkan backup terbaru di atas
  backups.sort((a, b) => b.filename.localeCompare(a.filename));

  return {
    dbSize,
    formattedDbSize: formatBytes(dbSize),
    walSize,
    formattedWalSize: formatBytes(walSize),
    lastModified,
    backups,
  };
}

export async function createLocalBackupSnapshot() {
  const user = await verifyAuth();
  if (!user) {
    return { success: false, message: 'Tidak memiliki izin akses' };
  }

  try {
    // Jalankan WAL checkpoint terlebih dahulu
    await prisma.$executeRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE)');

    const dbPath = path.join(process.cwd(), 'dev.db');
    if (!fs.existsSync(dbPath)) {
      return { success: false, message: 'File database tidak ditemukan' };
    }

    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const now = new Date();
    const wibDate = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${wibDate.getUTCFullYear()}${pad(wibDate.getUTCMonth() + 1)}${pad(wibDate.getUTCDate())}_${pad(wibDate.getUTCHours())}${pad(wibDate.getUTCMinutes())}${pad(wibDate.getUTCSeconds())}`;
    const filename = `UPIN_CBT_BACKUP_${timestamp}.db`;

    fs.copyFileSync(dbPath, path.join(backupDir, filename));

    await logAudit(user.nama, 'BACKUP', 'DATABASE', `Membuat snapshot database lokal: ${filename}`);
    revalidatePath('/admin/pengaturan');

    return { success: true, message: `Snapshot database berhasil disimpan: ${filename}`, filename };
  } catch (error: any) {
    console.error('Gagal membuat backup snapshot:', error);
    return { success: false, message: 'Gagal membuat backup: ' + error?.message };
  }
}

export async function deleteLocalBackupSnapshot(filename: string) {
  const user = await verifyAuth();
  if (!user || user.role !== 'ADMIN') {
    return { success: false, message: 'Hanya Administrator utama yang dapat menghapus file arsip backup' };
  }

  // Pencegahan directory traversal
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return { success: false, message: 'Nama file tidak valid' };
  }

  try {
    const filePath = path.join(process.cwd(), 'backups', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      await logAudit(user.nama, 'HAPUS', 'DATABASE_BACKUP', `Menghapus snapshot database: ${filename}`);
      revalidatePath('/admin/pengaturan');
      return { success: true, message: 'File snapshot berhasil dihapus' };
    }
    return { success: false, message: 'File tidak ditemukan' };
  } catch (error: any) {
    return { success: false, message: 'Gagal menghapus file: ' + error?.message };
  }
}
