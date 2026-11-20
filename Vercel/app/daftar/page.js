'use client';
import { useState } from 'react';

export default function DaftarPage() {
  const [form, setForm] = useState({
    nama: '',
    tanggalLahir: '',
    alamat: '',
    kota: '',
    kodePos: '',
    jenisKelamin: '',
    noWa: ''
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [berhasil, setBerhasil] = useState(false);

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    setStatus('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.nama.trim()) {
      setStatus('⚠️ Nama lengkap wajib diisi.');
      return;
    }
    if (!form.jenisKelamin) {
      setStatus('⚠️ Silakan pilih jenis kelamin.');
      return;
    }
    if (!form.noWa.trim()) {
      setStatus('⚠️ Nomor WhatsApp/Telepon wajib diisi.');
      return;
    }

    setLoading(true);
    setStatus('Sedang memproses pendaftaran... 🙏');

    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'simpanPendaftaranUmat', data: form })
      });
      const result = await response.json();

      if (result.success) {
        setStatus('✅ ' + result.message);
        setBerhasil(true);
        setForm({ nama: '', tanggalLahir: '', alamat: '', kota: '', kodePos: '', jenisKelamin: '', noWa: '' });
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
        {/* Header Hijau Sage - Konsisten dengan halaman lain */}
        <div style={styles.header}>
          <img 
            src="https://lh3.googleusercontent.com/d/1XAFp_h5DcJzjLW63Wq0oiQfGGHSL18sG=s0" 
            alt="Logo Dharma Chakra" 
            style={styles.logo} 
          />
          <h1 style={styles.headerTitle}>Pendaftaran Umat</h1>
          <p style={styles.headerSubtitle}>Vihara Karuna Mukti, Bandung</p>
        </div>

        <div style={styles.body}>
          {/* Info Box */}
          <div style={styles.infoBox}>
            <p style={styles.infoText}>
              🙏 Selamat datang. Silakan isi formulir di bawah ini untuk mendaftarkan diri Anda sebagai umat Vihara Karuna Mukti.
            </p>
          </div>

          {berhasil ? (
            <div style={styles.successBox}>
              <p style={styles.successTitle}>✅ Pendaftaran Berhasil!</p>
              <p style={styles.successText}>
                Namo Buddhaya. Data Anda telah kami terima. Silakan kembali ke halaman absensi untuk melakukan check-in kehadiran.
              </p>
              <a href="/" style={styles.primaryLink}>← Kembali ke Halaman Absensi</a>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* 1. NAMA LENGKAP */}
              <div style={styles.formGroup}>
                <label style={styles.label}>👤 Nama Lengkap <span style={styles.required}>*</span></label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => handleChange('nama', e.target.value)}
                  placeholder="Contoh: Slamet Sentosa"
                  style={styles.input}
                  required
                />
              </div>

              {/* 2. TANGGAL LAHIR */}
              <div style={styles.formGroup}>
                <label style={styles.label}>🎂 Tanggal Lahir</label>
                <input
                  type="date"
                  value={form.tanggalLahir}
                  onChange={(e) => handleChange('tanggalLahir', e.target.value)}
                  style={styles.input}
                />
              </div>

              {/* 3. ALAMAT DOMISILI */}
              <div style={styles.formGroup}>
                <label style={styles.label}>📍 Alamat Domisili</label>
                <textarea
                  value={form.alamat}
                  onChange={(e) => handleChange('alamat', e.target.value)}
                  placeholder="Jl. ..."
                  rows="3"
                  style={styles.textarea}
                />
              </div>

              {/* 4. KOTA & KODE POS (berdampingan) */}
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>🏙️ Kota</label>
                  <input
                    type="text"
                    value={form.kota}
                    onChange={(e) => handleChange('kota', e.target.value)}
                    placeholder="Bandung"
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>📮 Kode Pos</label>
                  <input
                    type="text"
                    value={form.kodePos}
                    onChange={(e) => handleChange('kodePos', e.target.value)}
                    placeholder="40123"
                    style={styles.input}
                  />
                </div>
              </div>

              {/* 5. JENIS KELAMIN */}
              <div style={styles.formGroup}>
                <label style={styles.label}>⚧ Jenis Kelamin <span style={styles.required}>*</span></label>
                <div style={styles.genderRow}>
                  <label style={form.jenisKelamin === 'Laki-laki' ? styles.genderActive : styles.genderBtn}>
                    <input
                      type="radio"
                      name="jenisKelamin"
                      value="Laki-laki"
                      checked={form.jenisKelamin === 'Laki-laki'}
                      onChange={(e) => handleChange('jenisKelamin', e.target.value)}
                      style={styles.hiddenRadio}
                    />
                    <span>👨 Laki-laki</span>
                  </label>
                  <label style={form.jenisKelamin === 'Perempuan' ? styles.genderActive : styles.genderBtn}>
                    <input
                      type="radio"
                      name="jenisKelamin"
                      value="Perempuan"
                      checked={form.jenisKelamin === 'Perempuan'}
                      onChange={(e) => handleChange('jenisKelamin', e.target.value)}
                      style={styles.hiddenRadio}
                    />
                    <span>👩 Perempuan</span>
                  </label>
                </div>
              </div>

              {/* 6. NO. WA / TLP */}
              <div style={styles.formGroup}>
                <label style={styles.label}>📱 No. WA / TLP <span style={styles.required}>*</span></label>
                <input
                  type="tel"
                  value={form.noWa}
                  onChange={(e) => handleChange('noWa', e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  style={styles.input}
                  required
                />
                <p style={styles.hint}>Untuk informasi kegiatan Vihara</p>
              </div>

              {/* TOMBOL SUBMIT - Hijau Sage (konsisten) */}
              <button 
                type="submit" 
                disabled={loading}
                style={loading ? styles.buttonDisabled : styles.button}
              >
                {loading ? 'Memproses...' : '✨ Daftarkan Data'}
              </button>
            </form>
          )}

          {status && !berhasil && (
            <div style={styles.statusBox}>
              <p style={styles.status}>{status}</p>
            </div>
          )}

          <a href="/" style={styles.backLink}>← Kembali ke Halaman Absensi</a>

          <div style={styles.footer}>
            <p style={styles.footerQuote}>🙏 "Sabbe sattā bhavantu sukhitattā"</p>
            <p style={styles.footerText}>Semoga semua makhluk berbahagia.</p>
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
    maxWidth: '560px', 
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
    borderLeft: '4px solid #D4AF37',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px'
  },
  infoText: {
    color: '#5B7060',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: 0
  },
  formGroup: {
    marginBottom: '20px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  label: { 
    display: 'block', 
    color: '#5B7060', 
    fontWeight: '600', 
    marginBottom: '8px', 
    fontSize: '15px' 
  },
  required: {
    color: '#C0392B'
  },
  input: { 
    width: '100%', 
    padding: '14px', 
    fontSize: '16px', 
    border: '2px solid #D1DBD4', 
    borderRadius: '10px', 
    outline: 'none', 
    boxSizing: 'border-box',
    backgroundColor: '#FAFBFA',
    fontFamily: 'inherit',
    color: '#3D4A42'
  },
  textarea: {
    width: '100%', 
    padding: '14px', 
    fontSize: '16px', 
    border: '2px solid #D1DBD4', 
    borderRadius: '10px', 
    outline: 'none', 
    boxSizing: 'border-box',
    backgroundColor: '#FAFBFA',
    fontFamily: 'inherit',
    color: '#3D4A42',
    resize: 'vertical'
  },
  hint: {
    color: '#8A9A90',
    fontSize: '13px',
    marginTop: '6px',
    marginBottom: 0
  },
  genderRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  genderBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px',
    backgroundColor: '#FAFBFA',
    border: '2px solid #D1DBD4',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    color: '#5B7060',
    transition: 'all 0.2s'
  },
  genderActive: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px',
    backgroundColor: '#E8F0EB',
    border: '2px solid #5B7060',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '700',
    color: '#5B7060'
  },
  hiddenRadio: {
    display: 'none'
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
    marginTop: '8px',
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
    cursor: 'not-allowed',
    marginTop: '8px'
  },
  statusBox: {
    backgroundColor: '#F0F4F1',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '20px',
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
  successBox: {
    backgroundColor: '#E8F5E9',
    border: '2px solid #5B7060',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
    marginBottom: '24px'
  },
  successTitle: {
    color: '#5B7060',
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 12px 0'
  },
  successText: {
    color: '#5B7060',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 20px 0'
  },
  primaryLink: {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: '#5B7060',
    color: '#FFFFFF',
    borderRadius: '10px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '15px'
  },
  backLink: {
    display: 'block',
    textAlign: 'center',
    marginTop: '20px',
    color: '#5B7060',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '15px'
  },
  footer: {
    textAlign: 'center',
    paddingTop: '20px',
    marginTop: '24px',
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
