-- CreateTable
CREATE TABLE "Jurusan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Tingkat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "level" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Kelas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "tingkatId" INTEGER NOT NULL,
    CONSTRAINT "Kelas_tingkatId_fkey" FOREIGN KEY ("tingkatId") REFERENCES "Tingkat" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ruangan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "kapasitas" INTEGER NOT NULL DEFAULT 40
);

-- CreateTable
CREATE TABLE "_JurusanToKelas" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_JurusanToKelas_A_fkey" FOREIGN KEY ("A") REFERENCES "Jurusan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_JurusanToKelas_B_fkey" FOREIGN KEY ("B") REFERENCES "Kelas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Jurusan_kode_key" ON "Jurusan"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "Tingkat_level_key" ON "Tingkat"("level");

-- CreateIndex
CREATE UNIQUE INDEX "Kelas_nama_key" ON "Kelas"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "Ruangan_nama_key" ON "Ruangan"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "_JurusanToKelas_AB_unique" ON "_JurusanToKelas"("A", "B");

-- CreateIndex
CREATE INDEX "_JurusanToKelas_B_index" ON "_JurusanToKelas"("B");
