'use client';
import { useState, useRef, useEffect } from 'react';

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
  const [statusType, setStatusType] = useState(''); // 'success' | 'error' | ''
  const [loading, setLoading] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const formRef = useRef(null);

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    if (statusType === 'error') setStatus('');
  };

  // Scroll ke atas form setelah sukses
  useEffect(() => {
    if (statusType === 'success' && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [successCount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.nama.trim()) {
      setStatus('⚠️ Nama lengkap wajib diisi.');
      setStatusType('error');
      return;
    }
    if (!form.jenisKelamin) {
      setStatus('⚠️ Silakan pilih jenis kelamin.');
      setStatusType('error');
      return;
    }
    if (!form.noWa.trim()) {
      setStatus('⚠️ Nomor WhatsApp/Telepon wajib diisi.');
      setStatusType('error');
      return;
    }

    setLoading(true);
    setStatus('Sedang memproses pendaftaran... 🙏');
    setStatusType('');

    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'simpanPendaftaranUmat', data: form })
      });
      const result = await response.json();

      if (result.success) {
        setStatus('✅ Pendaftaran ' + form.nama + ' berhasil! ID: ' + (result.idUmat || '-') + '. Silakan isi data pendaftar berikutnya.');
        setStatusType('success');
        setSuccessCount(c => c + 1);
        // Reset form untuk pendaftar berikutnya
        setForm({ nama: '', tanggalLahir: '', alamat: '', kota: '', kodePos: '', jenisKelamin: '', noWa: '' });
      } else {
        setStatus('❌ ' + result.message);
        setStatusType('error');
      }
    } catch (error) {
      setStatus('❌ Koneksi tidak stabil. Silakan coba lagi.');
      setStatusType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.container}>
      <div style={styles.card}>
        {/* Header Hijau Sage - Konsisten */}
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
              🙏 Selamat datang. Silakan isi formulir di bawah ini untuk mendaftarkan diri sebagai umat Vihara Karuna Mukti.
            </p>
          </div>

          {/* Counter Pendaftar Hari Ini */}
          {successCount > 0 && (
            <div style={styles.counterBox}>
              📊 <strong>{successCount}</strong> pendaftar berhasil didaftarkan pada sesi ini
            </div>
          )}

          {/* Pesan Sukses / Error */}
          {status && (
            <div style={statusType === 'success' ? styles.successBanner : statusType === 'error' ? styles.errorBanner : styles.statusBox}>
              <p style={styles.status}>{status}</p>
            </div>
          )}

          {/* Form - SELALU TERLIHAT */}
          <form onSubmit={handleSubmit} ref={formRef}>
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
                autoFocus
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

            {/* 4. KOTA & KODE POS */}
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

            {/* TOMBOL SUBMIT */}
            <button 
              type="submit" 
              disabled={loading}
              style={loading ? styles.buttonDisabled : styles.button}
            >
              {loading ? 'Memproses...' : '✨ Daftarkan Data'}
            </button>
          </form>

          {/* Link Kembali ke Absensi */}
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
    marginBottom: '20px'
  },
  infoText: {
    color: '#5B7060',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: 0
  },
  counterBox: {
    backgroundColor: '#E8F5E9',
    border: '1px solid #5B7060',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '16px',
    color: '#5B7060',
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'center'
  },
  successBanner: {
    backgroundColor: '#E8F5E9',
    borderLeft: '4px solid #2E7D32',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '20px'
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    borderLeft: '4px solid #C0392B',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '20px'
  },
  statusBox: {
    backgroundColor: '#F0F4F1',
    borderRadius: '10px',
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
