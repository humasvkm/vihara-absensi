'use client';
import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [metode, setMetode] = useState('cari');
  const [nama, setNama] = useState('');
  const [daftarUmat, setDaftarUmat] = useState([]);
  const [kegiatanHariIni, setKegiatanHariIni] = useState(null);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState(''); // 'success' | 'error' | ''
  const [loadingId, setLoadingId] = useState(null);
  const [hadirSet, setHadirSet] = useState(new Set());
  const [qrInput, setQrInput] = useState('');
  const [loadingQr, setLoadingQr] = useState(false);
  const qrInputRef = useRef(null);

  useEffect(() => { muatDataAwal(); }, []);

  useEffect(() => {
    if (metode === 'scan' && qrInputRef.current) qrInputRef.current.focus();
  }, [metode]);

  const muatDataAwal = async () => {
    try {
      const resKeg = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getKegiatanHariIni' })
      });
      const kegData = await resKeg.json();
      if (kegData.success && kegData.data) setKegiatanHariIni(kegData.data);

      const resUmat = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getDaftarUmat' })
      });
      const umatData = await resUmat.json();
      if (umatData.success) setDaftarUmat(umatData.data || []);
    } catch (error) {
      console.error('Gagal memuat data awal:', error);
    }
  };

  const umatTersaring = nama.length >= 2
    ? daftarUmat.filter(u => u.nama.toLowerCase().includes(nama.toLowerCase())).slice(0, 10)
    : [];

  // === ABSEN 1-TAP DARI KARTU NAMA ===
  const handleHadir = async (umat) => {
    if (!kegiatanHariIni || !kegiatanHariIni.valid) {
      setStatus('⚠️ Tidak ada kegiatan aktif hari ini.');
      setStatusType('error');
      return;
    }
    if (hadirSet.has(umat.id)) return; // cegah double klik

    setLoadingId(umat.id);
    setStatus('');
    setStatusType('');

    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simpanAbsensi',
          data: {
            idUmat: umat.id,
            nama: umat.nama,
            noWa: umat.noWa || '',
            idKegiatan: kegiatanHariIni.id,
            namaKegiatan: kegiatanHariIni.nama,
            metode: 'Manual_Input'
          }
        })
      });
      const result = await response.json();

      if (result.success) {
        setHadirSet(prev => new Set(prev).add(umat.id));
        setStatus('✅ ' + result.message);
        setStatusType('success');
      } else {
        // Jika ternyata sudah absen (dari sesi/hari sebelumnya), kunci juga kartunya
        if (result.message && result.message.toLowerCase().includes('sudah')) {
          setHadirSet(prev => new Set(prev).add(umat.id));
        }
        setStatus('❌ ' + result.message);
        setStatusType('error');
      }
    } catch (error) {
      setStatus('❌ Koneksi tidak stabil. Silakan coba lagi.');
      setStatusType('error');
    } finally {
      setLoadingId(null);
    }
  };

  // === ABSEN VIA QR ===
  const handleQrSubmit = async (e) => {
    e.preventDefault();
    const idScan = qrInput.trim();
    if (!idScan) {
      setStatus('⚠️ Silakan scan QR Code atau masukkan ID Umat.');
      setStatusType('error');
      return;
    }
    if (!kegiatanHariIni || !kegiatanHariIni.valid) {
      setStatus('⚠️ Tidak ada kegiatan aktif hari ini.');
      setStatusType('error');
      return;
    }

    setLoadingQr(true);
    setStatus('Memverifikasi ID... 🙏');
    setStatusType('');

    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'prosesCheckinQR', data: { idUmatScan: idScan } })
      });
      const result = await response.json();

      if (result.success) {
        setStatus('✅ ' + result.message);
        setStatusType('success');
        setQrInput('');
        if (qrInputRef.current) qrInputRef.current.focus();
      } else {
        setStatus('❌ ' + result.message);
        setStatusType('error');
      }
    } catch (error) {
      setStatus('❌ Koneksi tidak stabil. Silakan coba lagi.');
      setStatusType('error');
    } finally {
      setLoadingQr(false);
    }
  };

  return (
    <main style={styles.container}>
      <div style={styles.card}>
        {/* Header Hijau Sage */}
        <div style={styles.header}>
          <img
            src="https://lh3.googleusercontent.com/d/1XAFp_h5DcJzjLW63Wq0oiQfGGHSL18sG=s0"
            alt="Logo Dharma Chakra"
            style={styles.logo}
          />
          <h1 style={styles.headerTitle}>Absensi Kehadiran</h1>
          <p style={styles.headerSubtitle}>Vihara Karuna Mukti, Bandung</p>
        </div>

        <div style={styles.body}>
          {/* Info Kegiatan Hari Ini */}
          <div style={styles.infoBox}>
            <div style={styles.infoLabel}>📅 KEGIATAN HARI INI</div>
            {kegiatanHariIni && kegiatanHariIni.valid ? (
              <>
                <div style={styles.infoNama}>{kegiatanHariIni.nama}</div>
                <div style={styles.infoDetail}>{kegiatanHariIni.tanggal} | {kegiatanHariIni.waktu}</div>
              </>
            ) : (
              <>
                <div style={styles.infoNama}>🧘‍♂️ Tidak Ada Kegiatan Rutin</div>
                <div style={styles.infoDetail}>Nikmati hari Anda dengan tenang.</div>
                <div style={styles.infoJadwal}>🗓️ Jadwal Rutin: Minggu (09:00 - Puja Bakti) & Rabu (18:00 - Meditasi)</div>
              </>
            )}
          </div>

          {/* Toggle Metode */}
          <div style={styles.toggleContainer}>
            <button
              onClick={() => { setMetode('cari'); setStatus(''); setStatusType(''); }}
              style={metode === 'cari' ? styles.toggleActive : styles.toggle}
            >
              🔍 Cari Nama
            </button>
            <button
              onClick={() => { setMetode('scan'); setStatus(''); setStatusType(''); setQrInput(''); }}
              style={metode === 'scan' ? styles.toggleActive : styles.toggle}
            >
              📷 Scan QR
            </button>
          </div>

          {/* KONTEN: CARI NAMA */}
          {metode === 'cari' && (
            <div style={styles.section}>
              <input
                type="text"
                value={nama}
                onChange={(e) => { setNama(e.target.value); setStatus(''); setStatusType(''); }}
                placeholder="Ketik minimal 2 huruf untuk mencari..."
                style={styles.input}
                autoFocus
              />

              {/* Hasil Pencarian: Kartu + Tombol HADIR */}
              {umatTersaring.length > 0 && (
                <div style={styles.resultList}>
                  {umatTersaring.map((u) => {
                    const sudahHadir = hadirSet.has(u.id);
                    const isLoading = loadingId === u.id;
                    return (
                      <div key={u.id} style={sudahHadir ? styles.resultCardHadir : styles.resultCard}>
                        <div style={styles.resultInfo}>
                          <div style={styles.resultNama}>{u.nama}</div>
                          <div style={styles.resultId}>{u.id}</div>
                        </div>
                        {sudahHadir ? (
                          <span style={styles.badgeHadir}>✓ HADIR</span>
                        ) : (
                          <button
                            onClick={() => handleHadir(u)}
                            disabled={isLoading}
                            style={isLoading ? styles.btnHadirDisabled : styles.btnHadir}
                          >
                            {isLoading ? '...' : 'HADIR'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {nama.length >= 2 && umatTersaring.length === 0 && (
                <p style={styles.noResult}>
                  Nama tidak ditemukan. Silakan <strong>Daftar Umat Baru</strong> di bawah.
                </p>
              )}

              {nama.length < 2 && (
                <p style={styles.hint}>Ketik minimal 2 huruf untuk menampilkan daftar nama</p>
              )}
            </div>
          )}

          {/* KONTEN: SCAN QR */}
          {metode === 'scan' && (
            <div style={styles.section}>
              <form onSubmit={handleQrSubmit}>
                <input
                  ref={qrInputRef}
                  type="text"
                  value={qrInput}
                  onChange={(e) => { setQrInput(e.target.value); setStatus(''); setStatusType(''); }}
                  placeholder="Arahkan scanner QR ke ID Umat..."
                  style={styles.input}
                  autoFocus
                />
                <p style={styles.hint}>Gunakan QR Scanner atau masukkan ID Umat secara manual</p>
                <button
                  type="submit"
                  disabled={loadingQr || !qrInput.trim()}
                  style={(loadingQr || !qrInput.trim()) ? styles.buttonDisabled : styles.button}
                >
                  {loadingQr ? 'Memverifikasi...' : '📷 Check-in via QR'}
                </button>
              </form>
            </div>
          )}

          {/* Status Banner */}
          {status && (
            <div style={statusType === 'success' ? styles.successBanner : statusType === 'error' ? styles.errorBanner : styles.statusBox}>
              <p style={styles.status}>{status}</p>
            </div>
          )}

          {/* Garis Pemisah */}
          <div style={styles.divider} />

          {/* Tombol Daftar Umat Baru (tema emas sesuai screenshot) */}
          <a href="/daftar" style={styles.daftarLink}>
            👤+ Daftar Umat Baru
          </a>

          {/* Footer Kutipan */}
          <div style={styles.footer}>
            <p style={styles.footerQuote}>"Appamādo amatapada"</p>
            <p style={styles.footerText}>Kewaspadaan adalah jalan menuju keabadian.</p>
          </div>
        </div>
      </div>
    </main>
  );
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#F4F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '16px', maxWidth: '520px', width: '100%', boxShadow: '0 4px 20px rgba(91, 112, 96, 0.15)', overflow: 'hidden' },
  header: { backgroundColor: '#5B7060', padding: '32px 24px', textAlign: 'center' },
  logo: { width: '80px', height: '80px', marginBottom: '16px', filter: 'brightness(0) invert(1)' },
  headerTitle: { color: '#FFFFFF', fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' },
  headerSubtitle: { color: '#D4E0D8', fontSize: '15px', margin: 0, fontStyle: 'italic' },
  body: { padding: '24px' },
  infoBox: { backgroundColor: '#FDF6E3', border: '2px solid #D4AF37', borderRadius: '12px', padding: '20px', marginBottom: '24px' },
  infoLabel: { color: '#8A7A5A', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', marginBottom: '8px' },
  infoNama: { color: '#5B7060', fontSize: '24px', fontWeight: '700', marginBottom: '4px' },
  infoDetail: { color: '#5B7060', fontSize: '15px', fontWeight: '500' },
  infoJadwal: { color: '#8A9A90', fontSize: '13px', marginTop: '8px', fontStyle: 'italic' },
  toggleContainer: { display: 'flex', gap: '8px', marginBottom: '24px', backgroundColor: '#F0F4F1', borderRadius: '12px', padding: '4px' },
  toggle: { flex: 1, padding: '14px', backgroundColor: 'transparent', color: '#5B7060', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: '600' },
  toggleActive: { flex: 1, padding: '14px', backgroundColor: '#5B7060', color: '#FFFFFF', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: '600', boxShadow: '0 2px 8px rgba(91, 112, 96, 0.3)' },
  section: { marginBottom: '20px' },
  input: { width: '100%', padding: '16px', fontSize: '16px', border: '2px solid #E8DFC8', borderRadius: '12px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FDF8EE', fontFamily: 'inherit', color: '#3D4A42' },
  hint: { color: '#8A9A90', fontSize: '13px', marginTop: '8px', marginBottom: 0 },
  noResult: { color: '#8A9A90', fontSize: '14px', fontStyle: 'italic', marginTop: '12px', textAlign: 'center' },

  // === KARTU HASIL + TOMBOL HADIR ===
  resultList: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' },
  resultCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '14px 16px', backgroundColor: '#FDF8EE', border: '2px solid #E8DFC8', borderRadius: '12px' },
  resultCardHadir: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '14px 16px', backgroundColor: '#E8F5E9', border: '2px solid #5B7060', borderRadius: '12px' },
  resultInfo: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
  resultNama: { color: '#3D4A42', fontSize: '16px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  resultId: { color: '#8A9A90', fontSize: '13px' },
  btnHadir: { padding: '12px 22px', backgroundColor: '#5B7060', color: '#FFFFFF', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '800', letterSpacing: '0.5px', boxShadow: '0 2px 6px rgba(91, 112, 96, 0.35)', flexShrink: 0 },
  btnHadirDisabled: { padding: '12px 22px', backgroundColor: '#A8B5AD', color: '#FFFFFF', border: 'none', borderRadius: '10px', cursor: 'wait', fontSize: '14px', fontWeight: '800', flexShrink: 0 },
  badgeHadir: { padding: '12px 18px', backgroundColor: '#5B7060', color: '#FFFFFF', borderRadius: '10px', fontSize: '14px', fontWeight: '800', letterSpacing: '0.5px', flexShrink: 0 },

  button: { width: '100%', padding: '18px', fontSize: '17px', fontWeight: '700', color: '#FFFFFF', backgroundColor: '#5B7060', border: 'none', borderRadius: '12px', cursor: 'pointer', marginTop: '8px' },
  buttonDisabled: { width: '100%', padding: '18px', fontSize: '17px', fontWeight: '700', color: '#FFFFFF', backgroundColor: '#A8B5AD', border: 'none', borderRadius: '12px', cursor: 'not-allowed', marginTop: '8px' },
  successBanner: { backgroundColor: '#E8F5E9', borderLeft: '4px solid #2E7D32', borderRadius: '10px', padding: '14px', marginTop: '16px' },
  errorBanner: { backgroundColor: '#FFEBEE', borderLeft: '4px solid #C0392B', borderRadius: '10px', padding: '14px', marginTop: '16px' },
  statusBox: { backgroundColor: '#F0F4F1', borderRadius: '10px', padding: '14px', marginTop: '16px', borderLeft: '4px solid #D4AF37' },
  status: { margin: 0, fontSize: '15px', fontWeight: '500', color: '#5B7060', lineHeight: '1.5', textAlign: 'center' },
  divider: { height: '1px', backgroundColor: '#E8ECE9', margin: '24px 0' },
  daftarLink: { display: 'block', width: '100%', padding: '18px', fontSize: '17px', fontWeight: '700', color: '#8B6914', backgroundColor: '#FDF8EE', border: '2px solid #D4AF37', borderRadius: '12px', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' },
  footer: { textAlign: 'center', paddingTop: '20px', marginTop: '24px', borderTop: '1px solid #E8ECE9' },
  footerQuote: { color: '#8A9A90', fontSize: '14px', fontStyle: 'italic', margin: '0 0 4px 0' },
  footerText: { color: '#8A9A90', fontSize: '13px', margin: 0 }
};
