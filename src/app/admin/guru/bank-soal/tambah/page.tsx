import prisma from '@/lib/prisma';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import TambahBankSoalForm from './TambahBankSoalForm';

export default async function TambahBankSoalPage() {
  redirect('/admin/guru/bank-soal');
}
