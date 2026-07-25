# Blueprint Sistem Ujian Pintar (Smart CBT) - SMK Banjar Asri

## 1. Pendahuluan
Sistem Ujian Pintar ini dirancang khusus untuk memenuhi kebutuhan evaluasi akademik di **SMK Banjar Asri**. Sistem ini mendukung pelaksanaan ujian secara fleksibel, baik di sekolah (menggunakan jaringan lokal/intranet) maupun dari rumah (menggunakan jaringan internet), serta dapat diakses melalui berbagai perangkat (Mobile/HP, Tablet, PC/Laptop). Fokus utama sistem ini adalah keandalan, skalabilitas, dan **keamanan tingkat tinggi** untuk meminimalisir kecurangan.

---

## 2. Arsitektur Sistem & Jaringan (Hybrid Architecture)
Untuk mengakomodasi ujian di sekolah dengan efisien tanpa membebani bandwidth internet, serta tetap melayani ujian jarak jauh, sistem menggunakan topologi hibrida:

- **Server Lokal (Intranet Sekolah):** Ditempatkan di laboratorium komputer atau ruang server sekolah. Siswa yang ujian di sekolah cukup terhubung ke akses poin WiFi sekolah. Kecepatan akses sangat tinggi dan **bebas kuota internet**.
- **Server Cloud (Internet):** Di-hosting pada layanan cloud (misal: AWS, Google Cloud, VPS lokal). Digunakan oleh siswa yang sedang PJJ (Pembelajaran Jarak Jauh) atau tugas di luar, serta digunakan oleh Guru/Admin untuk mengelola ujian dari rumah.
- **Sinkronisasi (Data Sync):** Server lokal dan cloud akan saling melakukan sinkronisasi data master (soal, daftar siswa) dan hasil ujian secara *real-time* atau terjadwal.

---

## 3. Manajemen Akses & Role (Hak Akses)
Sistem memiliki 4 peran (role) utama dengan ruang lingkup masing-masing:

### A. Admin (Administrator Sistem)
- **Manajemen Pengguna:** Mengelola data Siswa, Guru, dan Proctor (mendukung *import/export* dari file Excel atau Dapodik).
- **Manajemen Master Data:** Mengatur data Tahun Ajaran, Semester, Kelas, Jurusan, dan Mata Pelajaran.
- **Manajemen Jaringan:** Mengatur konfigurasi sinkronisasi antara Server Lokal dan Server Cloud.
- **Maintenance & Backup:** Melakukan backup data berkala dan memantau beban server (CPU/RAM Usage).

### B. Guru (Pembuat Soal & Penilai)
- **Bank Soal:** Membuat dan mengabungkan soal (Pilihan Ganda, Pilihan Ganda Kompleks, Menjodohkan, Uraian Singkat, Essay). Mendukung input multimedia (gambar, audio, video).
- **Paket Ujian:** Merakit paket soal, menentukan durasi ujian, jadwal mulai/selesai, serta Kriteria Ketuntasan Minimal (KKM).
- **Penilaian Manual:** Memberikan nilai khusus untuk tipe soal Essay/Uraian yang tidak bisa dinilai otomatis oleh sistem.
- **Analisis Evaluasi:** Melihat statistik hasil ujian (nilai rata-rata, tertinggi, terendah) dan analisis butir soal (tingkat kesukaran, daya pembeda).

### C. Proctor (Pengawas Ujian)
- **Manajemen Ruangan & Sesi:** Proctor ditugaskan untuk mengawasi satu ruangan spesifik (baik fisik maupun virtual) pada sesi ujian tertentu. 
- **Token Ujian:** Melakukan rilis token ujian secara berkala (misal setiap 15 menit token berganti) kepada siswa yang hadir di ruangannya.
- **Monitoring Real-time (Live Dashboard):** Memantau status langsung seluruh siswa di ruangannya (Sedang Login, Mengerjakan, Selesai, Terputus, atau Terindikasi Curang).
- **Kontrol Siswa:** 
  - **Reset Login:** Mereset sesi siswa jika perangkat siswa hang/mati mendadak agar bisa login di perangkat lain.
  - **Force Submit:** Memaksa menyelesaikan ujian siswa tertentu.
  - **Pause/Unpause:** Memberhentikan sementara timer ujian jika ada gangguan teknis.
