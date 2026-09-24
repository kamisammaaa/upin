# Panduan Spesifikasi Perangkat, Instalasi PWA, dan Petunjuk Ujian Siswa
**Sistem Ujian Berbasis Komputer (UPIN CBT) — SMK Banjar Asri**  
**Dokumen Resmi Panitia Ujian Sekolah**

---

## 1. Syarat Minimal Perangkat (System Requirements)

Agar tampilan aplikasi ujian (UI) tampil optimal, responsif, tidak terpotong, dan proses pengiriman jawaban berlangsung lancar, peserta ujian wajib menggunakan perangkat yang memenuhi kriteria berikut:

### A. Smartphone / Tablet (Android & iOS)
| Komponen | Spesifikasi Minimal | Rekomendasi Ideal |
| :--- | :--- | :--- |
| **Sistem Operasi (OS)** | Android 8.0 (Oreo) / iOS 14.0 | Android 10+ / iOS 16+ |
| **RAM** | Minimal 2 GB | 3 GB atau lebih |
| **Penyimpanan Bebas** | Minimal 500 MB | 1 GB bebas |
| **Layar & Resolusi** | Minimal 5.0 inci, resolusi 720x1280 (HD) | Layar 6.0 inci ke atas (FHD) |
| **Peramban (Browser)** | **Google Chrome** versi 100+ (Android)<br>**Safari** versi 14+ (iOS) | Google Chrome versi terbaru / Safari terbaru |
| **Pengaturan Tampilan HP** | Ukuran font sistem: **Standar / Sedang** | Jangan gunakan font sistem "Sangat Besar / Huge" karena dapat memotong tata letak opsi jawaban |

> [!CAUTION]
> **BROWSER YANG DILARANG DIGUNAKAN:**
> 1. **UC Browser, Opera Mini, Dolphin:** Memiliki fitur kompresi proxy yang merusak format LaTeX matematika dan memblokir sinkronisasi jawaban real-time.
> 2. **In-App Browser (Browser bawaan WhatsApp, TikTok, Instagram):** Dilarang membuka tautan ujian dari dalam aplikasi obrolan. Wajib dibuka langsung di aplikasi Google Chrome atau Safari.
> 3. **Mi Browser / Vivo Browser / Oppo Browser bawaan:** Sering kali memicu auto-kill background process. Disarankan memasang **Google Chrome resmi dari Play Store**.

---

### B. Komputer / Laptop (Windows, MacOS, Linux, Chromebook)
| Komponen | Spesifikasi Minimal | Rekomendasi Ideal |
| :--- | :--- | :--- |
| **Sistem Operasi** | Windows 10 (64-bit) / macOS 11 / ChromeOS | Windows 10/11 / macOS 12+ |
| **Prosesor & RAM** | Dual Core, RAM minimal 2 GB | Core i3 / Ryzen 3, RAM 4 GB+ |
| **Resolusi Layar** | 1366 x 768 piksel | 1920 x 1080 (Full HD) |
| **Peramban (Browser)** | **Google Chrome** atau **Microsoft Edge** versi terbaru | Google Chrome / MS Edge terbaru |

---

## 2. Cara Instalasi Aplikasi Ujian (PWA - Layar Penuh)

Aplikasi UPIN mendukung teknologi **PWA (Progressive Web App)**. Sangat disarankan bagi siswa untuk memasang (menginstal) aplikasi ini ke layar utama agar:
- Tampilan menjadi **layar penuh (Full Screen)** tanpa bilah alamat (*address bar*) browser yang memakan tempat.
- Mencegah siswa tidak sengaja menekan tombol *Back* atau *Refresh* browser.
- Mengurangi risiko terdeteksi keluar dari layar ujian (*anti-cheat false trigger*).

---

