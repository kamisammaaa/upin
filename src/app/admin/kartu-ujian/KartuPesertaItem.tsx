'use client';

import React from 'react';

export interface SiswaKartuData {
  id: number;
  nis: string;
  nama: string;
  passwordPlain?: string | null;
  kelas: {
    id: number;
    nama: string;
  };
  ruangan?: {
    id: number;
    nama: string;
  } | null;
  qrSvg: string;
}

interface KartuPesertaItemProps {
  siswa: SiswaKartuData;
  namaSekolah: string;
  logoUrl?: string | null;
  tahunAjaran: string;
  semester: string;
  titimangsaKota: string;
  tanggalTitimangsa: string;
  namaKepalaSekolah: string;
  passwordDisplay: string;
}

export default function KartuPesertaItem({
  siswa,
  namaSekolah,
  logoUrl,
  tahunAjaran,
  semester,
  titimangsaKota,
  tanggalTitimangsa,
  namaKepalaSekolah,
  passwordDisplay,
}: KartuPesertaItemProps) {
  return (
    <div className="bg-white text-black p-2 sm:p-2.5 print:p-2 border-2 border-dashed border-gray-400 rounded-xl flex flex-col justify-between h-full box-border relative overflow-hidden font-sans print:border-dashed print:border-gray-500 shadow-sm print:shadow-none">
      {/* BACKGROUND WATERMARK & DECORATION */}
      <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
        {/* Pola Guilloche / Security Pattern Halus */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.035] text-slate-800"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="card-security-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
              <path
                d="M0 12 L12 0 L24 12 L12 24 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.75"
              />
              <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#card-security-pattern)" />
        </svg>

        {/* Soft Gradient Nuansa Resmi */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-slate-100/40" />

        {/* Watermark Logo Sekolah di Tengah */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/uploads/logo-sekolah-smkba.png"
            alt="Watermark Logo SMK Banjar Asri"
            className="w-48 h-48 object-contain opacity-[0.075] print:opacity-[0.09]"
          />
        </div>
      </div>

      {/* KOP HEADER */}
      <div className="border-b-2 border-double border-slate-900 pb-1.5 mb-2 relative z-10">
        <div className="flex items-center justify-between gap-2">
          {/* LOGO SEKOLAH (KIRI) */}
          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center p-0.5 bg-white border border-slate-200 rounded-lg">
            <img
              src="/uploads/logo-sekolah-smkba.png"
              alt="Logo Sekolah SMK Banjar Asri"
              className="w-full h-full object-contain"
            />
          </div>

          {/* TEKS KOP RESMI */}
          <div className="flex-1 text-center">
            <h4 className="font-bold text-[8px] text-slate-700 uppercase tracking-wide leading-none">
              ASSESMEN SUMATIF TENGAH SEMESTER ( ASTS ) GANJIL
            </h4>
            <h2 className="font-extrabold text-[12px] uppercase tracking-wide text-slate-950 leading-tight mt-0.5">
              {namaSekolah || 'SMK BANJAR ASRI'}
            </h2>
            <h3 className="font-bold text-[10px] text-blue-900 uppercase tracking-tight leading-tight mt-0.5">
              KARTU PESERTA UJIAN (CBT) UPIN
            </h3>
            <p className="text-[8.5px] text-slate-600 font-medium leading-none mt-0.5">
              Tahun Ajaran {tahunAjaran} • Semester {semester}
            </p>
          </div>

          {/* LOGO UPIN (KANAN) */}
          <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center p-0.5 bg-white border border-slate-200 rounded-lg">
            <img
              src={logoUrl || '/uploads/logo-upin.png'}
              alt="Logo UPIN"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>

      {/* BODY IDENTITAS & QR CODE */}
      <div className="flex-1 flex gap-2 items-start mb-2 relative z-10">
        {/* TABEL DATA IDENTITAS SISWA */}
        <div className="flex-1 text-[10.5px]">
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-1 font-semibold text-slate-600 w-24">NIS / User</td>
                <td className="py-1 text-slate-400 w-2">:</td>
                <td className="py-1 font-mono font-bold text-slate-950 text-[11px]">
                  {siswa.nis}
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 font-semibold text-slate-600">Nama Lengkap</td>
                <td className="py-1 text-slate-400">:</td>
                <td className="py-1 font-bold text-slate-950 uppercase leading-snug break-words text-[11px]">
                  {siswa.nama}
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 font-semibold text-slate-600">Kelas</td>
                <td className="py-1 text-slate-400">:</td>
                <td className="py-1 font-medium text-slate-900">
                  {siswa.kelas?.nama || '-'}
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 font-semibold text-slate-600">Ruang Ujian</td>
                <td className="py-1 text-slate-400">:</td>
                <td className="py-1 font-semibold text-blue-900">
                  {siswa.ruangan?.nama || 'Belum Ditentukan'}
                </td>
              </tr>
              <tr>
                <td className="py-1 font-semibold text-slate-600">Password</td>
                <td className="py-1 text-slate-400">:</td>
                <td className="py-1 font-mono font-bold text-slate-950 text-[11px] tracking-wider">
                  {passwordDisplay === 'REAL'
                    ? (siswa.passwordPlain || siswa.nis)
                    : passwordDisplay === 'NIS'
                    ? siswa.nis
                    : passwordDisplay}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* QR CODE VERIFIKASI */}
        <div className="w-20 flex-shrink-0 flex flex-col items-center justify-center p-1 bg-slate-50 border border-slate-200 rounded-lg">
          <div
            className="w-16 h-16 [&>svg]:w-full [&>svg]:h-full"
            dangerouslySetInnerHTML={{ __html: siswa.qrSvg }}
          />
          <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-tighter mt-0.5 text-center">
            Verifikasi UPIN
          </span>
        </div>
      </div>

      {/* FOOTER & PENGESAHAN KEPALA SEKOLAH */}
      <div className="border-t border-slate-200 pt-2 flex items-end justify-between text-[9px] mt-auto relative z-10">
        {/* TATA TERTIB RINGKAS */}
        <div className="w-[52%] text-slate-500 space-y-0.5 pr-2">
          <p className="font-bold text-slate-700 text-[8.5px]">Tata Tertib Singkat:</p>
          <p className="leading-tight">1. Kartu ini wajib dibawa saat ujian.</p>
          <p className="leading-tight">2. Jaga kerahasiaan akun login.</p>
        </div>

        {/* TITIMANGSA & KEPALA SEKOLAH */}
        <div className="w-[48%] text-center flex flex-col items-center">
          <p className="text-slate-700 leading-tight">
            {titimangsaKota}, {tanggalTitimangsa}
          </p>
          <p className="text-slate-700 font-semibold leading-tight">
            Kepala Sekolah,
          </p>
          {/* AREA TANDA TANGAN & CAP RESMI */}
          <div
            className="relative my-0.5 mx-auto flex items-center justify-center"
            style={{ width: '140px', height: '46px' }}
          >
            {/* Tanda Tangan Kepala Sekolah (Layer Dasar) */}
            <img
              src="/uploads/ttd-kepsek-smkba.png"
              alt="Tanda Tangan Kepala Sekolah"
              style={{ width: '92px', height: '42px', objectFit: 'contain' }}
              className="relative z-10 pointer-events-none select-none"
            />
            {/* Cap Stempel Resmi (Biru - Menimpa Sebagian Tanda Tangan) */}
            <img
              src="/uploads/cap-sekolah-smkba.png"
              alt="Cap Sekolah"
              style={{
                width: '52px',
                height: '52px',
                left: '20px',
                top: '-3px',
                objectFit: 'contain',
              }}
              className="absolute pointer-events-none select-none mix-blend-multiply opacity-90 z-20"
            />
          </div>
          <p className="font-bold text-slate-900 underline text-[9.5px] leading-tight">
            {namaKepalaSekolah}
          </p>
          <p className="text-[8px] text-slate-600 leading-tight">
            NUPTK. 8947759660200052
          </p>
        </div>
      </div>
    </div>
  );
}
