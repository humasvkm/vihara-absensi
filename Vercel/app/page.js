'use client';
import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [metode, setMetode] = useState('cari'); // 'cari' atau 'scan'
  const [nama, setNama] = useState('');
  const [daftarUmat, setDaftarUmat] = useState([]);
  const [umatTerpilih, setUmatTerpilih] = useState(null);
  const [kegiatanHariIni, setKegiatanHariIni] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const qrInputRef = useRef(null);

  // Muat data saat halaman dibuka
  useEffect(() => {
    muatDataAwal();
  }, []);

  // Auto-focus input QR saat metode berubah ke 'scan'
  useEffect(() => {
    if (metode === 'scan' && qrInputRef.current) {
      qrInputRef.current.focus();
    }
  }, [metode]);

  const muatDataAwal = async () => {
    try {
      const resKeg = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getKegiatanHariIni' })
      });
      const kegData = await resKeg.json();
      if (kegData.success && kegData.data) {
        setKegiatanHariIni(kegData.data);
      }

      const resUmat = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getDaftarUmat' })
      });
      const umatData = await resUmat.json();
      if (umatData.success) {
        setDaftarUmat(umatData.data || []);
      }
    } catch (error) {
      console.error('Gagal memuat data awal:', error);
    }
  };

  const umatTersaring = nama.length >= 2
    ? daftarUmat.filter(u => u.nama.toLowerCase().includes(nama.toLowerCase())).slice(0, 10)
    : [];

  const pilihUmat = (umat) => {
    setUmatTerpilih(umat);
    setNama(umat.nama);
    setShowDropdown(false);
    setStatus('');
  };

  const handleAbsenManual = async () => {
    if (!umatTerpilih) {
      setStatus('⚠️ Silakan pilih nama Anda dari daftar yang muncul.');
      return;
    }
    if (!kegiatanHariIni || !kegiatanHariIni.valid) {
      setStatus('⚠️ Tidak ada kegiatan aktif hari ini.');
      return;
    }

    setLoading(true);
    setStatus('Sedang memproses kehadiran Anda... 🙏');

    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simpanAbsensi',
          data: {
            idUmat: umatTerpilih.id,
            nama: umatTerpilih.nama,
            noWa: umatTerpilih.noWa || '',
            idKegiatan: kegiatanHariIni.id,
            namaKegiatan: kegiatanHariIni.nama,
            metode: 'Manual_Input'
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        setStatus('✅ ' + result.message);
        setNama('');
        setUmatTerpilih(null);
      } else {
        setStatus('❌ ' + result.message);
      }
    } catch (error) {
      setStatus('❌ Koneksi tidak stabil. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Handle input QR Code (dari scanner hardware atau input manual)
  const handleQrSubmit = async (e) => {
    e.preventDefault();
    const idScan = qrInput.trim();
    if (!idScan) {
      setStatus('⚠️ Silakan scan QR Code atau masukkan ID Umat.');
      return;
    }
    if (!kegiatanHariIni || !kegiatanHariIni.valid) {
      setStatus('⚠️ Tidak ada kegiatan aktif hari ini.');
      return;
    }

    setLoading(true);
    setStatus('Memverifikasi ID... 🙏');

    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'prosesCheckinQR',
          data: { idUmatScan: idScan }
        })
      });

      const result = await response.json();

      if (result.success) {
        setStatus('✅ ' + result.message);
        setQrInput('');
        if (qrInputRef.current) qrInputRef.current.focus();
      } else {
        setStatus('❌ ' + result.message);
      }
    } catch (error) {
      setStatus('❌ Koneksi tidak stabil. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.container}>
      <div style={styles.card}>
        {/* Header Hijau Sage Gelap */}
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

          {/* Toggle Metode Check-in */}
          <div style={styles.toggleContainer}>
            <button 
              onClick={() => { setMetode('cari'); setStatus(''); }}
              style={metode === 'cari' ? styles.toggleActive : styles.toggle}
            >
              🔍 Cari Nama
            </button>
            <button 
              onClick={() => { setMetode('scan'); setStatus(''); setQrInput(''); }}
              style={metode === 'scan' ? styles.toggleActive : styles.toggle}
            >
              📷 Scan QR
            </button>
          </div>

          {/* KONTEN: CARI NAMA */}
          {metode === 'cari' && (
            <div style={styles.section}>
              <label style={styles.label}>👤 Cari Nama Umat</label>
              <input
                type="text"
                value={nama}
                onChange={(e) => {
                  setNama(e.target.value);
                  setUmatTerpilih(null);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Ketik minimal 2 huruf untuk mencari..."
                style={styles.input}
              />
              <p style={styles.hint}>Ketik minimal 2 huruf untuk menampilkan daftar nama</p>

              {showDropdown && umatTersaring.length > 0 && (
                <ul style={styles.dropdown}>
                  {umatTersaring.map((u) => (
                    <li 
                      key={u.id} 
                      onClick={() => pilihUmat(u)}
                      style={styles.dropdownItem}
                    >
                      {u.nama} {u.kota ? <span style={{color: '#8A9A90', fontSize: '13px'}}>— {u.kota}</span> : ''}
                    </li>
                  ))}
                </ul>
              )}
              {showDropdown && nama.length >= 2 && umatTersaring.length === 0 && (
                <p style={styles.noResult}>Nama tidak ditemukan. Silakan daftar sebagai umat baru.</p>
              )}

              <button 
                onClick={handleAbsenManual} 
                disabled={loading || !umatTerpilih}
                style={(!umatTerpilih || loading) ? styles.buttonDisabled : styles.button}
              >
                {loading ? 'Memproses...' : '✨ Konfirmasi Kehadiran'}
              </button>
            </div>
          )}

          {/* KONTEN: SCAN QR */}
          {metode === 'scan' && (
            <div style={styles.section}>
              <label style={styles.label}>📱 Scan QR Code ID Umat</label>
              <form onSubmit={handleQrSubmit}>
                <input
                  ref={qrInputRef}
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="Arahkan scanner QR ke ID Umat..."
                  style={styles.input}
                  autoFocus
                />
                <p style={styles.hint}>Gunakan QR Scanner atau masukkan ID Umat secara manual</p>
                <button 
                  type="submit"
                  disabled={loading || !qrInput.trim()}
                  style={(!qrInput.trim() || loading) ? styles.buttonDisabled : styles.button}
                >
                  {loading ? 'Memverifikasi...' : '📷 Check-in via QR'}
                </button>
              </form>
            </div>
          )}

          {/* Status Message */}
          {status && (
            <div style={styles.statusBox}>
              <p style={styles.status}>{status}</p>
            </div>
          )}

          {/* Tombol Daftar Umat Baru */}
          <a href="/daftar" style={styles.daftarLink}>
            📝 Daftar Umat Baru
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
  container: { 
    minHeight: '100vh', 
    backgroundColor: '#F4F7F5', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: '20px', 
    fontFamily: 'system-ui, -apple-system, sans-serif' 
  },
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: '16px', 
    maxWidth: '520px', 
    width: '100%', 
    boxShadow: '0 4px 20px rgba(91, 112, 96, 0.15)', 
    overflow: 'hidden' 
  },
  header: {
    backgroundColor: '#5B7060',
    padding: '32px 24px',
    textAlign: 'center'
  },
  logo: { 
    width: '80px', 
    height: '80px', 
    marginBottom: '16px',
    filter: 'brightness(0) invert(1)'
  },
  headerTitle: { 
    color: '#FFFFFF', 
    fontSize: '28px', 
    fontWeight: '700', 
    margin: '0 0 8px 0' 
  },
  headerSubtitle: { 
    color: '#D4E0D8', 
    fontSize: '15px', 
    margin: 0,
    fontStyle: 'italic'
  },
  body: {
    padding: '24px'
  },
  infoBox: {
    backgroundColor: '#FDF6E3',
    border: '2px solid #D4AF37',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px'
  },
  infoLabel: {
    color: '#8A7A5A',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '1px',
    marginBottom: '8px'
  },
  infoNama: {
    color: '#5B7060',
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '4px'
  },
  infoDetail: {
    color: '#5B7060',
    fontSize: '15px',
    fontWeight: '500'
  },
  infoJadwal: {
    color: '#8A9A90',
    fontSize: '13px',
    marginTop: '8px',
    fontStyle: 'italic'
  },
  toggleContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    backgroundColor: '#F0F4F1',
    borderRadius: '12px',
    padding: '4px'
  },
  toggle: {
    flex: 1,
    padding: '14px',
    backgroundColor: 'transparent',
    color: '#5B7060',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  toggleActive: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#5B7060',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(91, 112, 96, 0.3)'
  },
  section: {
    marginBottom: '24px'
  },
  label: { 
    display: 'block', 
    color: '#5B7060', 
    fontWeight: '600', 
    marginBottom: '8px', 
    fontSize: '15px' 
  },
  input: { 
    width: '100%', 
    padding: '16px', 
    fontSize: '16px', 
    border: '2px solid #D1DBD4', 
    borderRadius: '10px', 
    outline: 'none', 
    boxSizing: 'border-box',
    backgroundColor: '#FAFBFA'
  },
  hint: {
    color: '#8A9A90',
    fontSize: '13px',
    marginTop: '6px',
    marginBottom: '16px'
  },
  dropdown: { 
    position: 'relative',
    backgroundColor: '#FFFFFF', 
    border: '2px solid #D1DBD4', 
    borderRadius: '10px', 
    marginTop: '4px', 
    maxHeight: '200px', 
    overflowY: 'auto', 
    listStyle: 'none', 
    padding: 0, 
    margin: '0 0 16px 0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 10
  },
  dropdownItem: { 
    padding: '12px 16px', 
    cursor: 'pointer', 
    borderBottom: '1px solid #F0F4F1', 
    fontSize: '15px' 
  },
  noResult: { 
    color: '#8A9A90', 
    fontSize: '14px', 
    fontStyle: 'italic',
    marginBottom: '16px'
  },
  button: { 
    width: '100%', 
    padding: '18px', 
    fontSize: '17px', 
    fontWeight: '700', 
    color: '#FFFFFF', 
    backgroundColor: '#5B7060', 
    border: 'none', 
    borderRadius: '12px', 
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  buttonDisabled: { 
    width: '100%', 
    padding: '18px', 
    fontSize: '17px', 
    fontWeight: '700', 
    color: '#FFFFFF', 
    backgroundColor: '#A8B5AD', 
    border: 'none', 
    borderRadius: '12px', 
    cursor: 'not-allowed' 
  },
  statusBox: {
    backgroundColor: '#F0F4F1',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    borderLeft: '4px solid #D4AF37'
  },
  status: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '500',
    color: '#5B7060',
    lineHeight: '1.5',
    textAlign: 'center'
  },
  daftarLink: {
    display: 'block',
    width: '100%',
    padding: '18px',
    fontSize: '17px',
    fontWeight: '700',
    color: '#5B7060',
    backgroundColor: '#F0F4F1',
    border: '2px solid #5B7060',
    borderRadius: '12px',
    textAlign: 'center',
    textDecoration: 'none',
    marginBottom: '24px',
    boxSizing: 'border-box'
  },
  footer: {
    textAlign: 'center',
    paddingTop: '20px',
    borderTop: '1px solid #E8ECE9'
  },
  footerQuote: {
    color: '#8A9A90',
    fontSize: '14px',
    fontStyle: 'italic',
    margin: '0 0 4px 0'
  },
  footerText: {
    color: '#8A9A90',
    fontSize: '13px',
    margin: 0
  }
};
