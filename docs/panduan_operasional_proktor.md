# Panduan Operasional & Prosedur Standar (SOP) Proktor Ujian
**Sistem Ujian Berbasis Komputer (UPIN CBT) — SMK Banjar Asri**  
**Dokumen Resmi Penjaminan Mutu & Pengawasan Asesmen**

---

## 1. Peran dan Tanggung Jawab Proktor

Proktor adalah penanggung jawab teknis dan pengawasan di ruang ujian yang bertugas:
1. Menjamin kelancaran perangkat siswa dan koneksi jaringan di ruangan masing-masing.
2. Membagikan dan mengamankan **Token Ruangan Ujian**.
3. Memantau progres pengerjaan dan kedisiplinan siswa secara *real-time* melalui panel **Live Monitor Proktor**.
4. Melakukan penanganan teknis (*troubleshooting*) jika ada siswa yang mengalami kendala perangkat (HP mati, freeze, tidak sengaja keluar, atau terkunci).
5. Memastikan seluruh berkas ujian peserta terkirim dan terselesaikan sebelum siswa meninggalkan ruangan.

---

## 2. Alur Kerja Proktor (Tahap demi Tahap)

```
[1. Login Proktor & Buka Ruangan]
               ↓
[2. Periksa Daftar Hadir & Rilis Token]
               ↓
[3. Buka Dashboard Live Monitor]
               ↓
[4. Pengawasan Real-Time & Penanganan Siswa]
               ↓
[5. Finalisasi & Verifikasi Nilai Selesai]
               ↓
[6. Ekspor Rekap Ruangan]
```

---

### Tahap 1: Persiapan & Login ke Portal Proktor (H-30 Menit)
1. Buka browser (Google Chrome / Edge) di laptop/komputer Proktor.
2. Akses alamat: **`https://upin.smkba.sch.id/admin/login`**
3. Masukkan **Username** dan **Password** akun Proktor Anda.
4. Setelah berhasil masuk, Anda akan berada di Dashboard Proktor yang menampilkan daftar ruangan pengawasan (misal: *Ruang 1*, *Ruang 2*, dst).
5. Klik pada kartu ruangan yang Anda awasi untuk masuk ke halaman **Live Monitor Ruangan**.

---

### Tahap 2: Pengelolaan Token Ruangan Ujian (H-10 Menit)
1. Di bagian atas panel monitor ruangan, perhatikan kotak **Token Ujian** (terdiri dari 6 huruf/angka kapital, contoh: `9GK569`).
2. Tuliskan token tersebut di papan tulis ruangan hanya ketika:
   - Siswa sudah tertib duduk di tempat masing-masing.
   - Waktu ujian sudah resmi dimulai sesuai jadwal.
3. **Fitur Ganti / Rilis Token Baru (Refresh Token):**
   - Jika token ruangan bocor ke luar ruangan atau Anda ingin memperbarui token untuk sesi baru, klik tombol **"Refresh Token"** (ikon putar di samping token).
   - Token lama otomatis tidak berlaku, dan token baru 6 karakter acak akan segera diterbitkan.
   - Siswa yang sudah berada di dalam ujian **tidak akan terganggu** oleh penggantian token. Token hanya dibutuhkan siswa saat pertama kali masuk ke lembar ujian.

---

### Tahap 3: Pemantauan Siswa Secara Real-Time (Live Monitoring)

Halaman monitor proktor terhubung dengan teknologi **SSE (Server-Sent Events)** berlabel badge hijau **"Live"**:
- Data status, jumlah soal terjawab, dan pelanggaran diperbarui secara otomatis setiap detik tanpa perlu merefresh halaman browser manual.

#### Arti Indikator Status Siswa pada Tabel:
| Status | Warna Badge | Keterangan |
| :--- | :--- | :--- |
| **BELUM MULAI** | Abu-abu | Siswa belum login atau belum memasukkan token ujian. |
| **MENGERJAKAN** | Biru (Berdenyut) | Siswa sedang aktif menjawab soal di dalam layar ujian. |
| **SELESAI** | Hijau | Siswa telah menekan tombol selesai dan nilai akhir telah terhitung. |

#### Kolom Penting yang Wajib Dipantau:
1. **Progres Jawaban (`Jumlah Dijawab / Total Soal`):**
   - Anda dapat melihat berapa nomor yang telah diisi siswa secara langsung (contoh: `25 / 40`).
   - Jika menjelang waktu habis ada siswa yang progresnya masih rendah, proktor dapat mengingatkan siswa tersebut.