- **Laporan Berita Acara:** Mencetak dan menandatangani daftar hadir dan berita acara pelaksanaan ujian untuk ruangan yang diawasinya.

### D. Siswa (Peserta Ujian)
- **Dashboard Siswa:** Melihat daftar ujian yang tersedia hari ini, petunjuk ujian, dan histori nilai (jika diizinkan oleh guru).
- **Aplikasi Ujian (CBT Client):** Antarmuka pengerjaan soal yang bersih, responsif, dan mudah digunakan (baik sentuh di HP maupun klik di PC).

---

## 4. Sistem Keamanan & Pencegahan Kecurangan (Anti-Cheating)
Sistem Ujian Pintar dilengkapi perlindungan berlapis untuk memastikan integritas hasil ujian:

### A. Keamanan Perangkat & Peramban (Browser)
- **Secure Exam Application (Mobile & PC):** Aplikasi khusus ujian yang memiliki fitur *Kiosk Mode* atau *Screen Pinning*. 
  - Jika menggunakan HP, siswa tidak bisa membuka aplikasi lain (seperti WhatsApp, Google, Calculator), tidak bisa melakukan *split-screen*, atau menerima panggilan masuk tanpa ujian terkunci otomatis.
- **Browser Tracking (Web Base):** Jika terpaksa menggunakan browser biasa, sistem mendeteksi saat siswa berpindah tab (Tab Switch), meminimalkan browser, atau kehilangan fokus. Setelah 3 kali peringatan, ujian akan terkunci otomatis (membutuhkan Proctor untuk membuka).
- **Disable Shortcut:** Mematikan fungsi klik kanan, *Copy, Paste, Print Screen, Inspect Element*, dan pintasan keyboard lainnya (Ctrl+C, Ctrl+V, Alt+Tab).

### B. Pengawasan Pintar (Digital Proctoring)
- **Device Fingerprinting:** Sistem mencatat MAC Address atau Unique Device ID (UUID) saat siswa login. Siswa **tidak dapat login di 2 perangkat berbeda secara bersamaan** menggunakan akun yang sama.
- **Watermark Layar Dinamis:** Menampilkan Teks Transparan berisi "Nama, NIS, dan IP Address" secara menyilang dan dinamis di seluruh halaman soal. Jika siswa nekat memfoto layar menggunakan HP lain dan membagikannya ke teman/grup, **identitas penyebar langsung dapat dilacak**.
- **Random Camera Snapshot (Opsional):** Jika diizinkan, aplikasi dapat mengambil foto dari kamera depan (HP/Laptop) secara diam-diam dan acak selama ujian untuk diverifikasi proctor (memastikan yang mengerjakan adalah siswa yang bersangkutan, bukan joki).

### C. Keamanan Konten Ujian
- **Pengacakan Ekstrem (Randomization):** Urutan nomor soal dan urutan pilihan jawaban (A, B, C, D, E) akan diacak unik untuk setiap siswa. Siswa yang duduk bersebelahan akan melihat soal No. 1 yang berbeda, dan posisi jawaban yang berbeda.
- **Enkripsi Payload:** Lalu lintas data antara aplikasi siswa dan server dienkripsi secara penuh, mencegah pencurian soal menggunakan teknik penyadapan jaringan (*Packet Sniffing*).

---

## 5. Fitur Resiliensi (Ketahanan Sistem / Toleransi Gangguan)
Seringkali gangguan jaringan (WiFi putus, sinyal hilang) menjadi kendala. Sistem ini mengatasinya dengan:
- **Local Auto-Save:** Setiap detik, jawaban siswa disimpan terenkripsi di penyimpanan lokal (*Local Storage* perangkat HP/PC). 
- **Offline Tolerance:** Jika di tengah pengerjaan jaringan putus, siswa tetap bisa melanjutkan mengerjakan soal yang sudah berhasil dimuat (caching). Saat siswa menekan "Selesai" atau koneksi kembali normal, aplikasi secara otomatis merangkum data dari *Local Storage* dan mengirimkannya ke server di latar belakang.

