'use client';
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function Home() {
  const [metode, setMetode] = useState('cari');
  const [nama, setNama] = useState('');
  const [daftarUmat, setDaftarUmat] = useState([]);
  const [kegiatanHariIni, setKegiatanHariIni] = useState(null);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('');
  const [loadingId, setLoadingId] = useState(null);
  const [hadirSet, setHadirSet] = useState(new Set());
  const [qrInput, setQrInput] = useState('');
  const [loadingQr, setLoadingQr] = useState(false);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraReady, setCameraReady] = useState(false); // kamera sudah benar-benar aktif
  const [scanCount, setScanCount] = useState(0);
  const [lastScan, setLastScan] = useState(null);
  
  const html5QrCodeRef = useRef(null);
  const isScanningRef = useRef(false);
  const namaInputRef = useRef(null);
  const qrInputRef = useRef(null);

  useEffect(() => { muatDataAwal(); }, []);

  useEffect(() => {
    if (metode === 'scan' && !cameraActive && qrInputRef.current) {
      qrInputRef.current.focus();
    }
  }, [metode, cameraActive]);

  // === PENTING: Mulai kamera HANYA setelah div #qr-reader di-render ===
  useEffect(() => {
    if (cameraActive && !cameraReady) {
      // Beri React waktu 100ms untuk me-render div #qr-reader
      const timer = setTimeout(() => {
        startCameraInternal();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [cameraActive, cameraReady]);

  // Stop kamera saat toggle berubah atau komponen unmount
  useEffect(() => {
    if (metode !== 'scan') {
      stopCameraInternal();
    }
    return () => { stopCameraInternal(); };
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

  const resetSetelahSukses = (delay = 1500) => {
    setTimeout(() => {
      setNama('');
      setStatus('');
      setStatusType('');
      setLoadingId(null);
      if (namaInputRef.current) namaInputRef.current.focus();
    }, delay);
  };

  const handleHadir = async (umat) => {
    if (!kegiatanHariIni || !kegiatanHariIni.valid) {
      setStatus('⚠️ Tidak ada kegiatan aktif hari ini.');
      setStatusType('error');
      return;
    }
    if (hadirSet.has(umat.id)) return;

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
        resetSetelahSukses();
      } else {
        if (result.message && result.message.toLowerCase().includes('sudah')) {
          setHadirSet(prev => new Set(prev).add(umat.id));
        }
        setStatus('❌ ' + result.message);
        setStatusType('error');
        setLoadingId(null);
      }
    } catch (error) {
      setStatus('❌ Koneksi tidak stabil. Silakan coba lagi.');
      setStatusType('error');
      setLoadingId(null);
    }
  };

  const processQrScan = async (idUmatScan, source = 'camera') => {
    if (isScanningRef.current) return;
    isScanningRef.current = true;

    if (!idUmatScan || !idUmatScan.trim()) {
      isScanningRef.current = false;
      return;
    }

    if (!kegiatanHariIni || !kegiatanHariIni.valid) {
      setStatus('⚠️ Tidak ada kegiatan aktif hari ini.');
      setStatusType('error');
      isScanningRef.current = false;
      return;
    }

    setLoadingQr(true);
    setStatus('Memverifikasi... 🙏');
    setStatusType('');

    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'prosesCheckinQR',
          data: { idUmatScan: idUmatScan.trim() }
        })
      });
      const result = await response.json();

      if (result.success) {
        setScanCount(prev => prev + 1);
        setLastScan({ nama: result.nama, id: idUmatScan.trim(), time: new Date() });
        setStatus('✅ ' + result.message);
        setStatusType('success');
        setQrInput('');
        
        setTimeout(() => {
          setStatus('');
          setStatusType('');
          isScanningRef.current = false;
          if (source === 'manual' && qrInputRef.current) {
            qrInputRef.current.focus();
          }
        }, 1500);
      } else {
        setStatus('❌ ' + result.message);
        setStatusType('error');
        setTimeout(() => { isScanningRef.current = false; }, 2000);
      }
    } catch (error) {
      setStatus('❌ Koneksi tidak stabil. Silakan coba lagi.');
      setStatusType('error');
      setTimeout(() => { isScanningRef.current = false; }, 2000);
    } finally {
      setLoadingQr(false);
    }
  };

  // === FUNGSI INTERNAL: Mulai kamera (dipanggil setelah div siap) ===
  const startCameraInternal = async () => {
    setCameraError('');
    try {
      // Cek apakah elemen sudah ada di DOM
      const readerElement = document.getElementById('qr-reader');
      if (!readerElement) {
        setCameraError('Elemen kamera belum siap. Silakan coba lagi.');
        setCameraActive(false);
        return;
      }

      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: { exact: 'environment' } }, // kamera belakang
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText) => {
          processQrScan(decodedText, 'camera');
        },
        () => { /* abaikan error parsing normal */ }
      );
      setCameraReady(true);
      setStatus('📷 Kamera aktif. Arahkan QR Code umat ke kamera.');
      setStatusType('');
    } catch (err) {
      // Fallback: jika 'exact' gagal, coba tanpa exact
      try {
        const html5QrCode = new Html5Qrcode('qr-reader');
        html5QrCodeRef.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          (decodedText) => { processQrScan(decodedText, 'camera'); },
          () => { /* ignore */ }
        );
        setCameraReady(true);
        setStatus('📷 Kamera aktif. Arahkan QR Code umat ke kamera.');
        setStatusType('');
      } catch (err2) {
        setCameraError('Tidak dapat mengakses kamera. Pastikan Anda memberikan izin kamera pada browser. (' + err2.message + ')');
        setCameraActive(false);
        setCameraReady(false);
      }
    }
  };

  // === FUNGSI INTERNAL: Stop kamera ===
  const stopCameraInternal = async () => {
    if (html5QrCodeRef.current && cameraReady) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) { /* ignore */ }
      html5QrCodeRef.current = null;
    }
    setCameraReady(false);
  };

  // === HANDLER TOMBOL: hanya ubah state ===
  const handleMulaiScan = () => {
    setCameraError('');
    setCameraActive(true);
    // useEffect akan memanggil startCameraInternal setelah div di-render
  };

  const handleStopScan = () => {
    stopCameraInternal();
    setCameraActive(false);
  };

  const handleQrManualSubmit = async (e) => {
    e.preventDefault();
    if (!qrInput.trim()) {
      setStatus('⚠️ Masukkan ID Umat terlebih dahulu.');
      setStatusType('error');
      return;
    }
    await processQrScan(qrInput, 'manual');
  };

  return (
    <main style={styles.container}>
      <div style={styles.card}>
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

          {metode === 'cari' && (
            <div style={styles.section}>
              <input
                ref={namaInputRef}
                type="text"
                value={nama}
                onChange={(e) => { setNama(e.target.value); setStatus(''); setStatusType(''); }}
                placeholder="Ketik minimal 2 huruf untuk mencari..."
                style={styles.input}
                autoFocus
              />

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

          {metode === 'scan' && (
            <div style={styles.section}>
              {scanCount > 0 && (
                <div style={styles.scanCounter}>
                  📊 <strong>{scanCount}</strong> umat telah check-in via QR pada sesi ini
                </div>
              )}

              {lastScan && (
                <div style={styles.lastScanCard}>
                  <div style={styles.lastScanInfo}>
                    <div style={styles.lastScanNama}>✅ {lastScan.nama}</div>
                    <div style={styles.lastScanId}>ID: {lastScan.id} • {lastScan.time.toLocaleTimeString('id-ID')}</div>
                  </div>
                </div>
              )}

              {/* Error kamera selalu tampil di atas area kamera */}
              {cameraError && (
                <div style={styles.errorBanner}>
                  <p style={styles.status}>⚠️ {cameraError}</p>
                </div>
              )}

              {/* Area Kamera */}
              {!cameraActive ? (
                <div style={styles.cameraPlaceholder}>
                  <div style={styles.cameraIcon}>📷</div>
                  <p style={styles.cameraText}>
                    Buka kamera HP untuk scan QR Code ID Umat.
                    <br />
                    <span style={{fontSize: '13px', color: '#8A9A90'}}>
                      Data tersimpan otomatis saat QR terdeteksi.
                    </span>
                  </p>
                  <button onClick={handleMulaiScan} style={styles.btnCamera}>
                    🎥 Mulai Scan dengan Kamera
                  </button>
                </div>
              ) : (
                <div style={styles.cameraWrapper}>
                  <div id="qr-reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }} />
                  {cameraReady && (
                    <div style={styles.cameraHint}>
                      🙏 Arahkan QR Code ID Umat ke kamera
                    </div>
                  )}
                  {!cameraReady && (
                    <div style={styles.cameraHintLoading}>
                      ⏳ Memulai kamera...
                    </div>
                  )}
                  <button onClick={handleStopScan} style={styles.btnStopCamera}>
                    ⏹️ Hentikan Kamera
                  </button>
                </div>
              )}

              {/* Fallback: Input Manual */}
              {!cameraActive && (
                <div style={styles.manualSection}>
                  <div style={styles.dividerText}>— atau masukkan ID manual —</div>
                  <form onSubmit={handleQrManualSubmit}>
                    <input
                      ref={qrInputRef}
                      type="text"
                      value={qrInput}
                      onChange={(e) => { setQrInput(e.target.value); setStatus(''); setStatusType(''); }}
                      placeholder="Contoh: VKM-001"
                      style={styles.input}
                    />
                    <p style={styles.hint}>
                      Tekan Enter untuk submit otomatis (cocok untuk scanner USB)
                    </p>
                    <button
                      type="submit"
                      disabled={loadingQr || !qrInput.trim()}
                      style={(loadingQr || !qrInput.trim()) ? styles.buttonDisabled : styles.button}
                    >
                      {loadingQr ? 'Memverifikasi...' : '✨ Check-in via ID'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {status && (
            <div style={statusType === 'success' ? styles.successBanner : statusType === 'error' ? styles.errorBanner : styles.statusBox}>
              <p style={styles.status}>{status}</p>
            </div>
          )}

          <div style={styles.divider} />

          <a href="/daftar" style={styles.daftarLink}>
            👤+ Daftar Umat Baru
          </a>

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
  footerText: { color: '#8A9A90', fontSize: '13px', margin: 0 },
  scanCounter: { backgroundColor: '#E8F5E9', border: '1px solid #5B7060', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', color: '#5B7060', fontSize: '14px', fontWeight: '600', textAlign: 'center' },
  lastScanCard: { backgroundColor: '#FDF8EE', border: '2px solid #D4AF37', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' },
  lastScanInfo: { display: 'flex', flexDirection: 'column', gap: '2px' },
  lastScanNama: { color: '#5B7060', fontSize: '16px', fontWeight: '700' },
  lastScanId: { color: '#8A9A90', fontSize: '13px' },
  cameraPlaceholder: { backgroundColor: '#F0F4F1', border: '2px dashed #5B7060', borderRadius: '12px', padding: '32px 20px', textAlign: 'center', marginBottom: '16px' },
  cameraIcon: { fontSize: '48px', marginBottom: '12px' },
  cameraText: { color: '#5B7060', fontSize: '15px', fontWeight: '600', marginBottom: '16px', lineHeight: '1.5' },
  btnCamera: { width: '100%', padding: '18px', fontSize: '17px', fontWeight: '700', color: '#FFFFFF', backgroundColor: '#5B7060', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(91, 112, 96, 0.3)' },
  cameraWrapper: { marginBottom: '16px' },
  cameraHint: { textAlign: 'center', color: '#5B7060', fontSize: '14px', fontWeight: '600', marginTop: '12px', marginBottom: '12px', padding: '10px', backgroundColor: '#E8F5E9', borderRadius: '8px' },
  cameraHintLoading: { textAlign: 'center', color: '#8A9A90', fontSize: '14px', fontWeight: '600', marginTop: '12px', marginBottom: '12px', padding: '10px', backgroundColor: '#F0F4F1', borderRadius: '8px' },
  btnStopCamera: { width: '100%', padding: '14px', fontSize: '15px', fontWeight: '600', color: '#C0392B', backgroundColor: '#FFFFFF', border: '2px solid #C0392B', borderRadius: '10px', cursor: 'pointer' },
  manualSection: { marginTop: '20px' },
  dividerText: { textAlign: 'center', color: '#8A9A90', fontSize: '13px', fontStyle: 'italic', marginBottom: '12px' }
};
