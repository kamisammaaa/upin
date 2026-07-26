import { Metadata } from 'next';
import TambahProktorClient from './TambahProktorClient';

export const metadata: Metadata = {
  title: 'Tambah Proktor - Admin',
};

export default function TambahProktorPage() {
  return <TambahProktorClient />;
}