### A. Panduan Instalasi di HP Android (Google Chrome)
1. Sambungkan HP ke jaringan Wi-Fi sekolah yang telah ditentukan panitia.
2. Buka aplikasi **Google Chrome**.
3. Ketik alamat URL ujian: **`https://upin.smkba.sch.id`**
4. Di bagian bawah layar biasanya akan muncul banner otomatis: **"Tambahkan UPIN ke Layar Utama"** atau **"Instal Aplikasi"** -> Klik **Instal**.
5. Jika banner tidak muncul otomatis:
   - Ketuk ikon **titik tiga (⋮)** di pojok kanan atas browser Chrome.
   - Pilih menu **"Instal aplikasi"** atau **"Tambahkan ke Layar Utama" (Add to Home Screen)**.
   - Ketuk **Instal / Tambah**.
6. Ikon aplikasi **UPIN CBT** berlogo sekolah akan muncul di layar utama (*Homescreen*) HP Anda.
7. Selanjutnya, buka aplikasi langsung melalui ikon di layar utama tersebut.

---

### B. Panduan Instalasi di iPhone / iPad (Apple Safari)
1. Sambungkan perangkat ke Wi-Fi sekolah.
2. Buka peramban resmi **Safari** *(Catatan: Apple hanya mengizinkan instalasi PWA melalui Safari, bukan Chrome iOS)*.
3. Kunjungi URL: **`https://upin.smkba.sch.id`**
4. Ketuk tombol **Bagikan / Share** (ikon kotak dengan panah mengarah ke atas) di bagian tengah bawah layar.
5. Gulir ke bawah, lalu pilih menu **"Tambahkan ke Layar Utama" (Add to Home Screen)**.
6. Ketuk **Tambah (Add)** di pojok kanan atas.
7. Ikon **UPIN** siap digunakan langsung dari layar utama iPhone Anda dalam mode aplikasi mandiri (*standalone full-screen*).

---

### C. Panduan Instalasi di Komputer / Laptop (Windows / Mac)
1. Buka browser **Google Chrome** atau **Microsoft Edge**.
2. Masuk ke alamat: **`https://upin.smkba.sch.id`**
3. Di ujung kanan bilah alamat (address bar), klik ikon **Instal UPIN** (ikon monitor kecil dengan panah ke bawah).
4. Klik **Instal**. Aplikasi akan terbuka dalam jendela tersendiri tanpa tab dan address bar.

---

## 3. Petunjuk Teknis Penggunaan Aplikasi untuk Siswa

```
[1. Login NIS & Password]
          ↓
[2. Dashboard Siswa: Cek Jadwal Mapel]
          ↓
[3. Masukkan Token Ruangan dari Proktor]
          ↓
[4. Mengerjakan Soal Ujian (Pilihan Ganda)]
          ↓
[5. Konfirmasi Selesai Ujian]
```

### Langkah 1: Login ke Aplikasi
1. Buka aplikasi **UPIN** yang sudah diinstal di layar utama perangkat.
2. Masukkan **NIS (Nomor Induk Siswa)** dan **Password** yang tertera pada Kartu Peserta Ujian masing-masing.
3. Pastikan tidak ada spasi di awal atau akhir NIS.
4. Ketuk tombol **"Masuk Ujian"**.

### Langkah 2: Memilih Ujian di Dashboard
1. Setelah login berhasil, Anda akan diarahkan ke Dashboard Siswa.
2. Pada bagian **"Jadwal Ujian Aktif"**, cari mata pelajaran yang dijadwalkan pada jam tersebut.
3. Ketuk tombol **"Mulai Ujian"** (atau **"Lanjutkan Ujian"** jika Anda sempat keluar/terputus sebelumnya).

### Langkah 3: Memasukkan Token Ruangan
1. Sistem akan meminta Anda memasukkan **6 Karakter Token Ruangan**.
2. Dengarkan token yang diumumkan/ditulis oleh **Bapak/Ibu Proktor** di depan kelas.
3. Masukkan token dengan benar, lalu tekan **"Verifikasi & Masuk Ujian"**.

