# Dokumentasi Resmi Sistem Ujian Pintar (UPIN-SMKBA)
**Versi:** 2.1.0 — Pembaruan September 2026  
**Instansi:** SMK Banjar Asri  
**Akses URL:** [https://upin.smkba.sch.id](https://upin.smkba.sch.id)

---

## 1. Ikhtisar Sistem (Executive Summary)

**PintarCBT (UPIN-SMKBA)** adalah platform evaluasi dan asesmen digital berbasis web (Hybrid Intranet/Cloud) yang dibangun untuk menjamin:
1. **Integritas Ujian Bebas Kecurangan:** Anti-perpindahan tab, anti-blur, deteksi loss-focus, toleransi maksimal 3 pelanggaran berujung auto-submit.
2. **Resiliensi Jaringan (Zero-Data Loss):** Penyimpanan ganda ke LocalStorage browser dan server database secara asinkron. Siswa tidak kehilangan jawaban jika koneksi WiFi sekolah putus sesaat.
3. **Fleksibilitas Ruangan Campuran:** Siswa dari jurusan berbeda (contoh: TO, TJKT, TAV) dapat duduk di satu ruangan laboratorium yang sama, mengerjakan mata pelajaran dan paket soal yang berbeda sesuai jadwal kelasnya masing-masing.

---

## 2. Pembaruan Fitur Terbaru

### A. Fitur Penulisan & Rendering Rumus Matematika (KaTeX / LaTeX)
* **Palet Simbol Interaktif di Toolbar Editor:**
  Tombol **`∑ Rumus`** pada toolbar `RichTextEditor` membuka generator formula matematika lengkap dengan kategori:
  * Pecahan ($\frac{a}{b}$), Akar ($\sqrt{x}, \sqrt[n]{x}$), Pangkat ($x^n$), Indeks ($x_n$)
  * Aritmetika ($\pm, \times, \div, \cdot$) dan Relasi ($\leq, \geq, \neq, \approx$)
  * Kalkulus & Aljabar ($\int f(x) dx, \sum x_i, \lim, \text{Matriks } 2\times 2, \vec{v}$)
  * Huruf Yunani ($\alpha, \beta, \gamma, \theta, \pi, \Delta, \lambda, \omega$)
  * Trigonometri & Logaritma ($\sin, \cos, \tan, \log, \ln$)
* **Live KaTeX Preview:** Rumus langsung ter-render saat kode LaTeX diketik.
* **Mode Tampilan:**
  * *Inline* (`$rumus$`): Sebaris teks di tengah kalimat soal.
  * *Block* (`$$rumus$$`): Rumus terpusat di baris tersendiri.
* **Dukungan Import Excel:** Cukup ketik `$rumus$` di kolom pertanyaan atau opsi Excel.
* **Rendering Otomatis di Siswa:** KaTeX engine merender rumus secara instan di layar siswa, kartu preview, maupun cetak A4.

---

### B. Redesain Manajemen Jadwal Ujian (`/admin/jadwal`)
* **Pengelompokan Otomatis per Tanggal (Date Grouping):**
  Jadwal ujian dikelompokkan rapi per hari pelaksanaan (contoh: `Senin, 21 September 2026`) dengan badge penanda `🌟 HARI INI` dan jumlah ujian.
* **Pengurutan Kronologis Maju & Sesi Ujian:**
  Jadwal diurutkan maju berdasarkan jam mulai (`waktuMulai asc`) dan otomatis diberi label: **Sesi 1**, **Sesi 2**, **Sesi 3** lengkap dengan jam WIB dan durasi menit.
* **Highlight Card "Jadwal Terdekat / Sedang Berlangsung":**
  Kartu fokus di paling atas yang otomatis menampilkan ujian aktif (berdenyut hijau) atau ujian yang akan datang berikutnya dengan tombol pintas *Pantau Ujian Sekarang*.
* **Filter & Pencarian Real-Time:**
  * Tab status: *Semua*, *Hari Ini*, *Sedang Berjalan*, *Akan Datang*, *Selesai*.
  * Filter pencarian instan nama ujian, mapel, atau kelas peserta.
  * Dropdown pilih tanggal tertentu.
* **Tampilan Ganda:** Mode timeline per tanggal dan mode tabel ringkas (*compact table*).

---

### C. Sistem Penilaian & Pembobotan Soal
* **Formula Penilaian:**
  $$\text{Nilai Akhir} = \text{round}\left( \frac{\text{Total Bobot Benar}}{\text{Total Bobot Seluruh Soal}} \times 100 \right)$$
* **Ketentuan:**
  * Skala nilai standar: **0 hingga 100**.
  * Bobot default per soal = **1**.
  * Tidak ada pengurangan nilai (*tidak ada sistem minus*) untuk jawaban salah atau kosong.
  * Mendukung pembobotan berbeda per butir soal (*weighted scoring*).

---

## 3. Alur Operasional Ujian (Standard Operating Procedure)

### Tahap 1: Pra-Ujian (Administrator & Guru)
1. **Admin** memeriksa data master (Tingkat, Kelas, Jurusan, Mapel, Siswa, Ruangan).
2. **Guru** membuat Bank Soal (atau mengimpor via template Excel).
3. **Admin** membuat Jadwal Ujian, menentukan waktu mulai & selesai, dan menautkan kelas peserta.
4. **Admin** mencetak Kartu Ujian yang berisi NIS, Nama, dan QR Code login siswa.

### Tahap 2: Hari-H Pelaksanaan (Proktor & Siswa)
1. **Proktor** masuk ke `/admin/proktor`, memilih ruangan, dan merilis **Token Ruangan (6 Karakter)**.
2. **Siswa** login di `https://upin.smkba.sch.id/login` menggunakan NIS dan password.
3. **Siswa** memilih jadwal ujian dan memasukkan Token Ruangan.
4. **Siswa** mengaktifkan mode layar penuh (*fullscreen*) dan mulai mengerjakan soal.
5. Setiap pilihan jawaban otomatis tersimpan ke server dan ke memori perangkat.
6. **Proktor** memantau live status siswa. Jika siswa mengalami kendala perangkat (laptop mati), proktor menekan **Reset Login** agar siswa bisa melanjutkan ujian di perangkat lain tanpa kehilangan jawaban.

### Tahap 3: Pasca Ujian (Koreksi & Rekap)
1. Ujian selesai diserahkan oleh siswa atau di-*auto-submit* oleh sistem jika waktu habis.
2. Sistem secara otomatis mengoreksi jawaban dan menghitung skor akhir.
3. Admin atau Guru mengunduh **Rekap Nilai Excel (.xlsx)** atau mencadangkan **Snapshot Database (.db)** dari menu jadwal ujian.

---

## 4. Parameter Teknis & Arsitektur Server

* **Framework:** Next.js 16 (React 19, TypeScript)
* **Database:** SQLite via Better-SQLite3
  * `journal_mode: WAL` (Konkurensi tinggi baca/tulis tanpa lock)
  * `busy_timeout: 5000` (Toleransi antrean penulisan hingga 5 detik)
  * `synchronous: NORMAL (1)`
* **Reverse Proxy:** Nginx (Port 80)
  * Gzip Compression Level 6
  * Offload folder `/_next/static/` dan `/uploads/`
  * SSE Buffer Disabled untuk rute `/api/monitor/`
* **Process Manager:** PM2 (Cluster/Fork, Systemd enabled)
  * Auto-restart on memory limit: 1 GB
  * Systemd service: `pm2-kami.service`
* **Domain & Tunnel:** Cloudflare Tunnel (`cloudflared.service`) mengarah ke `https://upin.smkba.sch.id`.

---

## 5. Ringkasan Perintah Operasional (Cheatsheet DevOps)

| Perintah | Deskripsi |
| :--- | :--- |
| `pm2 status` | Memeriksa status kesehatan server |
| `pm2 logs pintarcbt` | Memantau log aplikasi secara langsung (*real-time*) |
| `pm2 restart pintarcbt` | Me-restart aplikasi |
| `pm2 reload pintarcbt` | Me-reload aplikasi tanpa *downtime* |
| `pm2 save` | Menyimpan konfigurasi proses untuk auto-start booting |
| `systemctl status cloudflared` | Memeriksa status Cloudflare Tunnel |
| `systemctl is-active nginx` | Memeriksa status web server Nginx |
