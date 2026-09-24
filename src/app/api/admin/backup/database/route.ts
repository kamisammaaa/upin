import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminToken } from '@/lib/jwt';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.cookies.get('admin_token')?.value;
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized: Harap login terlebih dahulu' }, { status: 401 });
    }

    const payload = await verifyAdminToken(adminToken);
    if (!payload || !['ADMIN', 'PROCTOR'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden: Hanya Admin atau Proktor yang dapat mencadangkan database' }, { status: 403 });
    }

    // Jika ada param filename untuk mengunduh snapshot spesifik dari folder backups/
    const targetSnapshot = request.nextUrl.searchParams.get('filename');
    if (targetSnapshot) {
      if (targetSnapshot.includes('..') || targetSnapshot.includes('/') || targetSnapshot.includes('\\')) {
        return NextResponse.json({ error: 'Nama file tidak valid' }, { status: 400 });
      }
      const snapshotPath = path.join(process.cwd(), 'backups', targetSnapshot);
      if (!fs.existsSync(snapshotPath)) {
        return NextResponse.json({ error: 'File cadangan tidak ditemukan di server' }, { status: 404 });
      }
      const fileBuffer = fs.readFileSync(snapshotPath);
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/x-sqlite3',
          'Content-Disposition': `attachment; filename="${targetSnapshot}"`,
          'Content-Length': fileBuffer.length.toString(),
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    // 1. Jalankan WAL checkpoint agar seluruh transaksi di dev.db-wal tersinkronisasi ke dev.db
    try {
      await prisma.$executeRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE)');
    } catch (err) {
      console.warn('Peringatan saat checkpoint WAL:', err);
    }

    const dbPath = path.join(process.cwd(), 'dev.db');
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: 'Database dev.db tidak ditemukan' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(dbPath);

    // Format waktu lokal Indonesia (WIB)
    const now = new Date();
    const wibDate = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${wibDate.getUTCFullYear()}${pad(wibDate.getUTCMonth() + 1)}${pad(wibDate.getUTCDate())}_${pad(wibDate.getUTCHours())}${pad(wibDate.getUTCMinutes())}${pad(wibDate.getUTCSeconds())}`;
    const filename = `UPIN_CBT_BACKUP_${timestamp}.db`;

    // Jika diminta simpan arsip lokal di server juga
    const saveLocal = request.nextUrl.searchParams.get('saveLocal') === 'true';
    if (saveLocal) {
      const backupDir = path.join(process.cwd(), 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      fs.writeFileSync(path.join(backupDir, filename), fileBuffer);
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-sqlite3',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Gagal mencadangkan database:', error);
    return NextResponse.json({ error: 'Gagal membuat file cadangan database: ' + error?.message }, { status: 500 });
  }
}
