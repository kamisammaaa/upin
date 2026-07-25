-- CreateTable
CREATE TABLE "BankSoal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "judul" TEXT NOT NULL,
    "mapelId" INTEGER NOT NULL,
    "guruId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BankSoal_mapelId_fkey" FOREIGN KEY ("mapelId") REFERENCES "MataPelajaran" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BankSoal_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Soal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bankSoalId" INTEGER NOT NULL,
    "pertanyaan" TEXT NOT NULL,
    "opsi" TEXT NOT NULL,
    "kunciJawaban" TEXT NOT NULL,
    "bobot" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "Soal_bankSoalId_fkey" FOREIGN KEY ("bankSoalId") REFERENCES "BankSoal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JadwalUjian" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "bankSoalId" INTEGER NOT NULL,
    "ruanganId" INTEGER NOT NULL,
    "proctorId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "waktuMulai" DATETIME NOT NULL,
    "waktuSelesai" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JadwalUjian_bankSoalId_fkey" FOREIGN KEY ("bankSoalId") REFERENCES "BankSoal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JadwalUjian_ruanganId_fkey" FOREIGN KEY ("ruanganId") REFERENCES "Ruangan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JadwalUjian_proctorId_fkey" FOREIGN KEY ("proctorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_JadwalUjianToKelas" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_JadwalUjianToKelas_A_fkey" FOREIGN KEY ("A") REFERENCES "JadwalUjian" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_JadwalUjianToKelas_B_fkey" FOREIGN KEY ("B") REFERENCES "Kelas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "JadwalUjian_token_key" ON "JadwalUjian"("token");

-- CreateIndex
CREATE UNIQUE INDEX "_JadwalUjianToKelas_AB_unique" ON "_JadwalUjianToKelas"("A", "B");

-- CreateIndex
CREATE INDEX "_JadwalUjianToKelas_B_index" ON "_JadwalUjianToKelas"("B");
