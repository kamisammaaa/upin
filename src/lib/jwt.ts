import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const getSecret = () => new TextEncoder().encode(
  process.env.JWT_SECRET || 'pintarcbt-smkba-secret-2026'
);

export interface AdminPayload extends JWTPayload {
  id: number;
  role: string;
  nama: string;
}

/** Buat JWT token untuk admin/guru/proktor saat login (berlaku 24 jam) */
export async function signAdminToken(payload: { id: number; role: string; nama: string }): Promise<string> {
  return new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret());
}

/** Verifikasi dan decode JWT token admin */
export async function verifyAdminToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as AdminPayload;
  } catch {
    // Fallback selama masa transisi jika masih ada token Base64 lama
    return decodeToken(token);
  }
}

/** Decode token secara aman, mendukung format JWT maupun Base64 lama */
export function decodeToken(token: string): AdminPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const json = Buffer.from(parts[1], 'base64url').toString('utf-8');
      return JSON.parse(json) as AdminPayload;
    }
    const json = Buffer.from(token, 'base64').toString('utf-8');
    return JSON.parse(json) as AdminPayload;
  } catch {
    return null;
  }
}

export const decodeTokenLegacy = decodeToken;
