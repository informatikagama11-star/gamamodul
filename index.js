const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase } = require('firebase-admin/database');

initializeApp(); // Mengikuti project Firebase yang dipilih saat firebase deploy.

function requireAdmin(request) {
  if (!request.auth || request.auth.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Hanya admin sekolah yang boleh melakukan tindakan ini.');
  }
}
function requiredString(value, label, max = 160) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new HttpsError('invalid-argument', `${label} wajib diisi dan maksimal ${max} karakter.`);
  }
  return value.trim();
}

exports.createTeacherAccount = onCall({ region: 'asia-southeast1', enforceAppCheck: false }, async (request) => {
  requireAdmin(request);
  const name = requiredString(request.data?.name, 'Nama guru');
  const email = requiredString(request.data?.email, 'Email', 254).toLowerCase();
  const password = requiredString(request.data?.password, 'Password', 128);
  const niy = requiredString(request.data?.niy, 'NIY', 40);
  const subject = requiredString(request.data?.subject, 'Mata pelajaran', 100);
  const classRoom = requiredString(request.data?.classRoom, 'Kelas/fase', 100);
  const assignment = typeof request.data?.assignment === 'string' ? request.data.assignment.trim().slice(0, 500) : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpsError('invalid-argument', 'Format email tidak valid.');
  if (password.length < 10) throw new HttpsError('invalid-argument', 'Password awal minimal 10 karakter.');

  let user;
  try {
    user = await getAuth().createUser({ email, password, displayName: name, disabled: false, emailVerified: false });
    await getAuth().setCustomUserClaims(user.uid, { role: 'teacher' });
    await getDatabase().ref(`teachers/${user.uid}`).set({
      uid: user.uid, name, email, niy, subject, classRoom, assignment,
      role: 'teacher', disabled: false, createdAt: Date.now(), createdBy: request.auth.uid
    });
    return { uid: user.uid, email, name };
  } catch (error) {
    if (user?.uid) {
      try { await getAuth().deleteUser(user.uid); } catch (_) {}
    }
    if (error instanceof HttpsError) throw error;
    if (error.code === 'auth/email-already-exists') throw new HttpsError('already-exists', 'Email tersebut sudah digunakan.');
    console.error('createTeacherAccount failed', error);
    throw new HttpsError('internal', 'Akun guru gagal dibuat. Periksa konfigurasi Firebase Functions dan coba lagi.');
  }
});

exports.deleteTeacherAccount = onCall({ region: 'asia-southeast1', enforceAppCheck: false }, async (request) => {
  requireAdmin(request);
  const uid = requiredString(request.data?.uid, 'UID guru', 128);
  if (uid === request.auth.uid) throw new HttpsError('failed-precondition', 'Admin tidak dapat menghapus akunnya sendiri dari menu ini.');
  const userRecord = await getAuth().getUser(uid).catch(() => null);
  if (!userRecord) {
    await getDatabase().ref(`teachers/${uid}`).remove();
    return { uid, removedProfileOnly: true };
  }
  if (userRecord.customClaims?.role !== 'teacher') throw new HttpsError('failed-precondition', 'Akun ini tidak ditandai sebagai akun guru.');
  await getAuth().deleteUser(uid);
  await getDatabase().ref(`teachers/${uid}`).remove();
  return { uid, removed: true };
});
