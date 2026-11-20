'use client';
import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [activeTab, setActiveTab] = useState('kegiatan'); // 'kegiatan' atau 'statistik'
  
  // Data kegiatan
  const [kegiatanList, setKegiatanList] = useState([]);
  const [loadingKegiatan, setLoadingKegiatan] = useState(false);
  
  // Form aktivasi
  const [selectedKegiatan, setSelectedKegiatan] = useState('');
  const [customNama, setCustomNama] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [waktuMulai, setWaktuMulai] = useState('');
  const [waktuSelesai, setWaktuSelesai] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Statistik
  const [statistik, setStatistik] = useState(null);
  const [loadingStatistik, setLoadingStatistik] = useState(false);

  // PIN default: 123456 (bisa diganti nanti)
  const ADMIN_PIN = '123456';

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('PIN salah. Silakan coba lagi.');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      muatKegiatan();
    }
  }, [isAuthenticated]);

  const muatKegiatan = async () => {
    setLoadingKegiatan(true);
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getAllKegiatan' })
      });
      const data = await res.json();
      if (data.success) {
        setKegiatanList(data.data || []);
      }
    } catch (error) {
      console.error('Gagal memuat kegiatan:', error);
    } finally {
      setLoadingKegiatan(false);
    }
  };

  const handleAktifkan = async (e) => {
    e.preventDefault();
    if (!selectedKegiatan || !tanggal) {
      setStatusMsg('⚠️ Pilih kegiatan dan tanggal terlebih dahulu.');
      return;
    }
    if (selectedKegiatan === 'CUSTOM' && !customNama.trim()) {
      setStatusMsg('⚠️ Isi nama kegiatan baru.');
      return;
    }

    setLoading(true);
    setStatusMsg('Sedang memproses...');

    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'aktifkanKegiatan',
          data: {
            idKegiatan: selectedKegiatan,
            customNama: customNama,
            tanggal: tanggal,
            waktuMulai: waktuMulai,
            waktuSelesai: waktuSelesai
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg('✅ ' + data.message);
        // Reset form
        setSelectedKegiatan('');
        setCustomNama('');
        setWaktuMulai('');
        setWaktuSelesai('');
        muatKegiatan(); // Refresh daftar
      } else {
        setStatusMsg('❌ ' + data.message);
      }
    } catch (error) {
      setStatusMsg('❌ Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  const handleNonaktifkan = async (idKegiatan, tanggalKegiatan) => {
    if (!confirm('Yakin ingin menonaktifkan kegiatan ini?')) return;

    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'nonaktifkanKegiatan',
          data: { idKegiatan, tanggal: tanggalKegiatan }
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg('✅ Kegiatan berhasil dinonaktifkan.');
        muatKegiatan();
      } else {
        setStatusMsg('❌ ' + data.message);
      }
    } catch (error) {
      setStatusMsg('❌ Gagal terhubung ke server.');
    }
  };

  const muatStatistik = async () => {
    setLoadingStatistik(true);
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getStatistikKehadiran',
          data: { periode: 'bulan' }
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatistik(data);
      }
    } catch (error) {
      console.error('Gagal memuat statistik:', error);
    } finally {
      setLoadingStatistik(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === 'statistik') {
      muatStatistik();
    }
  }, [isAuthenticated, activeTab]);

  // === HALAMAN LOGIN PIN ===
  if (!isAuthenticated) {
    return (
      <main style={styles.container}>
        <div style={styles.card}>
          <img 
            src="https://lh3.googleusercontent.com/d/1XAFp_h5DcJzjLW63Wq0oiQfGGHSL18sG=s0" 
            alt="Logo" 
            style={styles.logo} 
          />
          <h1 style={styles.title}>Panel Panitia</h1>
          <p style={styles.subtitle}>Vihara Karuna Mukti, Bandung</p>
          
          <form onSubmit={handleLogin} style={styles.form}>
            <label style={styles.label}>🔐 Masukkan PIN Admin</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="6 digit PIN"
              maxLength="6"
              style={styles.input}
              autoFocus
            />
            {pinError && <p style={styles.error}>{pinError}</p>}
            <button type="submit" style={styles.button}>Masuk</button>
          </form>

          <p style={styles.hint}>PIN default: 123456</p>

          <a href="/" style={styles.link}>← Kembali ke Absensi</a>

          <div style={styles.footer}>
            <p>"Sappurisānaṃ santike vāso"<br/>Berada di dekat orang bijaksana adalah kebahagiaan.</p>
          </div>
        </div>
      </main>
    );
  }

  // === HALAMAN ADMIN UTAMA ===
  return (
    <main style={styles.container}>
      <div style={styles.cardWide}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Panel Panitia</h1>
            <p style={styles.subtitle}>Kelola Kegiatan Vihara Karuna Mukti</p>
          </div>
          <button onClick={() => setIsAuthenticated(false)} style={styles.logoutBtn}>🚪 Keluar</button>
        </div>

        {/* Tab Navigation */}
        <div style={styles.tabs}>
          <button 
            onClick={() => setActiveTab('kegiatan')}
            style={activeTab === 'kegiatan' ? styles.tabActive : styles.tab}
          >
            📋 Kegiatan
          </button>
          <button 
            onClick={() => setActiveTab('statistik')}
            style={activeTab === 'statistik' ? styles.tabActive : styles.tab}
          >
            📊 Statistik
          </button>
        </div>

        {/* TAB: KEGIATAN */}
        {activeTab === 'kegiatan' && (
          <div style={styles.tabContent}>
            {/* Daftar Kegiatan Aktif */}
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>📋 Daftar Kegiatan Aktif</h2>
              {loadingKegiatan ? (
                <p style={styles.loading}>Memuat data...</p>
              ) : kegiatanList.length === 0 ? (
                <p style={styles.empty}>Belum ada kegiatan aktif.</p>
              ) : (
                <div style={styles.list}>
                  {kegiatanList.map((k, idx) => (
                    <div key={idx} style={styles.listItem}>
                      <div style={styles.listItemInfo}>
                        <strong style={styles.listItemTitle}>{k.nama}</strong>
                        <span style={styles.listItemMeta}>
                          {k.id} • {k.tanggal} • {k.waktuMulai}-{k.waktuSelesai}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleNonaktifkan(k.id, k.tanggal)}
                        style={styles.btnNonaktif}
                      >
                        Nonaktifkan
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Form Aktivasi */}
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>➕ Aktifkan Kegiatan</h2>
              <form onSubmit={handleAktifkan} style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Pilih Kegiatan</label>
                  <select 
                    value={selectedKegiatan}
                    onChange={(e) => setSelectedKegiatan(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">-- Pilih Kegiatan --</option>
                    <option value="KGT-001">KGT-001 - PUJA BAKTI</option>
                    <option value="KGT-002">KGT-002 - MEDITASI</option>
                    <option value="KGT-003">KGT-003 - WAISAK</option>
                    <option value="KGT-004">KGT-004 - MAGHA PUJA</option>
                    <option value="KGT-005">KGT-005 - ASALHA PUJA (ASADHA)</option>
                    <option value="KGT-006">KGT-006 - KATHINA</option>
                    <option value="KGT-007">KGT-007 - PATTIDANA</option>
                    <option value="KGT-008">KGT-008 - WANDANI</option>
                    <option value="CUSTOM">✨ Lainnya (Kegiatan Baru)</option>
                  </select>
                </div>

                {selectedKegiatan === 'CUSTOM' && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Nama Kegiatan Baru</label>
                    <input
                      type="text"
                      value={customNama}
                      onChange={(e) => setCustomNama(e.target.value)}
                      placeholder="Contoh: Kelas Dhamma Remaja"
                      style={styles.input}
                    />
                  </div>
                )}

                <div style={styles.formGroup}>
                  <label style={styles.label}>📅 Tanggal</label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Waktu Mulai</label>
                    <input
                      type="time"
                      value={waktuMulai}
                      onChange={(e) => setWaktuMulai(e.target.value)}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Waktu Selesai</label>
                    <input
                      type="time"
                      value={waktuSelesai}
                      onChange={(e) => setWaktuSelesai(e.target.value)}
                      style={styles.input}
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} style={loading ? styles.buttonDisabled : styles.button}>
                  {loading ? 'Memproses...' : '✨ Aktifkan Kegiatan'}
                </button>
              </form>
            </section>

            {statusMsg && <p style={styles.status}>{statusMsg}</p>}
          </div>
        )}

        {/* TAB: STATISTIK */}
        {activeTab === 'statistik' && (
          <div style={styles.tabContent}>
            <h2 style={styles.sectionTitle}>📊 Statistik Kehadiran</h2>
            {loadingStatistik ? (
              <p style={styles.loading}>Memuat statistik...</p>
            ) : !statistik ? (
              <p style={styles.empty}>Belum ada data.</p>
            ) : (
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{statistik.totalUmat}</div>
                  <div style={styles.statLabel}>Total Umat Terdaftar</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{statistik.totalHadir}</div>
                  <div style={styles.statLabel}>Total Kehadiran</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{statistik.rate}%</div>
                  <div style={styles.statLabel}>Tingkat Kehadiran</div>
                </div>
              </div>
            )}
          </div>
        )}

        <a href="/" style={styles.link}>← Kembali ke Halaman Absensi</a>
      </div>
    </main>
  );
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#F4F7F5', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px', maxWidth: '480px', width: '100%', margin: '40px auto', boxShadow: '0 4px 20px rgba(91, 112, 96, 0.1)', textAlign: 'center' },
  cardWide: { backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px', maxWidth: '900px', width: '100%', margin: '20px auto', boxShadow: '0 4px 20px rgba(91, 112, 96, 0.1)' },
  logo: { width: '80px', height: '80px', marginBottom: '16px' },
  title: { color: '#5B7060', fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' },
  subtitle: { color: '#8A9A90', fontSize: '16px', margin: '0 0 24px 0' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
  logoutBtn: { padding: '10px 20px', backgroundColor: '#F0F4F1', color: '#5B7060', border: '2px solid #D1DBD4', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #E8ECE9', paddingBottom: '12px' },
  tab: { padding: '12px 24px', backgroundColor: 'transparent', color: '#8A9A90', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '600', borderRadius: '8px' },
  tabActive: { padding: '12px 24px', backgroundColor: '#5B7060', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '600', borderRadius: '8px' },
  tabContent: { },
  section: { marginBottom: '32px' },
  sectionTitle: { color: '#5B7060', fontSize: '20px', fontWeight: '700', marginBottom: '16px', borderBottom: '2px solid #D4AF37', paddingBottom: '8px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#F0F4F1', borderRadius: '12px', borderLeft: '4px solid #D4AF37', flexWrap: 'wrap', gap: '12px' },
  listItemInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  listItemTitle: { color: '#5B7060', fontSize: '16px' },
  listItemMeta: { color: '#8A9A90', fontSize: '13px' },
  btnNonaktif: { padding: '8px 16px', backgroundColor: '#FFFFFF', color: '#C0392B', border: '2px solid #C0392B', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' },
  formGrid: { display: 'flex', flexDirection: 'column', gap: '16px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { color: '#5B7060', fontWeight: '600', fontSize: '14px' },
  input: { padding: '14px', fontSize: '16px', border: '2px solid #D1DBD4', borderRadius: '10px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  select: { padding: '14px', fontSize: '16px', border: '2px solid #D1DBD4', borderRadius: '10px', outline: 'none', backgroundColor: '#FFFFFF', width: '100%', boxSizing: 'border-box' },
  button: { width: '100%', padding: '16px', fontSize: '16px', fontWeight: '700', color: '#FFFFFF', backgroundColor: '#5B7060', border: 'none', borderRadius: '12px', cursor: 'pointer', marginTop: '8px' },
  buttonDisabled: { width: '100%', padding: '16px', fontSize: '16px', fontWeight: '700', color: '#FFFFFF', backgroundColor: '#A8B5AD', border: 'none', borderRadius: '12px', cursor: 'not-allowed', marginTop: '8px' },
  status: { padding: '16px', backgroundColor: '#F0F4F1', borderRadius: '12px', color: '#5B7060', fontSize: '15px', fontWeight: '500', marginTop: '16px', textAlign: 'center' },
  error: { color: '#C0392B', fontSize: '14px', fontWeight: '600' },
  hint: { color: '#8A9A90', fontSize: '13px', marginTop: '16px', fontStyle: 'italic' },
  link: { display: 'block', textAlign: 'center', marginTop: '24px', color: '#5B7060', textDecoration: 'none', fontWeight: '600' },
  footer: { marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #E8ECE9', color: '#8A9A90', fontSize: '14px', fontStyle: 'italic' },
  loading: { color: '#8A9A90', fontStyle: 'italic', padding: '16px' },
  empty: { color: '#8A9A90', fontStyle: 'italic', padding: '16px', textAlign: 'center' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  statCard: { padding: '24px', backgroundColor: '#F0F4F1', borderRadius: '12px', textAlign: 'center', borderLeft: '4px solid #D4AF37' },
  statValue: { fontSize: '36px', fontWeight: '700', color: '#5B7060', marginBottom: '8px' },
  statLabel: { fontSize: '14px', color: '#8A9A90', fontWeight: '500' }
};
