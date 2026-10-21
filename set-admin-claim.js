// Jalankan dari komputer admin menggunakan service account yang disimpan DI LUAR repository.
// PowerShell contoh:
// $env:GOOGLE_APPLICATION_CREDENTIALS="C:\secure\service-account.json"
// node scripts/set-admin-claim.js admin@sekolah.sch.id
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const projectId = process.env.FIREBASE_PROJECT_ID;
const databaseURL = process.env.FIREBASE_DATABASE_URL;
const email = process.argv[2];
if (!email) {
  console.error('Cara pakai: node scripts/set-admin-claim.js email-admin@sekolah.sch.id');
  process.exit(1);
}
if (!projectId || !databaseURL) {
  console.error('Atur FIREBASE_PROJECT_ID dan FIREBASE_DATABASE_URL sesuai project baru.');
  process.exit(1);
}
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Atur GOOGLE_APPLICATION_CREDENTIALS ke file service-account JSON yang disimpan aman. Jangan commit file itu ke GitHub.');
  process.exit(1);
}
initializeApp({ credential: applicationDefault(), projectId, databaseURL });
(async () => {
  const auth = getAuth();
  const user = await auth.getUserByEmail(email.toLowerCase());
  await auth.setCustomUserClaims(user.uid, { ...(user.customClaims || {}), role: 'admin' });
  await auth.revokeRefreshTokens(user.uid);
  console.log(`Peran admin diberikan ke ${email}. Keluar lalu masuk kembali agar klaim baru dimuat.`);
  process.exit(0);
})().catch(error => { console.error(error.message); process.exit(1); });
