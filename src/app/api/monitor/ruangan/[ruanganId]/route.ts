import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';
import { autoFinalizeExpiredSessions } from '@/app/actions/exam';

function normalizeStatus(dbStatus: string | null | undefined): string {
  if (!dbStatus) return 'BELUM MULAI';
  if (dbStatus === 'ONGOING') return 'MENGERJAKAN';
  if (dbStatus === 'FINISHED') return 'SELESAI';
  return dbStatus;
}

async function fetchRuanganData(ruanganId: number) {
  noStore();
  await autoFinalizeExpiredSessions();
  const now = new Date();

  const pengaturan = await prisma.pengaturan.findUnique({ where: { id: 1 } });

  const ruangan = await prisma.ruangan.findUnique({ where: { id: ruanganId } });
  if (!ruangan) return null;

  const semuaSiswa = await prisma.siswa.findMany({
    where: { ruanganId },
    include: { kelas: true },
    orderBy: { nama: 'asc' },
  });

  if (semuaSiswa.length === 0) return { pengaturan, ruangan, jadwals: [], peserta: [] };

  const kelasIds = Array.from(new Set(semuaSiswa.map((s) => s.kelasId)));

  const jadwals = await prisma.jadwalUjian.findMany({
    where: {
      waktuSelesai: { gte: now },
      waktuMulai: { lte: now },
      kelas: { some: { id: { in: kelasIds } } },
    },
    include: {
      bankSoal: {
        include: { mapel: true, _count: { select: { soals: true } } },
      },
      kelas: true,
    },
  });

  const jadwalIds = jadwals.map((j: any) => j.id);
  const siswaIds = semuaSiswa.map((s) => s.id);

  const sesiUjian = await prisma.sesiUjianSiswa.findMany({
    where: {
      jadwalId: { in: jadwalIds },
      siswaId: { in: siswaIds },
    },
    include: { _count: { select: { jawabans: true } } },
  });

  const totalSoalPerJadwal: Record<number, number> = {};
  for (const j of jadwals) {
    totalSoalPerJadwal[j.id] = (j.bankSoal as any)._count?.soals ?? 0;
  }

  const peserta = semuaSiswa.map((siswa: any) => {
    let jadwalSiswa = jadwals.find((j: any) =>
      j.kelas.some((k: any) => k.id === siswa.kelasId)
    );
    let sesi = sesiUjian.find((s: any) => s.siswaId === siswa.id);

    if (sesi) {
      jadwalSiswa = jadwals.find((j: any) => j.id === sesi!.jadwalId) || jadwalSiswa;
    }

    if (!jadwalSiswa) {
      return {
        siswaId: siswa.id,
        nis: siswa.nis,
        nama: siswa.nama,
        kelas: siswa.kelas.nama,
        mapel: 'TIDAK ADA UJIAN',
        jadwalId: null,
        sesiId: null,
        status: 'TIDAK AKTIF',
        pelanggaran: 0,
        nilaiAkhir: null,
        jumlahDijawab: 0,
        totalSoal: 0,
      };
    }

    const totalSoal = totalSoalPerJadwal[jadwalSiswa.id] ?? 0;
    const jumlahDijawab = sesi ? (sesi as any)._count?.jawabans ?? 0 : 0;

    return {
      siswaId: siswa.id,
      nis: siswa.nis,
      nama: siswa.nama,
      kelas: siswa.kelas.nama,
      mapel: (jadwalSiswa as any).bankSoal.mapel.nama,
      jadwalId: jadwalSiswa.id,
      sesiId: sesi ? sesi.id : null,
      status: normalizeStatus(sesi?.status),
      pelanggaran: sesi ? sesi.pelanggaran : 0,
      nilaiAkhir: sesi?.nilaiAkhir ?? null,
      jumlahDijawab,
      totalSoal,
    };
  });

  return { pengaturan, ruangan, jadwals, peserta };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ruanganId: string }> }
) {
  const resolvedParams = await params;
  const ruanganId = parseInt(resolvedParams.ruanganId);

  if (isNaN(ruanganId)) {
    return new Response('Invalid ruanganId', { status: 400 });
  }

  // Verifikasi autentikasi — hanya proktor/guru/admin yang sudah login
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin_token')?.value;
  if (!adminToken) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  let isClosed = false;
  let intervalHandle: ReturnType<typeof setInterval> | null = null;
  let autoCloseTimer: ReturnType<typeof setTimeout> | null = null;

  // Auto-close SSE after 4 minutes to prevent Cloudflare Tunnel stream exhaustion.
  // Client will receive a "reconnect" event and seamlessly reconnect.
  const SSE_MAX_LIFETIME_MS = 4 * 60 * 1000;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown, event?: string) => {
        if (isClosed) return;
        try {
          let payload = '';
          if (event) payload += `event: ${event}\n`;
          payload += `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          isClosed = true;
        }
      };

      // Initial push
      const initial = await fetchRuanganData(ruanganId);
      if (initial) send(initial);

      intervalHandle = setInterval(async () => {
        if (isClosed) {
          if (intervalHandle) clearInterval(intervalHandle);
          return;
        }
        const fresh = await fetchRuanganData(ruanganId);
        if (fresh) send(fresh);
      }, 4000);

      // Schedule auto-close to recycle the stream
      autoCloseTimer = setTimeout(() => {
        if (!isClosed) {
          send({ reason: 'recycle' }, 'reconnect');
          isClosed = true;
          if (intervalHandle) clearInterval(intervalHandle);
          try { controller.close(); } catch { /* already closed */ }
        }
      }, SSE_MAX_LIFETIME_MS);
    },
    cancel() {
      isClosed = true;
      if (intervalHandle) clearInterval(intervalHandle);
      if (autoCloseTimer) clearTimeout(autoCloseTimer);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