---

## 6. Rekomendasi Teknologi (Tech Stack)
Untuk merealisasikan blueprint ini, berikut adalah teknologi yang disarankan:
- **Backend (API Server):** Golang atau Node.js (Express/NestJS) — Sangat kuat menangani koneksi konkuren/ribuan siswa login bersamaan.
- **Database:** PostgreSQL (untuk relasi data utama) + Redis (untuk manajemen antrean, token, dan caching saat load tinggi).
- **Frontend (Web Admin/Guru/Proctor):** React.js, Vue.js, atau Next.js.
- **Aplikasi Mobile (Siswa):** Flutter (Bisa dikompilasi menjadi aplikasi Android .apk/.aab dan iOS dengan satu basis kode).
- **Aplikasi Desktop (Siswa):** Electron.js (Bisa dimodifikasi agar menjadi *Safe Exam Browser* yang mengunci OS Windows/macOS).

---

## 7. Manajemen Ruangan, Sesi, dan Penugasan Guru
Untuk menjawab kondisi operasional sekolah yang kompleks, sistem diatur dengan logika berikut:

### A. Pembagian Ruangan dan Sesi (Mapping Siswa & Proctor)
- **Satu Proctor = Satu Ruangan:** Demi efektivitas pengawasan, **satu proktor hanya ditugaskan untuk mengawasi satu ruangan per sesi ujian**. 
- **Sistem Sesi (Shift):** Jika jumlah perangkat/kapasitas ruangan lab komputer terbatas, ujian dapat dibagi menjadi beberapa **Sesi** (contoh: Sesi 1 jam 07:30, Sesi 2 jam 10:00). Satu ruangan bisa dipakai bergantian, namun setiap sesi di ruangan tersebut tetap dipegang oleh satu proktor.
- **Ruangan Virtual (Untuk Ujian Online):** Jika siswa ujian dari rumah, sistem akan membagi siswa secara otomatis ke dalam "Ruangan Virtual" (misalnya maksimal 36 siswa per ruang virtual agar layar *monitoring* tidak terlalu penuh). Masing-masing ruang virtual ini tetap diawasi oleh satu Proctor melalui dashboard *real-time* dan *random camera snapshot*.

### B. Distribusi Guru Mata Pelajaran (Kasus 1 Tingkat, Beda Guru)
Seringkali siswa di satu tingkat (misal Kelas X) diajar oleh guru yang berbeda-beda untuk satu mata pelajaran yang sama (misal Matematika). Sistem mengakomodasi ini melalui fitur **Koordinator Mata Pelajaran (MGMP Internal Sekolah)**:
1. **Bank Soal Bersama:** Guru-guru yang mengajar mapel dan tingkat yang sama dapat berkolaborasi pada satu "Bank Soal". Salah satu guru ditunjuk sebagai Koordinator untuk merakit **Paket Ujian Utama**.
2. **Distribusi Paket Soal:** Paket Ujian Utama tersebut kemudian di-assign (didistribusikan) langsung ke seluruh kelas X. 
3. **Pemisahan Laporan Nilai:** Meskipun siswa dari berbagai kelas mengerjakan paket soal yang sama, sistem secara otomatis akan memfilter dan **mendistribusikan rekap nilai dan analisis evaluasi kembali ke masing-masing guru pengampu**. Guru A hanya akan melihat nilai kelas yang diajarnya (misal X-A dan X-B), sementara Guru B melihat nilai kelas X-C dan X-D. 
4. **Opsi Ujian Berbeda (Guru Merdeka):** Jika memang kurikulum/pembelajaran tiap kelas berbeda dan guru sepakat tidak ada ujian serentak, sistem tetap mengizinkan Guru A membuat paket ujian khusus yang hanya bisa diakses oleh kelas X-A, tanpa mengganggu jadwal kelas lain.

---

## 8. Penanganan Multi-Jurusan dan Ujian Campuran
SMK seringkali memiliki kerumitan jadwal dan keterbatasan lab, sehingga membutuhkan fleksibilitas tingkat tinggi. Sistem ini dirancang untuk mengatasi kasus berikut:

