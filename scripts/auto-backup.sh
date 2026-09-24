#!/bin/bash
set -e

PROJECT_DIR="/home/kami/upin"
BACKUP_DIR="${PROJECT_DIR}/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="${BACKUP_DIR}/backup.log"

mkdir -p "${BACKUP_DIR}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Memulai pencadangan otomatis CBT..." >> "${LOG_FILE}"

# 1. Jalankan WAL checkpoint agar dev.db sinkron sempurna
cd "${PROJECT_DIR}"
node -e '
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const client = new PrismaClient({ adapter });
client.$executeRawUnsafe("PRAGMA wal_checkpoint(TRUNCATE)")
  .then(() => client.$disconnect())
  .catch((err) => { console.error(err); client.$disconnect(); });
' 2>> "${LOG_FILE}" || true

# 2. Salin dev.db ke folder backups
TARGET_FILE="${BACKUP_DIR}/UPIN_AUTO_BACKUP_${TIMESTAMP}.db"
if [ -f "${PROJECT_DIR}/dev.db" ]; then
  cp "${PROJECT_DIR}/dev.db" "${TARGET_FILE}"
  FILE_SIZE=$(du -h "${TARGET_FILE}" | cut -f1)
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sukses mencadangkan ke ${TARGET_FILE} (${FILE_SIZE})" >> "${LOG_FILE}"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: dev.db tidak ditemukan!" >> "${LOG_FILE}"
fi

# 3. Hapus cadangan otomatis lama yang berusia lebih dari 7 hari
find "${BACKUP_DIR}" -name "UPIN_AUTO_BACKUP_*.db" -type f -mtime +7 -delete 2>/dev/null || true
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Siklus backup otomatis selesai." >> "${LOG_FILE}"
