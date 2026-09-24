export interface SesiJadwal {
  hariTanggal: string;
  jamKe: number;
  waktu: string;
  mapelPerJurusan: {
    'X TO': string;
    'X TJKT': string;
    'X TE': string;
    'XI TKR': string;
    'XI TKJ': string;
    'XI TAV': string;
  };
}

export const MASTER_JADWAL_UJIAN: SesiJadwal[] = [
  // Senin, 21 September 2026
  {
    hariTanggal: 'Senin, 21 September 2026',
    jamKe: 1,
    waktu: '07.30 - 09.00',
    mapelPerJurusan: {
      'X TO': 'PABP',
      'X TJKT': 'PABP',
      'X TE': 'PABP',
      'XI TKR': 'PABP',
      'XI TKJ': 'PABP',
      'XI TAV': 'PABP',
    },
  },
  {
    hariTanggal: 'Senin, 21 September 2026',
    jamKe: 2,
    waktu: '09.30 - 10.30',
    mapelPerJurusan: {
      'X TO': 'Sejarah',
      'X TJKT': 'Sejarah',
      'X TE': 'Sejarah',
      'XI TKR': 'Sejarah',
      'XI TKJ': 'Sejarah',
      'XI TAV': 'Sejarah',
    },
  },
  {
    hariTanggal: 'Senin, 21 September 2026',
    jamKe: 3,
    waktu: '10.30 - 11.30',
    mapelPerJurusan: {
      'X TO': 'IPAS',
      'X TJKT': 'IPAS',
      'X TE': 'IPAS',
      'XI TKR': 'Kewirausahaan',
      'XI TKJ': 'Kewirausahaan',
      'XI TAV': 'Kewirausahaan',
    },
  },

  // Selasa, 22 September 2026
  {
    hariTanggal: 'Selasa, 22 September 2026',
    jamKe: 1,
    waktu: '07.30 - 09.00',
    mapelPerJurusan: {
      'X TO': 'Pendidikan Pancasila',
      'X TJKT': 'Pendidikan Pancasila',
      'X TE': 'Pendidikan Pancasila',
      'XI TKR': 'Pendidikan Pancasila',
      'XI TKJ': 'Pendidikan Pancasila',
      'XI TAV': 'Pendidikan Pancasila',
    },
  },
  {
    hariTanggal: 'Selasa, 22 September 2026',
    jamKe: 2,
    waktu: '09.30 - 10.30',
    mapelPerJurusan: {
      'X TO': 'Bahasa Sunda',
      'X TJKT': 'Bahasa Sunda',
      'X TE': 'Bahasa Sunda',
      'XI TKR': 'Bahasa Sunda',
      'XI TKJ': 'Bahasa Sunda',
      'XI TAV': 'Bahasa Sunda',
    },
  },
  {
    hariTanggal: 'Selasa, 22 September 2026',
    jamKe: 3,
    waktu: '10.30 - 11.30',
    mapelPerJurusan: {
      'X TO': 'Informatika',
      'X TJKT': 'Informatika',
      'X TE': 'Informatika',
      'XI TKR': 'KI-08',
      'XI TKJ': 'KI-17',
      'XI TAV': 'KI-07',
    },
  },

  // Rabu, 23 September 2026
  {
    hariTanggal: 'Rabu, 23 September 2026',
    jamKe: 1,
    waktu: '07.30 - 09.00',
    mapelPerJurusan: {
      'X TO': 'Bahasa Indonesia',
      'X TJKT': 'Bahasa Indonesia',
      'X TE': 'Bahasa Indonesia',
      'XI TKR': 'Bahasa Indonesia',
      'XI TKJ': 'Bahasa Indonesia',
      'XI TAV': 'Bahasa Indonesia',
    },
  },
  {
    hariTanggal: 'Rabu, 23 September 2026',
    jamKe: 2,
    waktu: '09.30 - 10.30',
    mapelPerJurusan: {
      'X TO': 'DPK-21',
      'X TJKT': 'DPK-33',
      'X TE': 'DPK-29',
      'XI TKR': 'KK-09',
      'XI TKJ': 'KK-17',
      'XI TAV': 'KK-07',
    },
  },
  {
    hariTanggal: 'Rabu, 23 September 2026',
    jamKe: 3,
    waktu: '10.30 - 11.30',
    mapelPerJurusan: {
      'X TO': 'Seni Budaya',
      'X TJKT': 'Seni Budaya',
      'X TE': 'Seni Budaya',
      'XI TKR': 'KK-08',
      'XI TKJ': 'KK-18',
      'XI TAV': 'KK-29',
    },
  },

  // Kamis, 24 September 2026
  {
    hariTanggal: 'Kamis, 24 September 2026',
    jamKe: 1,
    waktu: '07.30 - 09.00',
    mapelPerJurusan: {
      'X TO': 'B. Inggris',
      'X TJKT': 'B. Inggris',
      'X TE': 'B. Inggris',
      'XI TKR': 'B. Inggris',
      'XI TKJ': 'B. Inggris',
      'XI TAV': 'B. Inggris',
    },
  },
  {
    hariTanggal: 'Kamis, 24 September 2026',
    jamKe: 2,
    waktu: '09.30 - 10.30',
    mapelPerJurusan: {
      'X TO': 'KKA',
      'X TJKT': 'KKA',
      'X TE': 'KKA',
      'XI TKR': 'Bahasa Jepang',
      'XI TKJ': 'Bahasa Jepang',
      'XI TAV': 'Bahasa Jepang',
    },
  },
  {
    hariTanggal: 'Kamis, 24 September 2026',
    jamKe: 3,
    waktu: '10.30 - 11.30',
    mapelPerJurusan: {
      'X TO': 'DPK-08',
      'X TJKT': 'DPK-17',
      'X TE': '-',
      'XI TKR': 'KK-05',
      'XI TKJ': 'KK-16',
      'XI TAV': '-',
    },
  },

  // Jumat, 25 September 2026
  {
    hariTanggal: 'Jumat, 25 September 2026',
    jamKe: 1,
    waktu: '07.30 - 09.00',
    mapelPerJurusan: {
      'X TO': 'Matematika',
      'X TJKT': 'Matematika',
      'X TE': 'Matematika',
      'XI TKR': 'Matematika',
      'XI TKJ': 'Matematika',
      'XI TAV': 'Matematika',
    },
  },
  {
    hariTanggal: 'Jumat, 25 September 2026',
    jamKe: 2,
    waktu: '09.30 - 10.30',
    mapelPerJurusan: {
      'X TO': 'DPK-09',
      'X TJKT': 'DPK-16',
      'X TE': '-',
      'XI TKR': 'Mata Pelajaran Pilihan',
      'XI TKJ': 'Mata Pelajaran Pilihan',
      'XI TAV': 'Mata Pelajaran Pilihan',
    },
  },
  {
    hariTanggal: 'Jumat, 25 September 2026',
    jamKe: 3,
    waktu: '10.30 - 11.30',
    mapelPerJurusan: {
      'X TO': '-',
      'X TJKT': '-',
      'X TE': '-',
      'XI TKR': '-',
      'XI TKJ': 'KK-06',
      'XI TAV': '-',
    },
  },
];

export type JurusanKey = 'X TO' | 'X TJKT' | 'X TE' | 'XI TKR' | 'XI TKJ' | 'XI TAV';

export function resolveJurusanKey(namaKelas: string): JurusanKey {
  const norm = (namaKelas || '').toUpperCase().replace(/\s+/g, ' ').trim();
  if (norm.includes('X TE')) return 'X TE';
  if (norm.includes('X TJKT')) return 'X TJKT';
  if (norm.includes('X TO')) return 'X TO';
  if (norm.includes('XI TKJ')) return 'XI TKJ';
  if (norm.includes('XI TAV')) return 'XI TAV';
  if (norm.includes('XI TKR') || norm.includes('XI TO')) return 'XI TKR';
  if (norm.includes('XII TJKT')) return 'X TJKT';
  if (norm.includes('XII TO')) return 'X TO';
  if (norm.includes('XII TAV')) return 'XI TAV';
  return 'X TJKT';
}
