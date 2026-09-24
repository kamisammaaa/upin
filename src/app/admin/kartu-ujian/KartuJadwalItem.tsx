'use client';

import React from 'react';
import { SiswaKartuData } from './KartuPesertaItem';
import { MASTER_JADWAL_UJIAN, resolveJurusanKey } from './jadwalData';

interface KartuJadwalItemProps {
  siswa: SiswaKartuData;
  namaSekolah: string;
  logoUrl?: string | null;
  tahunAjaran: string;
  semester: string;
  titimangsaKota: string;
  tanggalTitimangsa: string;
}

export default function KartuJadwalItem({
  siswa,
  namaSekolah,
  logoUrl,
  tahunAjaran,
  semester,
  titimangsaKota,
  tanggalTitimangsa,
}: KartuJadwalItemProps) {
  const jurusanKey = resolveJurusanKey(siswa.kelas?.nama || '');

  // Group schedule by date
  const groupedSchedule = MASTER_JADWAL_UJIAN.reduce((acc, sesi) => {
    if (!acc[sesi.hariTanggal]) {
      acc[sesi.hariTanggal] = [];
    }
    acc[sesi.hariTanggal].push(sesi);
    return acc;
  }, {} as Record<string, typeof MASTER_JADWAL_UJIAN>);

  return (
    <div className="bg-white text-black p-2 sm:p-2.5 print:p-1.5 border-2 border-dashed border-gray-400 rounded-xl flex flex-col justify-between h-full box-border relative overflow-hidden font-sans print:border-dashed print:border-gray-500 shadow-sm print:shadow-none">
      {/* KOP HEADER JADWAL */}
      <div className="border-b-2 border-double border-slate-900 pb-1 mb-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center p-0.5 bg-white border border-slate-200 rounded-md">
              <img
                src="/uploads/logo-sekolah-smkba.png"
                alt="Logo Sekolah SMK Banjar Asri"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="font-extrabold text-[10px] uppercase tracking-wide text-slate-900 leading-tight">
                JADWAL UJIAN CBT • {namaSekolah || 'SMK BANJAR ASRI'}
              </h2>
              <p className="text-[8px] text-slate-600 font-medium leading-none mt-0.5">
                Tahun Ajaran {tahunAjaran} • Semester {semester}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block bg-blue-900 text-white text-[8px] font-bold px-2 py-0.5 rounded">
              {siswa.kelas?.nama || 'KELAS'}
            </span>
          </div>
        </div>
      </div>

      {/* TABEL JADWAL UJIAN */}
      <div className="flex-1 mb-1 overflow-hidden">
        <table className="w-full border-collapse text-[7.5px] border border-slate-300">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
              <th className="py-0.5 px-1 text-left border-r border-slate-200 w-[28%]">Hari / Tanggal</th>
              <th className="py-0.5 px-0.5 text-center border-r border-slate-200 w-[9%]">Jam</th>
              <th className="py-0.5 px-1 text-center border-r border-slate-200 w-[23%]">Waktu</th>
              <th className="py-0.5 px-1 text-left w-[40%]">Mata Pelajaran</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedSchedule).map(([hari, sesis], groupIdx) => {
              return sesis.map((sesi, idx) => {
                const mapel = sesi.mapelPerJurusan[jurusanKey] || '-';
                return (
                  <tr
                    key={`${sesi.hariTanggal}-${sesi.jamKe}`}
                    className={`border-b border-slate-200 ${
                      groupIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                    }`}
                  >
                    {idx === 0 ? (
                      <td
                        rowSpan={sesis.length}
                        className="py-0.5 px-1 font-semibold text-slate-800 border-r border-slate-200 align-top leading-tight"
                      >
                        {hari}
                      </td>
                    ) : null}
                    <td className="py-[1px] px-0.5 text-center font-mono font-bold text-slate-700 border-r border-slate-200">
                      {sesi.jamKe}
                    </td>
                    <td className="py-[1px] px-1 text-center font-mono text-slate-600 border-r border-slate-200 text-[7px]">
                      {sesi.waktu}
                    </td>
                    <td className="py-[1px] px-1 font-bold text-slate-900 leading-tight">
                      {mapel}
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>

      {/* FOOTER INFORMASI JADWAL */}
      <div className="border-t border-slate-200 pt-1 flex items-center justify-between text-[7px] text-slate-500 mt-auto">
        <p>• Harap hadir di ruang ujian 15 menit sebelum waktu pelaksanaan.</p>
        <p className="font-semibold text-slate-700">{titimangsaKota} - Kurikulum SMK Banjar Asri</p>
      </div>
    </div>
  );
}
