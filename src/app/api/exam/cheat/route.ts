import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { submitExam } from '@/app/actions/exam';

export async function POST(request: Request) {
  try {
    let sesiId: number | null = null;
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const body = await request.json();
      sesiId = Number(body.sesiId);
    } else {
      const text = await request.text();
      try {
        const body = JSON.parse(text);
        sesiId = Number(body.sesiId);
      } catch {
        sesiId = Number(text);
      }
    }

    if (!sesiId || isNaN(sesiId)) {
      return NextResponse.json({ success: false, message: 'Invalid sesiId' }, { status: 400 });
    }

    const sesi = await prisma.sesiUjianSiswa.findUnique({ where: { id: sesiId } });
    if (!sesi || sesi.status === 'FINISHED') {
      return NextResponse.json({ forcedSubmit: false, count: sesi ? sesi.pelanggaran : 0 });
    }

    const updatedSesi = await prisma.sesiUjianSiswa.update({
      where: { id: sesiId },
      data: {
        pelanggaran: { increment: 1 }
      }
    });

    if (updatedSesi.pelanggaran >= 3) {
      await submitExam(sesiId);
      return NextResponse.json({ forcedSubmit: true, count: updatedSesi.pelanggaran });
    }

    return NextResponse.json({ forcedSubmit: false, count: updatedSesi.pelanggaran });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
