import prisma from '../src/lib/prisma';
import { saveAnswer, submitExam } from '../src/app/actions/exam';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculatePercentile(sortedArr: number[], p: number) {
  if (sortedArr.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sortedArr.length) - 1;
  return sortedArr[Math.max(0, Math.min(idx, sortedArr.length - 1))];
}

async function runLoadTest(studentCount: number = 35) {
  console.log('='.repeat(65));
  console.log(`🚀 MEMULAI SIMULASI UJI BEBAN CBT (${studentCount} SISWA VIRTUAL)`);
  console.log('='.repeat(65));

  // 1. Ambil bank soal yang memiliki soal
  const bankSoal = await prisma.bankSoal.findFirst({
    where: { soals: { some: {} } },
    include: {
      soals: {
        orderBy: { id: 'asc' },
        take: 40 // Ambil maksimal 40 butir soal
      }
    }
  });

  if (!bankSoal || bankSoal.soals.length === 0) {
    console.error('❌ Tidak ada bank soal yang memiliki butir soal.');
    process.exit(1);
  }

  const totalSoal = bankSoal.soals.length;
  console.log(`📚 Menggunakan Bank Soal: "${bankSoal.judul}" (${totalSoal} Butir Soal)`);

  // 2. Ambil siswa untuk pengujian
  const siswas = await prisma.siswa.findMany({
    take: studentCount,
    orderBy: { id: 'asc' }
  });

  if (siswas.length < studentCount) {
    console.warn(`⚠️ Jumlah siswa di database hanya ${siswas.length}, menyesuaikan pengujian ke ${siswas.length} siswa.`);
    studentCount = siswas.length;
  }

  // 3. Buat Jadwal Ujian Sementara terisolasi untuk tes
  const now = new Date();
  const testJadwal = await prisma.jadwalUjian.create({
    data: {
      nama: `[BENCHMARK] Simulasi ${studentCount} Siswa - ${Date.now()}`,
      bankSoalId: bankSoal.id,
      waktuMulai: new Date(now.getTime() - 60000),
      waktuSelesai: new Date(now.getTime() + 3600000),
    }
  });

  console.log(`📋 Jadwal Uji Coba Dibuat: ID #${testJadwal.id} ("${testJadwal.nama}")`);
  console.log(`⚡ Memulai simulasi pengerjaan serentak... Harap tunggu.\n`);

  const latencies: number[] = [];
  let totalSaveOperations = 0;
  let successCount = 0;
  let failureCount = 0;
  const startTime = Date.now();

  // 4. Jalankan simulasi siswa paralel
  const studentWorkers = siswas.map(async (siswa, sIdx) => {
    try {
      // Siswa membuat/membuka sesi
      const sesi = await prisma.sesiUjianSiswa.create({
        data: {
          siswaId: siswa.id,
          jadwalId: testJadwal.id,
          status: 'ONGOING',
          waktuMulai: new Date(),
        }
      });

      // Jeda acak antar siswa untuk simulasi staggered login realistis (0 - 300ms)
      await sleep(Math.floor(Math.random() * 300));

      // Siswa menjawab seluruh soal
      for (const soal of bankSoal.soals) {
        let opsiList: string[] = ['A', 'B', 'C', 'D'];
        try {
          const parsed = JSON.parse(soal.opsi);
          if (Array.isArray(parsed) && parsed.length > 0) opsiList = parsed;
        } catch {}

        const randomOpsi = opsiList[Math.floor(Math.random() * opsiList.length)];

        // Jeda pengerjaan antar soal (simulasi jeda berfikir/mengklik 30ms - 150ms)
        await sleep(30 + Math.floor(Math.random() * 120));

        const opStart = performance.now();
        const res = await saveAnswer(sesi.id, soal.id, randomOpsi);
        const opTime = performance.now() - opStart;

        latencies.push(opTime);
        totalSaveOperations++;

        if (res.success) {
          successCount++;
        } else {
          failureCount++;
        }
      }

      // Siswa submit ujian
      await submitExam(sesi.id);
    } catch (err: any) {
      failureCount++;
      console.error(`Error pada siswa #${siswa.id}:`, err?.message);
    }
  });

  await Promise.all(studentWorkers);

  const totalDurationMs = Date.now() - startTime;
  const totalDurationSec = (totalDurationMs / 1000).toFixed(2);

  latencies.sort((a, b) => a - b);
  const avgLatency = (latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1)).toFixed(2);
  const minLatency = (latencies[0] || 0).toFixed(2);
  const p50Latency = calculatePercentile(latencies, 50).toFixed(2);
  const p95Latency = calculatePercentile(latencies, 95).toFixed(2);
  const p99Latency = calculatePercentile(latencies, 99).toFixed(2);
  const maxLatency = (latencies[latencies.length - 1] || 0).toFixed(2);
  const opsPerSec = (totalSaveOperations / (totalDurationMs / 1000)).toFixed(1);
  const successRate = ((successCount / (totalSaveOperations || 1)) * 100).toFixed(2);

  // 5. Bersihkan data pengujian
  console.log(`\n🧹 Membersihkan data sesi dan jadwal uji coba...`);
  await prisma.sesiUjianSiswa.deleteMany({ where: { jadwalId: testJadwal.id } });
  await prisma.jadwalUjian.delete({ where: { id: testJadwal.id } });
  console.log(`✅ Database produksi bersih kembali 100%.\n`);

  // 6. Cetak Laporan Hasil
  console.log('='.repeat(65));
  console.log('📊 HASIL UJI BEBAN CBT (STRESS TEST REPORT)');
  console.log('='.repeat(65));
  console.log(`👥 Jumlah Siswa Simultan   : ${studentCount} Siswa Virtual`);
  console.log(`📝 Total Butir Soal       : ${totalSoal} Soal per Siswa`);
  console.log(`💾 Total Transaksi Simpan : ${totalSaveOperations.toLocaleString('id-ID')} Operasi`);
  console.log(`⏱️  Total Waktu Pengujian   : ${totalDurationSec} detik`);
  console.log(`⚡ Kecepatan (Throughput) : ${opsPerSec} Transaksi / Detik (TPS)`);
  console.log(`🎯 Tingkat Keberhasilan   : ${successRate}% (${successCount} Sukses, ${failureCount} Gagal)`);
  console.log('-'.repeat(65));
  console.log('⏱️  DISTRIBUSI WAKTU RESPONS (LATENCY):');
  console.log(`   • Minimum Latency     : ${minLatency} ms`);
  console.log(`   • Rata-rata (Avg)     : ${avgLatency} ms`);
  console.log(`   • Median (P50)        : ${p50Latency} ms`);
  console.log(`   • 95th Percentile(P95): ${p95Latency} ms`);
  console.log(`   • 99th Percentile(P99): ${p99Latency} ms`);
  console.log(`   • Maksimum Latency    : ${maxLatency} ms`);
  console.log('='.repeat(65));

  if (failureCount === 0 && Number(avgLatency) < 100) {
    console.log('🎉 KESIMPULAN: SERVER SANGAT STABIL & SUPER CEPAT! SIAP UJIAN 100%!');
  } else if (failureCount === 0) {
    console.log('✅ KESIMPULAN: SERVER STABIL TANPA ERROR KUNCI DATABASE.');
  } else {
    console.log('⚠️ PERHATIAN: Terdapat transaksi yang gagal, perlu optimasi lanjutan.');
  }
  console.log('='.repeat(65));

  await prisma.$disconnect();
}

const args = process.argv.slice(2);
const students = args[0] ? parseInt(args[0], 10) : 35;
runLoadTest(students).catch(err => {
  console.error('Fatal benchmark error:', err);
  process.exit(1);
});