### A. Mata Pelajaran Sama, Jurusan Berbeda, Soal Berbeda
Kasus: Mapel A Tingkat X diajar oleh Guru C (untuk jurusan TKJ) dan Guru D (untuk jurusan TKR), dan keduanya memiliki paket soal yang sama sekali berbeda.
- **Targeting Spesifik (Assignment):** Saat Guru C membuat ujian, ia mengonfigurasi *Target Peserta* spesifik hanya untuk `Kelas X -> Jurusan TKJ`. 
- Guru D mengonfigurasi ujiannya untuk `Kelas X -> Jurusan TKR`.
- Sistem memisahkan secara total kedua paket ujian ini sejak awal berdasarkan profil kelas/jurusan, meskipun nama mata pelajarannya sama.

### B. Ruangan Ujian Campuran (Silang Kelas/Jurusan/Tingkat)
Kasus: Dalam satu ruangan Lab Komputer berisi campuran siswa dari Kelas X TKJ, XI TKR, dan XII Akuntansi secara bersamaan.
- **Dashboard Berbasis Profil (Personalized Dashboard):** Siswa **tidak akan mungkin salah mengakses soal**. Saat siswa login menggunakan NIS/Username mereka, sistem akan membaca profil mereka (Tingkat, Jurusan, Kelas). Di layar siswa, *hanya akan muncul paket ujian yang memang ditujukan untuk profil mereka pada jam tersebut*. Siswa TKJ tidak akan bisa melihat apalagi mengklik ujian milik siswa TKR.
- **Token Universal Ruangan (Room Token):** Untuk memudahkan Proctor di ruangan campuran, Proctor cukup merilis **satu Token Ruangan**. Ketika siswa X TKJ dan siswa XI TKR memasukkan token yang sama tersebut, sistem akan membuka paket soal mereka masing-masing sesuai profil di latar belakang. Proctor tidak perlu pusing membagikan banyak token berbeda.

### C. Guru Mengajar Mapel Lintas Jurusan
Kasus: Guru E mengajar Bahasa Inggris untuk Kelas X TKJ dan X TKR, dan ingin memberikan paket soal yang sama untuk kedua jurusan tersebut.
- **Multi-Select Targeting:** Guru cukup membuat **satu Bank Soal**. Saat mendistribusikan (assign) ujian, guru dapat mencentang banyak kelas/jurusan sekaligus (misal: mencentang `X TKJ 1`, `X TKJ 2`, dan `X TKR 1`).
- **Laporan Nilai Terpusat & Terfilter:** Hasil ujian dari berbagai jurusan tersebut akan masuk ke satu dasbor laporan milik Guru E. Guru dapat mengunduh seluruh nilai sekaligus dalam satu file Excel (dengan kolom penanda jurusan/kelas), atau memfilter tampilannya per kelas saat ingin melakukan rekapitulasi ke buku nilai.

---

## 9. Kesimpulan
Blueprint **Sistem Ujian Pintar (Smart CBT)** untuk SMK Banjar Asri ini dirancang sebagai solusi *end-to-end* yang kuat, adaptif, dan sangat aman. 
- **Fleksibel secara Infrastruktur:** Mampu berjalan di intranet lokal maupun internet (hybrid) dengan toleransi putus koneksi (*offline tolerance*).
- **Fleksibel secara Operasional:** Mengatasi realita kerumitan jadwal SMK seperti guru lintas jurusan, silang mata pelajaran, dan ruangan campuran tanpa membingungkan proktor atau siswa.
- **Keamanan Ketat:** Menggabungkan penguncian layar, pelacakan *fingerprint* perangkat, dan *watermark* dinamis untuk memastikan integritas hasil evaluasi tetap terjaga.

Dengan blueprint ini, tim pengembang (developer) memiliki acuan yang sangat jelas terkait logika bisnis, alur kerja, dan batasan sistem untuk mulai membangun atau memilih platform perangkat lunak yang paling sesuai dengan kebutuhan SMK Banjar Asri.
