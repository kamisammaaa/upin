# Alur Kerja Sistem Ujian Pintar (Workflow)

Berikut adalah visualisasi alur (flow) cara kerja sistem ujian dari awal persiapan hingga penanganan ketika terjadi gangguan jaringan.

---

## 1. Alur Persiapan Ujian (Admin & Guru)
Alur ini menjelaskan bagaimana sebuah ujian disiapkan sebelum siswa bisa mengaksesnya.

```mermaid
sequenceDiagram
    participant A as Admin
    participant G as Guru
    participant S as Sistem CBT
    
    A->>S: 1. Setup Data Master (Siswa, Kelas, Jurusan, Mapel)
    A->>S: 2. Set Konfigurasi Jaringan (Lokal/Cloud)
    G->>S: 3. Membuat Bank Soal (PG, Essay) & Multimedia
    G->>S: 4. Membuat Jadwal & Paket Ujian
    G->>S: 5. Assign Ujian (Pilih Target: Kelas & Jurusan spesifik)
    S-->>G: 6. Ujian berstatus "Menunggu Jadwal"
    S-->>A: 7. Sinkronisasi Data ke Server Lokal & Cloud
```

---

## 2. Alur Pelaksanaan Ujian (Proctor & Siswa)
Alur ini terjadi pada hari-H ujian di dalam ruangan (fisik maupun virtual).

```mermaid
sequenceDiagram
    actor Siswa
    participant Client as Aplikasi/Browser Siswa
    participant Sys as Sistem Server
    actor Proctor

    Proctor->>Sys: 1. Buka Dashboard Pengawasan
    Proctor->>Sys: 2. Generate/Rilis Token Ruangan
    Sys-->>Proctor: Tampilkan Token (misal: "X1B9")
    
    Siswa->>Client: 3. Login dengan NIS/Username
    Client->>Sys: 4. Verifikasi Kredensial & MAC Address
    Sys-->>Client: 5. Tampilkan Dashboard (Hanya ujian sesuai profil siswa)
    
    Siswa->>Client: 6. Pilih Ujian & Masukkan Token "X1B9"
    Client->>Sys: 7. Validasi Token & Kesiapan Perangkat (Kiosk Mode aktif)
    
    alt Token/Profil Valid
        Sys-->>Client: 8a. Unduh Soal & Acak Urutan
        Client->>Siswa: 9a. Tampilkan Soal Pertama (Timer Berjalan)
        Proctor->>Sys: 10a. Memantau Status Siswa (Live)
    else Token/Profil Tidak Valid
        Sys-->>Client: 8b. Akses Ditolak
        Client->>Siswa: 9b. Peringatan: "Token Salah atau Ujian Bukan Untuk Anda"
    end
```

---

## 3. Alur Penanganan Putus Jaringan (Offline Tolerance)
Ini adalah alur di belakang layar saat perangkat siswa kehilangan sinyal internet/intranet saat sedang ujian.

```mermaid
flowchart TD
    A[Siswa Menjawab Soal No. 5] --> B{Koneksi Jaringan Aktif?}
    B -- Ya --> C[Kirim Jawaban Langsung ke Server]
    C --> D[Pindah ke Soal No. 6]
    
    B -- Tidak (Putus) --> E[Sistem Mendeteksi Jaringan Terputus]
    E --> F[Aktifkan Mode Offline Tolerance]
    F --> G[Enkripsi Jawaban & Simpan di Local Storage HP/PC]
    G --> H[Siswa Tetap Bisa Menjawab Soal yang Sudah Ter-cache]
    
    H --> I{Sinyal Kembali?}
    I -- Belum --> G
    I -- Ya (Terhubung) --> J[Auto-Sync: Tarik data dari Local Storage]
    J --> K[Kirim Seluruh Jawaban Tertunda ke Server]
    K --> L[Melanjutkan Normal]
    
    H --> M{Waktu Habis / Siswa Klik Submit}
    M --> N[Aplikasi Meminta Siswa Mencari Sinyal]
    N --> O[Setelah dapat sinyal, klik Sinkronisasi Akhir]
```

---

## 4. Alur Evaluasi dan Rekapitulasi (Pasca Ujian)
Bagaimana nilai diproses setelah semua siswa selesai.

```mermaid
flowchart LR
    A([Siswa Submit Ujian]) --> B[Sistem Auto-Grade Soal PG]
    B --> C{Ada Soal Essay?}
    C -- Ya --> D[Guru Mengoreksi & Input Nilai Essay di Sistem]
    D --> E[Kalkulasi Nilai Akhir]
    C -- Tidak --> E
    
    E --> F[Sistem Memecah Laporan per Kelas/Guru]
    F --> G[Guru Mengunduh Rekap Nilai Excel]
    F --> H[Guru Melihat Analisis Butir Soal]
```
