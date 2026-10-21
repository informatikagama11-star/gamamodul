# Gama Administrasi Guru — Paket Perbaikan Tahap 1

Paket ini memperbaiki panel admin yang sebelumnya tidak lengkap, menampilkan seluruh 11 dokumen Word yang dilampirkan, menambahkan pengaturan kalender akademik dan agenda, pengaturan identitas/logo sekolah, monitoring dokumen, serta backend aman untuk membuat/menghapus akun guru Firebase Authentication.

## Isi paket

- `index.html` — aplikasi web responsif untuk admin dan guru.
- `templates/` — 11 dokumen Word asli dari lampiran, dipertahankan sebagai berkas sumber.
- `functions/index.js` — Cloud Functions menggunakan Firebase Admin SDK untuk pembuatan/penghapusan akun guru.
- `scripts/set-admin-claim.js` — alat satu kali untuk menetapkan klaim `role=admin` ke akun admin awal.
- `database.rules.json` — contoh aturan akses Realtime Database berdasarkan peran.
- `storage.rules` — aturan penyimpanan file logo dan dokumen.
- `firebase.json` — konfigurasi deployment Hosting, Functions, Database, dan Storage.

## Penting sebelum dipasang

Paket ini sengaja TIDAK terhubung otomatis ke project lama. Sebelum dipakai, buat/pilih project Firebase baru untuk sekolah dan ganti konfigurasi Web App di `index.html`. Jangan deploy rules ke project yang berisi data penting sebelum meninjau aturan dan membuat backup. Jangan pernah mengunggah service-account JSON ke GitHub.

## A. Persiapan Firebase

1. Buat/pilih project Firebase baru di Firebase Console. Salin konfigurasi dari Project settings → General → Your apps → Web app. Ganti objek `firebaseConfig` di `index.html` dengan konfigurasi yang disalin. Sesuaikan `FIREBASE_DATABASE_URL` dengan URL RTDB yang benar-benar muncul di console (region dapat berbeda).
2. Aktifkan **Authentication → Sign-in method → Email/Password**.
3. Pastikan Realtime Database dan Storage tersedia.
4. Di komputer, pasang Node.js 20 dan Firebase CLI:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add
   ```
5. Masuk ke folder paket ini sebelum menjalankan perintah deployment.

## B. Siapkan admin pertama

1. Di Firebase Authentication, buat akun admin pertama secara manual atau gunakan akun admin yang sudah ada.
2. Unduh service-account key dari **Project settings → Service accounts** dan simpan di lokasi aman di komputer, di luar folder GitHub/repository.
3. Set environment variable `GOOGLE_APPLICATION_CREDENTIALS` ke path service-account JSON.

   PowerShell:
   ```powershell
   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\secure\service-account.json"
   $env:FIREBASE_PROJECT_ID="project-id-baru"
   $env:FIREBASE_DATABASE_URL="https://project-id-baru-default-rtdb.asia-southeast1.firebasedatabase.app"
   ```

4. Instal dependency Admin SDK untuk script satu kali:
   ```bash
   npm install firebase-admin
   ```
5. Tetapkan klaim admin dengan email yang tepat:
   ```bash
   node scripts/set-admin-claim.js admin@sekolah.sch.id
   ```
6. Keluar dari aplikasi lalu masuk kembali agar klaim terbaru terbaca. Akun yang tidak memiliki klaim `role=admin` atau `role=teacher` tidak diberi akses dashboard.

## C. Deploy backend dan aturan

Dari folder paket, pastikan `firebase use --add` memilih project yang baru dibuat, bukan project lama. Dari folder paket:

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

Setelah memastikan aturan cocok dengan data yang ada dan sudah ada backup, deploy rules:

```bash
firebase deploy --only database,storage
```

> Rules di paket ini mengasumsikan data profil guru disimpan pada `teachers/{uid}`. Data lama yang disimpan dengan key acak atau akun yang belum punya custom claim perlu dimigrasikan sebelum dipakai. Jangan mengaktifkan rules baru secara mendadak tanpa menyiapkan claim dan data profil yang sesuai.

## D. Deploy website

Letakkan folder ini sebagai folder hosting project yang dipilih, lalu jalankan:

```bash
firebase deploy --only hosting
```

Alternatif: upload isi folder ke hosting statis yang mendukung file HTML dan folder `templates/`. Cloud Functions tetap harus dideploy ke Firebase yang sama.

## E. Cara kerja menu

- **Data & Akun Guru:** admin mengisi nama, email, password awal, NIY, mata pelajaran, dan kelas/fase. Cloud Function membuat akun Auth, memberi klaim `role=teacher`, lalu menyimpan profil tanpa menyimpan password.
- **Kalender Akademik:** menyimpan tahun ajaran, semester, HEB, JBE, catatan, dan agenda bertanggal.
- **Dokumen Word:** admin dan guru dapat mengunduh semua dokumen Word sumber dari folder `templates/`.
- **Portal Guru:** guru mengunggah hasil DOCX/PDF dan memantau status pemeriksaan.
- **Monitoring Dokumen:** admin dapat menyetujui atau meminta revisi dengan catatan.
- **Pengaturan Sekolah:** admin dapat menyimpan identitas sekolah dan mengunggah logo.

## Batasan tahap 1 yang perlu diketahui

Berkas Word sumber saat ini adalah contoh dokumen Informatika kelas 4 dan berisi isi/tabel spesifik seperti yang dilampirkan. Paket ini menampilkan dan mempertahankan dokumen asli agar tidak mengarang isi. Fitur untuk mengisi data guru secara otomatis *di dalam tata letak Word asli* memerlukan proses templating DOCX lanjutan untuk tiap dokumen; jangan menganggap penggantian nama/kelas otomatis sudah selesai pada paket ini.

## Checklist pengujian sebelum digunakan

- [ ] Login admin hanya berhasil jika klaim `role=admin` sudah ditetapkan.
- [ ] Akun guru baru bisa login dengan email/password yang dibuat admin.
- [ ] Guru tidak bisa membaca data guru lain atau mengubah kalender.
- [ ] Admin dapat menyimpan kalender dan agenda, lalu guru dapat melihatnya.
- [ ] Semua 11 file Word dapat diunduh dari perangkat admin dan guru.
- [ ] Guru dapat mengunggah DOCX/PDF di bawah 15 MB.
- [ ] Admin dapat membuka file, memberi status, dan catatan revisi.
- [ ] Uji di HP dan komputer.