2. **Kolom Pelanggaran (Peringatan Kecurangan):**
   - Jika siswa mencoba alt-tab, keluar ke WhatsApp, minimize browser, atau screenshot, kolom ini akan memunculkan badge merah **`⚠️ X`** disertai jumlah pelanggaran (1, 2, atau 3 kali).
   - Proktor dapat langsung menghampiri meja siswa yang terdeteksi melakukan pelanggaran.

---

## 3. Penanganan Masalah Teknis Siswa (Troubleshooting Guide)

### Kasus A: HP Siswa Mati / Habis Baterai / Tidak Sengaja Tertutup
- **Fakta Sistem:** Seluruh jawaban siswa yang sempat dipilih **tersimpan aman di server dan memori lokal**.
- **Solusi:**
  1. Mintalah siswa menyalakan kembali HP-nya (atau pinjamkan HP/perangkat cadangan ruangan).
  2. Siswa membuka `https://upin.smkba.sch.id` dan login kembali dengan NIS & Password miliknya.
  3. Di dashboard siswa, klik tombol **"Lanjutkan Ujian"**.
  4. Masukkan kembali token ruangan.
  5. Seluruh jawaban sebelumnya akan kembali terisi otomatis, dan siswa melanjutkan ujian tanpa kehilangan data.

---

### Kasus B: Siswa Tidak Bisa Login Kembali / Sesi Terkunci
- **Penyebab:** Sistem mendeteksi sesi siswa sebelumnya masih berstatus aktif (*locked session*).
- **Solusi Proktor:**
  1. Cari nama siswa tersebut di tabel monitor ruangan Anda.
  2. Pada kolom **Aksi**, klik tombol biru **"Reset Login"** (ikon putar balik).
  3. Konfirmasi tindakan.
  4. Status sesi siswa akan di-refresh menjadi siap login kembali.
  5. Mintalah siswa melakukan login ulang dari perangkatnya.

---

### Kasus C: Siswa Terkena Auto-Submit karena 3 Kali Pelanggaran
- **Penyebab:** Siswa keluar dari aplikasi ujian sebanyak 3 kali (notifikasi, telepon masuk, atau mencoba membuka aplikasi lain).
- **Solusi Proktor:**
  - Lakukan investigasi: Apakah siswa sengaja membuka kunci contekan, atau murni akibat kendala perangkat (misalnya ada panggilan telepon mendesak atau pop-up sistem HP).
  - **Jika diberi izin toleransi untuk mengulang:**
    - Proktor dapat mengklik tombol **"Reset Login"** pada baris siswa tersebut untuk mengembalikan statusnya ke *Mengerjakan*.
  - **Jika terbukti kecurangan disengaja:**
    - Biarkan status siswa tetap *Selesai* dan catat kejadian tersebut pada Berita Acara Ujian.

---

### Kasus D: Siswa Mengalami Insiden Fatal (Perlu Mulai dari Nol)
- **Tombol "Hapus & Mulai Ulang" (Ikon Tempat Sampah Merah):**
  - **PERINGATAN KERAS:** Tombol ini akan **menghapus seluruh sesi dan seluruh lembar jawaban siswa tersebut secara permanen**.
  - Hanya gunakan opsi ini jika ada instruksi khusus dari Ketua Panitia (misalnya: salah memasukkan paket soal atau siswa salah mengerjakan jadwal).

---

### Kasus E: Waktu Ujian Habis tapi Siswa Lupa Menekan Tombol Selesai
- **Fakta Sistem:** Server telah dilengkapi fitur **Auto-Finalize Otomatis**.
- Begitu jam jadwal ujian berakhir, sistem server secara otomatis mengunci lembar ujian, mengevaluasi seluruh jawaban yang masuk, dan menerbitkan nilai akhir.
- Proktor juga dapat mengklik tombol **"Paksa Selesai Ujian"** (ikon kotak/stop merah) pada baris siswa yang bersangkutan jika ingin segera menutup sesinya saat itu juga.

---

## 4. Prosedur Pasca-Ujian (Penutupan Sesi)

1. **Verifikasi Status:**
   - Pastikan seluruh siswa yang hadir di ruangan Anda sudah berstatus **"SELESAI"** (badge hijau) dan nilai akhir telah muncul pada monitor.
2. **Ekspor Rekap Ruangan (Excel):**
   - Klik tombol hijau **"Ekspor Excel"** di bagian atas halaman monitor proktor.
   - Simpan berkas `.xlsx` hasil ujian ruangan tersebut sebagai arsip pegangan proktor.
3. **Cetak Berita Acara / Rekap:**
   - Gunakan tombol **"Cetak Rekap"** jika panitia sekolah mewajibkan lampiran fisik tanda tangan proktor ruangan.
4. **Pemberitahuan Keluar:**
   - Setelah semua data diverifikasi selesai oleh proktor, siswa dipersilakan keluar ruangan dengan tertib.
