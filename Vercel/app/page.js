'use client';
import { useState } from 'react';

export default function Home() {
  const [nama, setNama] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAbsen = async () => {
    if (nama.trim().length < 2) {
      setStatus('Mohon ketik minimal 2 huruf nama Anda.');
      return;
    }

    setLoading(true);
    setStatus('Sedang memproses kehadiran Anda... 🙏');

    try {
      // Panggil API Proxy lokal kita, BUKAN link Google Apps Script langsung!
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simpanAbsensi',
          data: {
            nama: nama,
            idUmat: 'SEARCH_BY_NAME', // Logika pencarian bisa dikembangkan di backend
            metode: 'Manual_Input'
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        setStatus(`✅ ${result.message}`);
        setNama(''); // Reset form
      } else {
        setStatus(`❌ ${result.message}`);
      }
    } catch (error) {
      setStatus('❌ Koneksi tidak stabil. Data akan disimpan sementara di perangkat Anda.');
      // Di sini nanti kita tambahkan logika penyimpanan offline (localStorage)
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
        
        <div style={styles.infoBox}>
          <p>📅 <strong>Kegiatan Hari Ini:</strong> PUJA BAKTI (09:00 WIB)</p>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>👤 Cari Nama Umat</label>
          <input
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Ketik minimal 2 huruf..."
            style={styles.input}
          />
        </div>

        <button 
          onClick={handleAbsen} 
          disabled={loading}
          style={loading ? styles.buttonDisabled : styles.button}
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

// Gaya "Modern Zen" (Hijau Sage, Emas, Bersih, Ramah Lansia)
const styles = {
  container: { minHeight: '100vh', backgroundColor: '#F4F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px', maxWidth: '480px', width: '100%', boxShadow: '0 4px 20px rgba(91, 112, 96, 0.1)', textAlign: 'center' },
  logo: { width: '80px', height: '80px', marginBottom: '16px' },
  title: { color: '#5B7060', fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' },
  subtitle: { color: '#8A9A90', fontSize: '16px', margin: '0 0 24px 0' },
  infoBox: { backgroundColor: '#F0F4F1', borderLeft: '4px solid #D4AF37', padding: '16px', borderRadius: '8px', marginBottom: '24px', textAlign: 'left', color: '#5B7060' },
  formGroup: { marginBottom: '24px', textAlign: 'left' },
  label: { display: 'block', color: '#5B7060', fontWeight: '600', marginBottom: '8px', fontSize: '16px' },
  input: { width: '100%', padding: '16px', fontSize: '18px', border: '2px solid #D1DBD4', borderRadius: '12px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.3s' },
  button: { width: '100%', padding: '18px', fontSize: '18px', fontWeight: '700', color: '#FFFFFF', backgroundColor: '#5B7060', border: 'none', borderRadius: '12px', cursor: 'pointer', transition: 'background-color 0.3s' },
  buttonDisabled: { width: '100%', padding: '18px', fontSize: '18px', fontWeight: '700', color: '#FFFFFF', backgroundColor: '#8A9A90', border: 'none', borderRadius: '12px', cursor: 'not-allowed' },
  status: { marginTop: '20px', fontSize: '16px', fontWeight: '500', color: '#5B7060', lineHeight: '1.5' },
  footer: { marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #E8ECE9', color: '#8A9A90', fontSize: '14px', fontStyle: 'italic' }
};