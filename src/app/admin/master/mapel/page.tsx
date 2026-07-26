import prisma from '@/lib/prisma';
import MapelClient from './MapelClient';

export const metadata = {
  title: 'Data Mata Pelajaran',
};

export default async function MapelPage() {
  const mapels = await prisma.mataPelajaran.findMany({
    orderBy: { nama: 'asc' },
  });

  return <MapelClient initialData={mapels} />;
}