### Langkah 4: Trik Navigasi Saat Mengerjakan Soal
- **Memilih Jawaban:** Cukup ketuk salah satu opsi (A, B, C, D, atau E). Opsi yang terpilih akan berubah warna menjadi ungu/aksen dengan tanda titik aktif.
- **Menyimpan Jawaban:** Jawaban tersimpan otomatis secara instan. Tidak ada tombol "Simpan manual" per butir soal.
- **Tombol Ragu-Ragu:** Jika belum yakin dengan jawaban, ketuk tombol bendera kuning **"Ragu-ragu"**. Nomor soal pada lembar kisi-kisi akan berubah warna menjadi kuning.
- **Mengubah Ukuran Teks:** Jika teks dirasa terlalu kecil atau terlalu besar, gunakan tombol **A-**, **A**, **A+**, **A++** di sudut atas layar.
- **Memperbesar Gambar Soal:** Jika soal memiliki diagram, grafik, atau gambar teks, **ketuk gambar tersebut** untuk membuka tampilan pembesar (*zoom lightbox*). Ketuk tanda silang (✕) untuk menutupnya kembali.
- **Daftar Nomor Soal:** Buka panel nomor soal di sisi kanan (atau bawah pada HP) untuk melompat langsung ke nomor soal tertentu:
  - Kotak **Abu-abu**: Belum dijawab.
  - Kotak **Hijau**: Sudah dijawab dengan yakin.
  - Kotak **Kuning**: Ditandai ragu-ragu.
- **Indikator Koneksi (Di Pojok Atas):**
  - Ikon **Hijau (Online)**: Terhubung lancar dengan server ujian.
  - Ikon **Kuning (Syncing)**: Sedang menyinkronkan beberapa jawaban yang sempat tertunda.
  - Ikon **Merah (Offline)**: Koneksi Wi-Fi Anda terputus. Tetap lanjutkan mengerjakan soal, jawaban Anda aman di HP dan akan otomatis terkirim saat Wi-Fi kembali normal.

### Langkah 5: Menyelesaikan Ujian
1. Pastikan seluruh butir soal sudah dijawab (warna hijau pada lembar nomor soal).
2. Di nomor soal terakhir (atau melalui tombol navigasi), ketuk tombol hijau **"Selesai Ujian"**.
3. Kotak konfirmasi akan muncul merangkum jumlah soal yang sudah dijawab dan yang masih ragu-ragu.
4. Beri tanda centang pada kotak persetujuan: *"Saya telah memeriksa kembali seluruh jawaban saya..."*.
5. Ketuk tombol **"Ya, Selesaikan"**.
6. Tunggu hingga layar menampilkan pesan **"Ujian Selesai!"**, lalu ketuk kembali ke Dashboard.

---

## 4. Peraturan Ketat Integritas Ujian (Sistem Anti-Curang)

Aplikasi UPIN dilengkapi sensor keamanan aktif untuk menjamin kejujuran:

1. **Batas Maksimal Pelanggaran:** Peserta hanya memiliki toleransi **maksimal 3 kali peringatan**. Pada pelanggaran ke-3, ujian akan **langsung dihentikan paksa (auto-submit otomatis)** dan peserta dikeluarkan dari sistem.
2. **Tindakan yang Terdeteksi sebagai Pelanggaran:**
   - Menekan tombol Home atau berpindah ke aplikasi lain (misal: WhatsApp, Google, Catatan).
   - Membuka tab baru di browser.
   - Menarik bilah notifikasi atas (*pull-down notification*) terlalu lama.
   - Melakukan tangkapan layar (*Screenshot / PrintScreen*).
   - Membiarkan layar HP mati atau terkunci (*auto-sleep / lock screen*).
   - Menekan tombol pintas split-screen atau floating apps.
3. **Jika Perangkat Mengalami Kendala:**
   - Jika HP tiba-tiba kehabisan baterai, restart, atau mati mendadak, **segera lapor kepada Proktor Ruangan**.
   - Jawaban Anda yang telah dipilih sebelumnya **tidak akan hilang**. Anda dapat menyalakan kembali HP atau meminjam HP cadangan, lalu login kembali untuk melanjutkan sisa waktu ujian.
