import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    // Validasi tipe file: hanya gambar yang diizinkan
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Format file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.' },
        { status: 400 }
      );
    }

    // Validasi ukuran file: maks 10MB
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: 'Ukuran file terlalu besar. Maksimal 10MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Bikin nama file unik
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const rawName = file.name ? file.name.replace(/[^a-zA-Z0-9.\-_]/g, '').split('.')[0] : 'pasted';
    const originalName = rawName || 'pasted';
    const filename = `${uniqueSuffix}-${originalName}.webp`;
    
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'soal');
    
    // Pastikan direktori ada
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      console.log('Upload dir exists or error:', err);
    }

    const path = join(uploadDir, filename);

    // Kompres gambar menggunakan sharp
    const compressedBuffer = await sharp(buffer)
      .resize({ width: 800, withoutEnlargement: true }) // Maksimal lebar 800px
      .webp({ quality: 80 }) // Konversi ke webp dengan kualitas 80%
      .toBuffer();

    await writeFile(path, compressedBuffer);

    const fileUrl = `/uploads/soal/${filename}`;

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ success: false, message: 'Error uploading file' }, { status: 500 });
  }
}
