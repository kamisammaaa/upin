-- CreateTable
CREATE TABLE "SesiUjianSiswa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "siswaId" INTEGER NOT NULL,
    "jadwalId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ONGOING',
    "pelanggaran" INTEGER NOT NULL DEFAULT 0,
    "waktuMulai" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waktuSelesai" DATETIME,
    "nilaiAkhir" REAL,
    CONSTRAINT "SesiUjianSiswa_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "Siswa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SesiUjianSiswa_jadwalId_fkey" FOREIGN KEY ("jadwalId") REFERENCES "JadwalUjian" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JawabanSiswa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sesiId" INTEGER NOT NULL,
    "soalId" INTEGER NOT NULL,
    "opsiDipilih" TEXT,
    "isBenar" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "JawabanSiswa_sesiId_fkey" FOREIGN KEY ("sesiId") REFERENCES "SesiUjianSiswa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JawabanSiswa_soalId_fkey" FOREIGN KEY ("soalId") REFERENCES "Soal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SesiUjianSiswa_siswaId_jadwalId_key" ON "SesiUjianSiswa"("siswaId", "jadwalId");

-- CreateIndex
CREATE UNIQUE INDEX "JawabanSiswa_sesiId_soalId_key" ON "JawabanSiswa"("sesiId", "soalId");
