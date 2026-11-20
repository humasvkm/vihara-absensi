'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [nama, setNama] = useState('');
  const [daftarUmat, setDaftarUmat] = useState([]);
  const [umatTerpilih, setUmatTerpilih] = useState(null);
  const [kegiatanHariIni, setKegiatanHariIni] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Muat data kegiatan & daftar umat saat halaman dibuka
  useEffect(() => {
    muatDataAwal();
  }, []);

  const muatDataAwal = async () => {
    try {
      // Muat kegiatan hari ini
      const resKeg = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getKegiatanHariIni' })
      });
      const kegData = await resKeg.json();
      if (kegData.success && kegData.data) {
        setKegiatanHariIni(kegData.data);
      }

      // Muat daftar umat
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

  // Filter daftar umat berdasarkan input (minimal 2 huruf)
  const umatTersaring = nama.length >= 2
    ? daftarUmat.filter(u => u.nama.toLowerCase().includes(nama.toLowerCase())).slice(0, 10)
    : [];

  const pilihUmat = (umat) => {
    setUmatTerpilih(umat);
    setNama(umat.nama);
    setShowDropdown(false);
    setStatus('');
  };

  const handleAbsen = async () => {
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

  return (
    <main style={styles.container}>
      <div style={styles.card}>
        <img 
          src="https://lh3.googleusercontent.com/d/1XAFp_h5DcJzjLW63Wq0oiQfGGHSL18sG=s0" 
          alt="Logo Dharma Chakra" 
          style={styles.logo} 
        />
        <h1 style={styles.title}>Absensi Kehadiran</h1>
        <p style={styles.subtitle}>Vihara Karuna Mukti, Bandung</p>
        
        {/* Info Kegiatan Hari Ini */}
        <div style={styles.infoBox}>
          {kegiatanHariIni && kegiatanHariIni.valid ? (
            <p>📅 <strong>Kegiatan Hari Ini:</strong> {kegiatanHariIni.nama} ({kegiatanHariIni.waktu})</p>
          ) : (
            <div>
              <p>🧘‍♂️ <strong>Hari Ini Tidak Ada Kegiatan Rutin</strong></p>
              <p style={{fontSize: '14px', marginTop: '8px'}}>Nikmati hari Anda dengan tenang.</p>
              <p style={{fontSize: '13px', marginTop: '8px', color: '#8A9A90'}}>
                🗓️ Jadwal Rutin: Minggu (09:00 - Puja Bakti) & Rabu (18:00 - Meditasi)
              </p>
            </div>
          )}
        </div>

        {/* Form Pencarian Nama */}
        <div style={styles.formGroup}>
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
            placeholder="Ketik minimal 2 huruf..."
            style={styles.input}
          />
          
          {/* Dropdown Hasil Pencarian */}
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
        </div>

        {/* Tombol Absen */}
        <button 
          onClick={handleAbsen} 
          disabled={loading || !umatTerpilih}
          style={(!umatTerpilih || loading) ? styles.buttonDisabled : styles.button}
        >
          {loading ? 'Memproses...' : '✨ Konfirmasi Kehadiran'}
        </button>

        {status && <p style={styles.status}>{status}</p>}

        <div style={styles.footer}>
          <p>"Appamādo amatapada"<br/>Kewaspadaan adalah jalan menuju keabadian.</p>
        </div>
      </div>
    </main>
  );
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#F4F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px', maxWidth: '480px', width: '100%', boxShadow: '0 4px 20px rgba(91, 112, 96, 0.1)', textAlign: 'center' },
  logo: { width: '80px', height: '80px', marginBottom: '16px' },
  title: { color: '#5B7060', fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' },
  subtitle: { color: '#8A9A90', fontSize: '16px', margin: '0 0 24px 0' },
  infoBox: { backgroundColor: '#F0F4F1', borderLeft: '4px solid #D4AF37', padding: '16px', borderRadius: '8px', marginBottom: '24px', textAlign: 'left', color: '#5B7060' },
  formGroup: { marginBottom: '24px', textAlign: 'left', position: 'relative' },
  label: { display: 'block', color: '#5B7060', fontWeight: '600', marginBottom: '8px', fontSize: '16px' },
  input: { width: '100%', padding: '16px', fontSize: '18px', border: '2px solid #D1DBD4', borderRadius: '12px', outline: 'none', boxSizing: 'border-box' },
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#FFFFFF', border: '2px solid #D1DBD4', borderRadius: '12px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', listStyle: 'none', padding: 0, margin: 0, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  dropdownItem: { padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #F0F4F1', fontSize: '16px' },
  noResult: { color: '#8A9A90', fontSize: '14px', marginTop: '8px', fontStyle: 'italic' },
  button: { width: '100%', padding: '18px', fontSize: '18px', fontWeight: '700', color: '#FFFFFF', backgroundColor: '#5B7060', border: 'none', borderRadius: '12px', cursor: 'pointer', marginTop: '8px' },
  buttonDisabled: { width: '100%', padding: '18px', fontSize: '18px', fontWeight: '700', color: '#FFFFFF', backgroundColor: '#A8B5AD', border: 'none', borderRadius: '12px', cursor: 'not-allowed', marginTop: '8px' },
  status: { marginTop: '20px', fontSize: '16px', fontWeight: '500', color: '#5B7060', lineHeight: '1.5' },
  footer: { marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #E8ECE9', color: '#8A9A90', fontSize: '14px', fontStyle: 'italic' }
};
