import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./dev.db' })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('\n========================================')
  console.log('  MEMULAI RESET & SEEDING DATABASE...')
  console.log('========================================\n')

  // ── HAPUS SEMUA DATA LAMA (urutan penting: hapus relasi dulu) ──
  await prisma.jawabanSiswa.deleteMany({})
  await prisma.sesiUjianSiswa.deleteMany({})
  await prisma.soal.deleteMany({})
  await prisma.jadwalUjian.deleteMany({})
  await prisma.bankSoal.deleteMany({})
  await prisma.siswa.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.kelas.deleteMany({})
  await prisma.mataPelajaran.deleteMany({})
  await prisma.ruangan.deleteMany({})
  await prisma.jurusan.deleteMany({})
  await prisma.tingkat.deleteMany({})
  console.log('✓ Semua data lama telah dihapus.\n')

  // ── 1. TINGKAT ──
  const tX   = await prisma.tingkat.create({ data: { level: 'X' } })
  const tXI  = await prisma.tingkat.create({ data: { level: 'XI' } })
  const tXII = await prisma.tingkat.create({ data: { level: 'XII' } })
  console.log('✓ Tingkat: X, XI, XII')

  // ── 2. JURUSAN ──
  const jTO   = await prisma.jurusan.create({ data: { kode: 'TO',   nama: 'Teknik Otomotif' } })
  const jTJKT = await prisma.jurusan.create({ data: { kode: 'TJKT', nama: 'Teknik Jaringan Komputer dan Telekomunikasi' } })
  const jTAV  = await prisma.jurusan.create({ data: { kode: 'TAV',  nama: 'Teknik Audio Video' } })
  console.log('✓ Jurusan: TO, TJKT, TAV')

  // ── 3. KELAS ──
  const kelasTO1    = await prisma.kelas.create({ data: { nama: 'X TO1',       tingkatId: tX.id,   jurusans: { connect: [{ id: jTO.id }] } } })
  const kelasTO2    = await prisma.kelas.create({ data: { nama: 'X TO2/TJKT1', tingkatId: tX.id,   jurusans: { connect: [{ id: jTO.id }, { id: jTJKT.id }] } } })
  const kelasTJKT2  = await prisma.kelas.create({ data: { nama: 'X TJKT2/TAV', tingkatId: tX.id,   jurusans: { connect: [{ id: jTJKT.id }, { id: jTAV.id }] } } })
  await prisma.kelas.create({ data: { nama: 'XI TO1',      tingkatId: tXI.id,  jurusans: { connect: [{ id: jTO.id }] } } })
  await prisma.kelas.create({ data: { nama: 'XI TO2',      tingkatId: tXI.id,  jurusans: { connect: [{ id: jTO.id }] } } })
  await prisma.kelas.create({ data: { nama: 'XI TJKT1',    tingkatId: tXI.id,  jurusans: { connect: [{ id: jTJKT.id }] } } })
  await prisma.kelas.create({ data: { nama: 'XI TJKT2',    tingkatId: tXI.id,  jurusans: { connect: [{ id: jTJKT.id }] } } })
  await prisma.kelas.create({ data: { nama: 'XI TAV',      tingkatId: tXI.id,  jurusans: { connect: [{ id: jTAV.id }] } } })
  await prisma.kelas.create({ data: { nama: 'XII TO1',     tingkatId: tXII.id, jurusans: { connect: [{ id: jTO.id }] } } })
  await prisma.kelas.create({ data: { nama: 'XII TJKT1',   tingkatId: tXII.id, jurusans: { connect: [{ id: jTJKT.id }] } } })
  await prisma.kelas.create({ data: { nama: 'XII TAV',     tingkatId: tXII.id, jurusans: { connect: [{ id: jTAV.id }] } } })
  console.log('✓ Kelas: X TO1, X TO2/TJKT1, X TJKT2/TAV, + kelas lainnya')

  // ── 4. RUANGAN (hanya 4 untuk simulasi) ──
  const ruang1 = await prisma.ruangan.create({ data: { nama: 'Ruang 1', kapasitas: 40, token: 'ABJK12' } })
  const ruang2 = await prisma.ruangan.create({ data: { nama: 'Ruang 2', kapasitas: 40, token: 'CDMN34' } })
  const ruang3 = await prisma.ruangan.create({ data: { nama: 'Ruang 3', kapasitas: 40, token: 'EFOP56' } })
  const ruang4 = await prisma.ruangan.create({ data: { nama: 'Ruang 4', kapasitas: 40, token: 'GHQR78' } })
  console.log('✓ Ruangan: 4 ruangan (token unik per ruang)')

  // ── 5. MATA PELAJARAN ──
  const mapelIPA = await prisma.mataPelajaran.create({ data: { nama: 'Ilmu Pengetahuan Alam (IPA)' } })
  await prisma.mataPelajaran.create({ data: { nama: 'Matematika' } })
  await prisma.mataPelajaran.create({ data: { nama: 'Bahasa Indonesia' } })
  console.log('✓ Mapel: IPA, Matematika, Bahasa Indonesia')

  // ── 6. USERS (Admin, Guru, Proktor) ──
  await prisma.user.create({ data: { username: 'admin',    password: 'smkba2024', nama: 'Administrator',        role: 'ADMIN'   } })
  await prisma.user.create({ data: { username: 'kami',     password: 'Ganteng8',  nama: 'Administrator Utama',  role: 'ADMIN'   } })
  const guruA = await prisma.user.create({ data: { username: 'bu.ipa.a', password: 'smkba2024', nama: 'Bu Sari (Guru IPA A)', role: 'GURU'    } })
  const guruB = await prisma.user.create({ data: { username: 'bu.ipa.b', password: 'smkba2024', nama: 'Bu Dewi (Guru IPA B)', role: 'GURU'    } })
  await prisma.user.create({ data: { username: 'pak.proktor', password: 'smkba2024', nama: 'Pak Andi (Proktor)',   role: 'PROCTOR' } })
  console.log('✓ User berhasil dibuat (Admin: admin & kami / Ganteng8)')

  // ── 6.5 PENGATURAN ──
  await prisma.pengaturan.upsert({
    where: { id: 1 },
    update: {
      namaSekolah: 'SMK Banjar Asri',
      namaSistem: 'PintarCBT',
      tahunAjaran: '2024/2025',
      semester: 'Ganjil'
    },
    create: {
      id: 1,
      namaSekolah: 'SMK Banjar Asri',
      namaSistem: 'PintarCBT',
      tahunAjaran: '2024/2025',
      semester: 'Ganjil'
    }
  })
  console.log('✓ Pengaturan Sekolah awal berhasil dikonfigurasi')

  // ── 7. SISWA (12 siswa tersebar di 4 ruangan) ──
  //  Pola NIS: 1001-1004 = X TO1, 2001-2004 = X TO2, 3001-3004 = X TJKT2
  //  Password semua siswa: siswa2024
  const siswas = [
    // X TO1 → Ruang 1 (2 siswa) & Ruang 2 (2 siswa)
    { nis: '1001', nama: 'Agus (X TO1)',    kelasId: kelasTO1.id,   ruanganId: ruang1.id },
    { nis: '1002', nama: 'Budi (X TO1)',    kelasId: kelasTO1.id,   ruanganId: ruang1.id },
    { nis: '1003', nama: 'Citra (X TO1)',   kelasId: kelasTO1.id,   ruanganId: ruang2.id },
    { nis: '1004', nama: 'Dani (X TO1)',    kelasId: kelasTO1.id,   ruanganId: ruang2.id },
    // X TO2/TJKT1 → Ruang 2 (2 siswa) & Ruang 3 (2 siswa)
    { nis: '2001', nama: 'Eko (X TO2)',     kelasId: kelasTO2.id,   ruanganId: ruang2.id },
    { nis: '2002', nama: 'Fitri (X TO2)',   kelasId: kelasTO2.id,   ruanganId: ruang2.id },
    { nis: '2003', nama: 'Gita (X TO2)',    kelasId: kelasTO2.id,   ruanganId: ruang3.id },
    { nis: '2004', nama: 'Hadi (X TO2)',    kelasId: kelasTO2.id,   ruanganId: ruang3.id },
    // X TJKT2/TAV → Ruang 3 (2 siswa) & Ruang 4 (2 siswa)
    { nis: '3001', nama: 'Indra (X TJKT2)', kelasId: kelasTJKT2.id, ruanganId: ruang3.id },
    { nis: '3002', nama: 'Joko (X TJKT2)',  kelasId: kelasTJKT2.id, ruanganId: ruang3.id },
    { nis: '3003', nama: 'Kartika (X TJKT2)', kelasId: kelasTJKT2.id, ruanganId: ruang4.id },
    { nis: '3004', nama: 'Lukman (X TJKT2)', kelasId: kelasTJKT2.id, ruanganId: ruang4.id },
  ]
  for (const s of siswas) {
    await prisma.siswa.create({ data: { ...s, password: 'siswa2024' } })
  }
  console.log('✓ 12 Siswa berhasil dibuat (semua password: siswa2024)')

  // ── 8. BANK SOAL & JADWAL UJIAN (Sedang Aktif) ──
  const besok = new Date()
  besok.setDate(besok.getDate() + 1)

  // Guru A → Kelas X TO1 + X TO2/TJKT1
  const bankA = await prisma.bankSoal.create({
    data: {
      judul: 'UAS IPA Semester Ganjil (Kelas TO)',
      mapelId: mapelIPA.id,
      guruId: guruA.id,
      soals: {
        create: [
          { pertanyaan: 'Air mendidih pada suhu berapa derajat Celsius?', opsi: JSON.stringify(['50°C', '80°C', '100°C', '120°C']), kunciJawaban: 'C', bobot: 1 },
          { pertanyaan: 'Rumus kimia air adalah...', opsi: JSON.stringify(['CO2', 'H2O', 'O2', 'NaCl']), kunciJawaban: 'B', bobot: 1 },
          { pertanyaan: 'Planet terbesar di tata surya adalah...', opsi: JSON.stringify(['Saturnus', 'Bumi', 'Jupiter', 'Mars']), kunciJawaban: 'C', bobot: 1 },
        ]
      }
    }
  })

  await prisma.jadwalUjian.create({
    data: {
      nama: 'UAS IPA - Kelas TO (Bu Sari)',
      bankSoalId: bankA.id,
      waktuMulai: new Date(),
      waktuSelesai: besok,
      kelas: { connect: [{ id: kelasTO1.id }, { id: kelasTO2.id }] }
    }
  })

  // Guru B → Kelas X TJKT2/TAV
  const bankB = await prisma.bankSoal.create({
    data: {
      judul: 'UAS IPA Semester Ganjil (Kelas TJKT)',
      mapelId: mapelIPA.id,
      guruId: guruB.id,
      soals: {
        create: [
          { pertanyaan: 'Satuan kecepatan dalam SI adalah...', opsi: JSON.stringify(['km/jam', 'm/s', 'cm/s', 'knot']), kunciJawaban: 'B', bobot: 1 },
          { pertanyaan: 'Gaya gravitasi bumi adalah sekitar...', opsi: JSON.stringify(['5 m/s²', '8 m/s²', '10 m/s²', '12 m/s²']), kunciJawaban: 'C', bobot: 1 },
          { pertanyaan: 'Energi yang tersimpan dalam makanan disebut...', opsi: JSON.stringify(['Energi Kinetik', 'Energi Potensial', 'Energi Kimia', 'Energi Mekanik']), kunciJawaban: 'C', bobot: 1 },
        ]
      }
    }
  })

  await prisma.jadwalUjian.create({
    data: {
      nama: 'UAS IPA - Kelas TJKT (Bu Dewi)',
      bankSoalId: bankB.id,
      waktuMulai: new Date(),
      waktuSelesai: besok,
      kelas: { connect: [{ id: kelasTJKT2.id }] }
    }
  })

  console.log('✓ Bank Soal & Jadwal Ujian aktif berhasil dibuat.\n')

  // ── RINGKASAN ──
  console.log('========================================')
  console.log('   DATA SIAP DIGUNAKAN - RINGKASAN')
  console.log('========================================')
  console.log('\n📌 AKUN ADMIN / GURU / PROKTOR')
  console.log('   Semua password : smkba2024')
  console.log('   Admin          : admin')
  console.log('   Guru IPA A     : bu.ipa.a')
  console.log('   Guru IPA B     : bu.ipa.b')
  console.log('   Proktor        : pak.proktor')
  console.log('\n📌 AKUN SISWA')
  console.log('   Semua password : siswa2024')
  console.log('   NIS 1001-1004  : Kelas X TO1      → Ujian dari Bu Sari (Guru A)')
  console.log('   NIS 2001-2004  : Kelas X TO2      → Ujian dari Bu Sari (Guru A)')
  console.log('   NIS 3001-3004  : Kelas X TJKT2    → Ujian dari Bu Dewi (Guru B)')
  console.log('\n📌 TOKEN RUANGAN')
  console.log('   Ruang 1 : ABJK12  (Siswa NIS 1001, 1002)')
  console.log('   Ruang 2 : CDMN34  (Siswa NIS 1003, 1004, 2001, 2002) ← CAMPURAN')
  console.log('   Ruang 3 : EFOP56  (Siswa NIS 2003, 2004, 3001, 3002) ← CAMPURAN 2 GURU')
  console.log('   Ruang 4 : GHQR78  (Siswa NIS 3003, 3004)')
  console.log('\n🌐 URL Akses:')
  console.log('   Siswa   : http://localhost:3000')
  console.log('   Admin   : http://localhost:3000/admin/login')
  console.log('========================================\n')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
