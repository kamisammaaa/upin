import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/** Hash password baru sebelum disimpan ke database */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/** Verifikasi password saat login — bandingkan plain dengan hash di DB */
export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  // Deteksi otomatis: jika hash belum di-bcrypt (plain text lama), bandingkan langsung
  // Ini memastikan kompatibilitas mundur sebelum migrasi selesai
  if (!hashed.startsWith('$2b$') && !hashed.startsWith('$2a$')) {
    return plain === hashed;
  }
  return bcrypt.compare(plain, hashed);
}
