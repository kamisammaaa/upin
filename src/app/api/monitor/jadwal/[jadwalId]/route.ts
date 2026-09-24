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

async function fetchMonitorData(jadwalId: number) {
  noStore();
  await autoFinalizeExpiredSessions(jadwalId);
  const jadwal = await prisma.jadwalUjian.findUnique({
    where: { id: jadwalId },
    include: {
      bankSoal: { include: { mapel: true, _count: { select: { soals: true } } } },
      kelas: true,
      siswaKhusus: { include: { kelas: true } },
    },
  });

  if (!jadwal) return null;

  let semuaSiswa: any[] = [];
  if (jadwal.tipeUjian === 'SUSULAN' && jadwal.siswaKhusus && jadwal.siswaKhusus.length > 0) {
    semuaSiswa = [...jadwal.siswaKhusus].sort((a, b) => a.nama.localeCompare(b.nama));
  } else {
    const kelasIds = jadwal.kelas.map((k: any) => k.id);
    semuaSiswa = await prisma.siswa.findMany({
      where: { kelasId: { in: kelasIds } },
      include: { kelas: true },
      orderBy: { nama: 'asc' },
    });
  }

  const sesiUjian = await prisma.sesiUjianSiswa.findMany({
    where: { jadwalId },
    include: { 
      siswa: true,
      _count: { select: { jawabans: true } }
    },
  });

  const totalSoal = jadwal.bankSoal._count?.soals ?? 0;

  const peserta = semuaSiswa.map((siswa) => {
    const sesi = sesiUjian.find((s) => s.siswaId === siswa.id);
    return {
      siswaId: siswa.id,
      nis: siswa.nis,
      nama: siswa.nama,
      kelas: siswa.kelas.nama,
      status: normalizeStatus(sesi?.status),
      pelanggaran: sesi ? sesi.pelanggaran : 0,
      waktuMulai: sesi?.waktuMulai ?? null,
      waktuSelesai: sesi?.waktuSelesai ?? null,
      nilaiAkhir: sesi?.nilaiAkhir ?? null,
      sesiId: sesi?.id || null,
      jumlahDijawab: sesi ? (sesi as any)._count?.jawabans ?? 0 : 0,
      totalSoal: totalSoal
    };
  });

  return { jadwal, peserta };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jadwalId: string }> }
) {
  const resolvedParams = await params;
  const jadwalId = parseInt(resolvedParams.jadwalId);

  if (isNaN(jadwalId)) {
    return new Response('Invalid jadwalId', { status: 400 });
  }

  // Verifikasi autentikasi — hanya admin/guru yang sudah login
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
      const initial = await fetchMonitorData(jadwalId);
      if (initial) send(initial);

      // Poll every 5 seconds and push only live data
      intervalHandle = setInterval(async () => {
        if (isClosed) {
          if (intervalHandle) clearInterval(intervalHandle);
          return;
        }
        const fresh = await fetchMonitorData(jadwalId);
        if (fresh) send(fresh);
      }, 5000);

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
