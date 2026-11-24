'use client';
import { useState, useEffect, useRef } from 'react';

// ============================================================
// 🔐 GANTI PIN ADMIN DI SINI
// ============================================================
const ADMIN_PIN = '444444';
// ============================================================

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [activeTab, setActiveTab] = useState('live');
  
  const [kegiatanList, setKegiatanList] = useState([]);
  const [loadingKegiatan, setLoadingKegiatan] = useState(false);
  const [selectedKegiatan, setSelectedKegiatan] = useState('');
  const [customNama, setCustomNama] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [waktuMulai, setWaktuMulai] = useState('');
  const [waktuSelesai, setWaktuSelesai] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const [statistik, setStatistik] = useState(null);
  const [loadingStatistik, setLoadingStatistik] = useState(false);
  const [filter, setFilter] = useState({ 
    periode: 'bulan', 
    bulan: new Date().getMonth() + 1, 
    tahun: new Date().getFullYear(), 
    jenisKegiatan: 'all' 
  });

  const [absensiHariIni, setAbsensiHariIni] = useState([]);
  const [loadingAbsensi, setLoadingAbsensi] = useState(false);
  const [searchNama, setSearchNama] = useState('');
  const [loadingRingkasan, setLoadingRingkasan] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [geoConfig, setGeoConfig] = useState({ enabled: false, lat: -6.926116650622637, lng: 107.60863387231466, radius: 100 });
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [geoMsg, setGeoMsg] = useState('');

  // === STATE RANKING ===
  const [rankingData, setRankingData] = useState(null);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [rankingFilter, setRankingFilter] = useState({
    periode: 'bulan',
    bulan: new Date().getMonth() + 1,
    tahun: new Date().getFullYear(),
    jenisKegiatan: 'all',
    topN: 10
  });

  const NAMA_BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const intervalRef = useRef(null);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) { setIsAuthenticated(true); setPinError(''); }
    else { setPinError('PIN salah.'); }
  };

  const parseResponse = (data) => {
    if (!data) return null;
    if (data.data && data.data.success !== undefined && data.data.data !== undefined) return data.data.data;
    if (data.success !== undefined && data.data !== undefined) return data.data;
    if (data.data !== undefined) return data.data;
    return data;
  };

  const parseSuccess = (data) => {
    if (!data) return false;
    if (data.success === true) return true;
    if (data.data && data.data.success === true) return true;
    return false;
  };

  const parseMessage = (data) => {
    if (!data) return '';
    if (data.message) return data.message;
    if (data.data && data.data.message) return data.data.message;
    return '';
  };

  const muatKegiatan = async () => {
    setLoadingKegiatan(true);
    try {
      const res = await fetch('/api/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'getAllKegiatan' }) });
      const data = await res.json();
      setKegiatanList(Array.isArray(parseResponse(data)) ? parseResponse(data) : []);
    } catch (error) { console.error(error); setKegiatanList([]); }
    finally { setLoadingKegiatan(false); }
  };

  const muatStatistik = async () => {
    setLoadingStatistik(true);
    try {
      const res = await fetch('/api/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'getStatistikKehadiran', data: filter }) });
      const data = await res.json();
      if (parseSuccess(data)) setStatistik(parseResponse(data));
      else setStatistik(null);
    } catch (error) { console.error('Error muatStatistik:', error); setStatistik(null); }
    finally { setLoadingStatistik(false); }
  };

  const muatAbsensiHariIni = async () => {
    setLoadingAbsensi(true);
    try {
      const res = await fetch('/api/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'getAbsensiHariIni' }) });
      const data = await res.json();
      setAbsensiHariIni(Array.isArray(parseResponse(data)) ? parseResponse(data) : []);
      setLastRefresh(new Date());
    } catch (error) { console.error('Error muatAbsensiHariIni:', error); setAbsensiHariIni([]); } 
    finally { setLoadingAbsensi(false); }
  };

  const kirimRingkasan = async () => {
    if (!confirm('Kirim ringkasan kegiatan hari ini ke Telegram?')) return;
    setLoadingRingkasan(true);
    setStatusMsg('Mengirim ringkasan ke Telegram...');
    try {
      const res = await fetch('/api/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'kirimRingkasanTelegram' }) });
      const data = await res.json();
      setStatusMsg(parseSuccess(data) ? '✅ ' + parseMessage(data) : '❌ ' + parseMessage(data));
    } catch (error) { setStatusMsg('❌ Gagal terhubung.'); }
    finally { setLoadingRingkasan(false); }
  };

  const muatGeoConfig = async () => {
    setLoadingGeo(true);
    try {
      const res = await fetch('/api/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'getGeofencingConfig' }) });
      const data = await res.json();
      if (parseSuccess(data)) setGeoConfig(parseResponse(data));
    } catch (error) { console.error('Error muatGeoConfig:', error); }
    finally { setLoadingGeo(false); }
  };

  const simpanGeoConfig = async () => {
    setLoadingGeo(true);
    setGeoMsg('Menyimpan konfigurasi...');
    try {
      const res = await fetch('/api/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'setGeofencingConfig', data: geoConfig }) });
      const data = await res.json();
      if (parseSuccess(data)) setGeoMsg('✅ Konfigurasi Geofencing berhasil disimpan!');
      else setGeoMsg('❌ Gagal: ' + parseMessage(data));
    } catch (error) { setGeoMsg('❌ Gagal terhubung ke server.'); }
    finally { setLoadingGeo(false); }
  };

  const gunakanLokasiSaya = () => {
    if (!navigator.geolocation) { setGeoMsg('❌ Browser tidak mendukung geolokasi.'); return; }
    setGeoMsg('📍 Sedang mengambil lokasi...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoConfig(prev => ({ ...prev, lat: position.coords.latitude, lng: position.coords.longitude }));
        setGeoMsg('✅ Lokasi berhasil diambil! Klik "Simpan Konfigurasi".');
      },
      (error) => {
        let msg = '❌ Gagal: ';
        if (error.code === 1) msg += 'Izin lokasi ditolak.';
        else if (error.code === 2) msg += 'Lokasi tidak tersedia.';
        else if (error.code === 3) msg += 'Timeout.';
        else msg += error.message;
        setGeoMsg(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // === FUNGSI RANKING ===
  const muatRanking = async () => {
    setLoadingRanking(true);
    try {
      const res = await fetch('/api/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'getRankingUmat', data: rankingFilter }) });
      const data = await res.json();
      if (parseSuccess(data)) setRankingData(parseResponse(data));
      else setRankingData(null);
    } catch (error) { console.error('Error muatRanking:', error); setRankingData(null); }
    finally { setLoadingRanking(false); }
  };

  const handlePrintRanking = () => {
    window.print();
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === 'live' && autoRefresh) {
      muatAbsensiHariIni();
      intervalRef.current = setInterval(() => { muatAbsensiHariIni(); }, 10000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isAuthenticated, activeTab, autoRefresh]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === 'jadwal') muatKegiatan();
    else if (activeTab === 'dashboard') muatStatistik();
    else if (activeTab === 'geofencing') muatGeoConfig();
    else if (activeTab === 'ranking') muatRanking();
  }, [isAuthenticated, activeTab]);

  const handleAktifkan = async (e) => {
    e.preventDefault();
    if (!selectedKegiatan || !tanggal) { setStatusMsg('⚠️ Pilih kegiatan dan tanggal.'); return; }
    if (selectedKegiatan === 'CUSTOM' && !customNama.trim()) { setStatusMsg('⚠️ Isi nama kegiatan baru.'); return; }
    setLoading(true); setStatusMsg('Memproses...');
    try {
      const res = await fetch('/api/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'aktifkanKegiatan', data: { idKegiatan: selectedKegiatan, customNama, tanggal, waktuMulai, waktuSelesai } }) });
      const data = await res.json();
      if (parseSuccess(data)) {
        setStatusMsg('✅ ' + parseMessage(data));
        setSelectedKegiatan(''); setCustomNama(''); setWaktuMulai(''); setWaktuSelesai('');
        muatKegiatan();
      } else { setStatusMsg('❌ ' + parseMessage(data)); }
    } catch (error) { setStatusMsg('❌ Gagal terhubung.'); }
    finally { setLoading(false); }
  };

  const handleNonaktifkan = async (idKegiatan, tanggalKegiatan) => {
    if (!confirm('Yakin menonaktifkan kegiatan ini?')) return;
    try {
      const res = await fetch('/api/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'nonaktifkanKegiatan', data: { idKegiatan, tanggal: tanggalKegiatan } }) });
      const data = await res.json();
      if (parseSuccess(data)) { setStatusMsg('✅ Kegiatan dinonaktifkan.'); muatKegiatan(); }
      else { setStatusMsg('❌ ' + parseMessage(data)); }
    } catch (error) { setStatusMsg('❌ Gagal terhubung.'); }
  };

  const absensiTersaring = Array.isArray(absensiHariIni) 
    ? absensiHariIni.filter(a => a.nama && a.nama.toLowerCase().includes(searchNama.toLowerCase()))
    : [];

  const formatWaktu = (date) => {
    if (!date) return '-';
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // === LEGEND IKON RANKING ===
  const legendItems = [
    { ikon: '🌟', label: 'Umat Teladan', desc: 'Hadir 100% sesi' },
    { ikon: '⭐', label: 'Umat Aktif', desc: 'Hadir ≥75% sesi' },
    { ikon: '🔹', label: 'Umat Rutin', desc: 'Hadir ≥50% sesi' },
    { ikon: '🌱', label: 'Umat Baru', desc: 'Hadir 1x di periode ini' }
  ];

  if (!isAuthenticated) {
    return (
      <main style={styles.container}>
        <div style={styles.card}>
          <img src="https://lh3.googleusercontent.com/d/1XAFp_h5DcJzjLW63Wq0oiQfGGHSL18sG=s0" alt="Logo" style={styles.logo} />
          <h1 style={styles.title}>Panel Panitia</h1>
          <p style={styles.subtitle}>Vihara Karuna Mukti, Bandung</p>
          <form onSubmit={handleLogin} style={styles.form}>
            <label style={styles.label}>🔐 Masukkan PIN Admin</label>
            <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="6 digit PIN" maxLength="6" style={styles.input} autoFocus />
            {pinError && <p style={styles.error}>{pinError}</p>}
            <button type="submit" style={styles.button}>Masuk</button>
          </form>
          <p style={styles.hint}>PIN default: 123456</p>
          <a href="/" style={styles.link}>← Kembali ke Halaman Absensi</a>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.container}>
      {/* CSS untuk Print */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 15mm; }
        }
      `}</style>

      <div style={styles.cardWide}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Panel Panitia</h1>
            <p style={styles.subtitle}>Kelola Kegiatan & Statistik Vihara</p>
          </div>
          <button onClick={() => setIsAuthenticated(false)} style={styles.logoutBtn}>🚪 Keluar</button>
        </div>

        <div style={styles.tabs} className="no-print">
          <button onClick={() => setActiveTab('live')} style={activeTab === 'live' ? styles.tabActive : styles.tab}>👥 Live Absensi</button>
          <button onClick={() => setActiveTab('jadwal')} style={activeTab === 'jadwal' ? styles.tabActive : styles.tab}>📅 Jadwal</button>
          <button onClick={() => setActiveTab('dashboard')} style={activeTab === 'dashboard' ? styles.tabActive : styles.tab}>📊 Dashboard</button>
          <button onClick={() => setActiveTab('ranking')} style={activeTab === 'ranking' ? styles.tabActive : styles.tab}>🏆 Ranking</button>
          <button onClick={() => setActiveTab('geofencing')} style={activeTab === 'geofencing' ? styles.tabActive : styles.tab}>📍 Geofencing</button>
        </div>

        {activeTab === 'live' && (
          <div>
            <div style={styles.liveHeader}>
              <div>
                <h2 style={styles.sectionTitle}>👥 Kehadiran Hari Ini</h2>
                <p style={styles.liveCount}>Total: <strong>{absensiHariIni.length}</strong> umat hadir
                  {lastRefresh && <span style={{fontSize: '12px', color: '#8A9A90', marginLeft: '12px'}}>(Update: {formatWaktu(lastRefresh)})</span>}
                </p>
              </div>
              <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center'}}>
                <label style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#5B7060', cursor: 'pointer'}}>
                  <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} style={{accentColor: '#5B7060'}} /> Auto-refresh
                </label>
                <button onClick={muatAbsensiHariIni} disabled={loadingAbsensi} style={styles.btnRefresh}>{loadingAbsensi ? '⏳' : '🔄'} Refresh</button>
                <button onClick={kirimRingkasan} disabled={loadingRingkasan} style={styles.btnTelegram}>{loadingRingkasan ? '⏳ Mengirim...' : '📤 Kirim Ringkasan'}</button>
              </div>
            </div>
            <div style={styles.searchBox}>
              <input type="text" value={searchNama} onChange={(e) => setSearchNama(e.target.value)} placeholder="🔍 Ketik nama umat..." style={styles.input} />
            </div>
            {absensiTersaring.length === 0 ? (
              <div style={styles.emptyState}>{searchNama ? 'Tidak ada umat dengan nama tersebut.' : loadingAbsensi ? 'Memuat data...' : 'Belum ada umat yang absen hari ini.'}</div>
            ) : (
              <div style={styles.list}>
                {absensiTersaring.map((a, idx) => (
                  <div key={idx} style={styles.liveCard}>
                    <div style={styles.liveInfo}>
                      <div style={styles.liveNama}>{a.nama}</div>
                      <div style={styles.liveMeta}>{a.id} • {a.metode === 'QR_Scan' ? '📷 Scan QR' : '📝 Manual'}</div>
                    </div>
                    <div style={styles.liveTime}>{a.waktu}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'jadwal' && (
          <div>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>➕ Aktifkan Kegiatan</h2>
              <form onSubmit={handleAktifkan} style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Pilih Kegiatan</label>
                  <select value={selectedKegiatan} onChange={(e) => setSelectedKegiatan(e.target.value)} style={styles.select}>
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
                    <input type="text" value={customNama} onChange={(e) => setCustomNama(e.target.value)} placeholder="Contoh: Kelas Dhamma Remaja" style={styles.input} />
                  </div>
                )}
                <div style={styles.formRow}>
                  <div style={styles.formGroup}><label style={styles.label}>📅 Tanggal</label><input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} style={styles.input} required /></div>
                  <div style={styles.formGroup}><label style={styles.label}>Waktu Mulai</label><input type="time" value={waktuMulai} onChange={(e) => setWaktuMulai(e.target.value)} style={styles.input} /></div>
                  <div style={styles.formGroup}><label style={styles.label}>Waktu Selesai</label><input type="time" value={waktuSelesai} onChange={(e) => setWaktuSelesai(e.target.value)} style={styles.input} /></div>
                </div>
                <button type="submit" disabled={loading} style={loading ? styles.buttonDisabled : styles.button}>{loading ? 'Memproses...' : '✨ Aktifkan Kegiatan'}</button>
              </form>
            </section>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>📋 Daftar Kegiatan Aktif</h2>
              {loadingKegiatan ? <p style={styles.loading}>Memuat...</p> : kegiatanList.length === 0 ? <p style={styles.empty}>Belum ada kegiatan aktif.</p> : (
                <div style={styles.list}>
                  {kegiatanList.map((k, idx) => (
                    <div key={idx} style={styles.listItem}>
                      <div style={styles.listItemInfo}>
                        <strong style={styles.listItemTitle}>{k.nama}</strong>
                        <span style={styles.listItemMeta}>{k.id} • {k.tanggal} • {k.waktuMulai}-{k.waktuSelesai}</span>
                      </div>
                      <button onClick={() => handleNonaktifkan(k.id, k.tanggal)} style={styles.btnNonaktif}>Nonaktifkan</button>
                    </div>
                  ))}
                </div>
              )}
            </section>
            {statusMsg && <p style={styles.status}>{statusMsg}</p>}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>🔍 Filter Statistik</h2>
              <div style={styles.filterGrid}>
                <div style={styles.formGroup}><label style={styles.label}>Periode</label><select value={filter.periode} onChange={(e) => setFilter({...filter, periode: e.target.value})} style={styles.select}><option value="minggu">Minggu Ini</option><option value="bulan">Bulan Ini</option><option value="tahun">Tahun Ini</option></select></div>
                {filter.periode === 'bulan' && (<div style={styles.formGroup}><label style={styles.label}>Bulan</label><select value={filter.bulan} onChange={(e) => setFilter({...filter, bulan: parseInt(e.target.value)})} style={styles.select}>{NAMA_BULAN.map((n, i) => <option key={i} value={i+1}>{n}</option>)}</select></div>)}
                <div style={styles.formGroup}><label style={styles.label}>Tahun</label><select value={filter.tahun} onChange={(e) => setFilter({...filter, tahun: parseInt(e.target.value)})} style={styles.select}>{[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                <div style={styles.formGroup}><label style={styles.label}>Jenis</label><select value={filter.jenisKegiatan} onChange={(e) => setFilter({...filter, jenisKegiatan: e.target.value})} style={styles.select}><option value="all">Semua</option><option value="minggu">Puja Bakti</option><option value="rabu">Meditasi</option></select></div>
              </div>
              <button onClick={muatStatistik} style={styles.buttonSecondary}>🔄 Terapkan Filter</button>
            </section>
            {loadingStatistik ? <p style={styles.loading}>Memuat statistik...</p> : statistik ? (
              <div>
                <div style={styles.statsGrid}>
                  <div style={{...styles.statCard, backgroundColor: '#FDF6E3', borderLeft: '4px solid #D4AF37'}}>
                    <div style={styles.statValue}>{statistik.totalUmat || 0}</div>
                    <div style={styles.statLabel}>Total Umat</div>
                    <div style={{fontSize: '11px', color: '#8A9A90', marginTop: '4px'}}>Di database</div>
                  </div>
                  <div style={{...styles.statCard, backgroundColor: '#E8F5E9', borderLeft: '4px solid #2E7D32'}}>
                    <div style={styles.statValue}>{statistik.uniqueUmatHadir || 0}</div>
                    <div style={styles.statLabel}>Umat Hadir (Unik)</div>
                    <div style={{fontSize: '11px', color: '#8A9A90', marginTop: '4px'}}>Hadir ≥1x</div>
                  </div>
                  <div style={{...styles.statCard, backgroundColor: '#E3F2FD', borderLeft: '4px solid #1976D2'}}>
                    <div style={styles.statValue}>{statistik.partisipasiRate || 0}%</div>
                    <div style={styles.statLabel}>Tingkat Partisipasi</div>
                    <div style={{fontSize: '11px', color: '#8A9A90', marginTop: '4px'}}>% umat terlibat</div>
                  </div>
                  <div style={{...styles.statCard, backgroundColor: '#F3E5F5', borderLeft: '4px solid #7B1FA2'}}>
                    <div style={styles.statValue}>{statistik.avgPerSesi || 0}</div>
                    <div style={styles.statLabel}>Rata-rata per Sesi</div>
                    <div style={{fontSize: '11px', color: '#8A9A90', marginTop: '4px'}}>Dari {statistik.jumlahSesi || 0} sesi</div>
                  </div>
                  <div style={{...styles.statCard, backgroundColor: '#FFF3E0', borderLeft: '4px solid #E65100'}}>
                    <div style={styles.statValue}>{statistik.totalHadir || 0}</div>
                    <div style={styles.statLabel}>Total Kehadiran</div>
                    <div style={{fontSize: '11px', color: '#8A9A90', marginTop: '4px'}}>Jumlah row absensi</div>
                  </div>
                </div>
                {statistik.perKegiatan && Object.keys(statistik.perKegiatan).length > 0 && (
                  <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>📋 Kehadiran per Kegiatan</h2>
                    <div style={styles.list}>{Object.entries(statistik.perKegiatan).map(([nama, count]) => (<div key={nama} style={styles.listItem}><strong style={styles.listItemTitle}>{nama}</strong><span style={styles.badge}>{count}</span></div>))}</div>
                  </section>
                )}
                {statistik.perMinggu && Object.keys(statistik.perMinggu).length > 0 && (
                  <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>📅 Kehadiran per Tanggal {filter.periode === 'bulan' ? `(Bulan ${NAMA_BULAN[filter.bulan-1]}/${filter.tahun})` : ''}</h2>
                    <div style={styles.list}>{Object.entries(statistik.perMinggu).map(([tgl, count]) => (
                      <div key={tgl} style={styles.listItem}><strong style={styles.listItemTitle}>{tgl}</strong><span style={styles.badge}>{count}</span></div>
                    ))}</div>
                  </section>
                )}
                <section style={styles.section}>
                  <h2 style={styles.sectionTitle}>🏆 Top 10 Umat Teraktif</h2>
                  {statistik.topUmat && statistik.topUmat.length === 0 ? <p style={styles.empty}>Belum ada data.</p> : (
                    <div style={styles.list}>{statistik.topUmat.map((u, idx) => (
                      <div key={idx} style={styles.listItem}>
                        <div style={styles.listItemInfo}>
                          <strong style={styles.listItemTitle}>
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`} {u.nama}
                          </strong>
                          <span style={styles.listItemMeta}>ID: {u.id}</span>
                        </div>
                        <span style={styles.badge}>{u.count}x Hadir</span>
                      </div>
                    ))}</div>
                  )}
                </section>
              </div>
            ) : <p style={styles.empty}>Klik "Terapkan Filter" untuk memuat statistik.</p>}
          </div>
        )}

        {/* === TAB RANKING === */}
        {activeTab === 'ranking' && (
          <div>
            {/* Area yang akan dicetak */}
            <div className="print-area">
              {/* Header khusus print */}
              <div style={styles.printHeader}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px'}}>
                  <img src="https://lh3.googleusercontent.com/d/1XAFp_h5DcJzjLW63Wq0oiQfGGHSL18sG=s0" alt="Logo" style={{width: '60px', height: '60px'}} />
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '18px', fontWeight: '700', color: '#5B7060'}}>VIHARA KARUNA MUKTI</div>
                    <div style={{fontSize: '13px', color: '#8A9A90'}}>Bandung</div>
                  </div>
                </div>
                <h2 style={{textAlign: 'center', color: '#5B7060', fontSize: '22px', margin: '16px 0 8px 0', borderBottom: '2px solid #D4AF37', paddingBottom: '8px'}}>
                  🏆 RANKING KEHADIRAN UMAT
                </h2>
                {rankingData && rankingData.metadata && (
                  <div style={{textAlign: 'center', color: '#5B7060', fontSize: '14px', marginBottom: '16px'}}>
                    Periode: <strong>{rankingData.metadata.periodeLabel}</strong> • {rankingData.metadata.jenisLabel}
                  </div>
                )}
              </div>

              {/* Filter (tidak muncul saat print) */}
              <div className="no-print" style={styles.section}>
                <h2 style={styles.sectionTitle}>🔍 Filter Ranking</h2>
                <div style={styles.filterGrid}>
                  <div style={styles.formGroup}><label style={styles.label}>Periode</label><select value={rankingFilter.periode} onChange={(e) => setRankingFilter({...rankingFilter, periode: e.target.value})} style={styles.select}><option value="minggu">Minggu Ini</option><option value="bulan">Bulan Ini</option><option value="tahun">Tahun Ini</option></select></div>
                  {rankingFilter.periode === 'bulan' && (<div style={styles.formGroup}><label style={styles.label}>Bulan</label><select value={rankingFilter.bulan} onChange={(e) => setRankingFilter({...rankingFilter, bulan: parseInt(e.target.value)})} style={styles.select}>{NAMA_BULAN.map((n, i) => <option key={i} value={i+1}>{n}</option>)}</select></div>)}
                  <div style={styles.formGroup}><label style={styles.label}>Tahun</label><select value={rankingFilter.tahun} onChange={(e) => setRankingFilter({...rankingFilter, tahun: parseInt(e.target.value)})} style={styles.select}>{[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                  <div style={styles.formGroup}><label style={styles.label}>Jenis Kegiatan</label><select value={rankingFilter.jenisKegiatan} onChange={(e) => setRankingFilter({...rankingFilter, jenisKegiatan: e.target.value})} style={styles.select}><option value="all">Semua</option><option value="minggu">Puja Bakti</option><option value="rabu">Meditasi</option></select></div>
                </div>
                <div style={{display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap'}}>
                  <button onClick={muatRanking} disabled={loadingRanking} style={styles.buttonSecondary}>{loadingRanking ? '⏳ Memuat...' : '🔄 Terapkan Filter'}</button>
                  <button onClick={handlePrintRanking} disabled={!rankingData} style={{...styles.button, backgroundColor: '#0088cc', flex: 1}} disabled={!rankingData || loadingRanking}>🖨️ Cetak / Save PDF</button>
                </div>
              </div>

              {/* Info metadata (muncul saat print) */}
              {rankingData && rankingData.metadata && (
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8A9A90', marginBottom: '12px', padding: '8px', backgroundColor: '#F0F4F1', borderRadius: '8px'}}>
                  <span>📊 Total Sesi: <strong>{rankingData.metadata.totalSesi}</strong></span>
                  <span>👥 Umat Hadir: <strong>{rankingData.metadata.totalUmatHadir}</strong> dari {rankingData.metadata.totalUmatDatabase}</span>
                </div>
              )}

              {/* Tabel Ranking */}
              {loadingRanking ? <p style={styles.loading}>Memuat ranking...</p> : rankingData && rankingData.ranking ? (
                <div style={{overflowX: 'auto'}}>
                  <table style={styles.rankingTable}>
                    <thead>
                      <tr>
                        <th style={{...styles.th, width: '60px'}}>Peringkat</th>
                        <th style={{...styles.th, textAlign: 'left'}}>Nama Umat</th>
                        <th style={{...styles.th, width: '100px'}}>ID</th>
                        <th style={{...styles.th, width: '80px'}}>Hadir</th>
                        <th style={{...styles.th, width: '80px'}}>Persentase</th>
                        <th style={{...styles.th, width: '150px'}}>Kategori</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankingData.ranking.map((u, idx) => (
                        <tr key={idx} style={idx % 2 === 0 ? styles.trEven : styles.trOdd}>
                          <td style={{...styles.td, textAlign: 'center', fontSize: '20px'}}>
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${u.peringkat}`}
                          </td>
                          <td style={{...styles.td, fontWeight: '700', color: '#3D4A42'}}>{u.nama}</td>
                          <td style={{...styles.td, color: '#8A9A90', fontSize: '12px'}}>{u.id}</td>
                          <td style={{...styles.td, textAlign: 'center', fontWeight: '700'}}>{u.count}x</td>
                          <td style={{...styles.td, textAlign: 'center'}}>{u.persentase}%</td>
                          <td style={styles.td}>
                            <span style={styles.kategoriBadge}>
                              {u.ikon} {u.label}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={styles.empty}>Klik "Terapkan Filter" untuk memuat ranking.</p>
              )}

              {/* Legend (muncul saat print) */}
              {rankingData && rankingData.ranking && rankingData.ranking.length > 0 && (
                <div style={{marginTop: '20px', padding: '12px', backgroundColor: '#FDF6E3', borderRadius: '8px', border: '1px solid #D4AF37'}}>
                  <div style={{fontSize: '13px', fontWeight: '700', color: '#5B7060', marginBottom: '8px'}}>📖 Keterangan Kategori:</div>
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '6px', fontSize: '12px', color: '#5B7060'}}>
                    {legendItems.map((item, idx) => (
                      <div key={idx}>{item.ikon} <strong>{item.label}</strong> — {item.desc}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer print */}
              {rankingData && rankingData.metadata && (
                <div style={{marginTop: '24px', textAlign: 'center', fontSize: '11px', color: '#8A9A90', borderTop: '1px solid #E8ECE9', paddingTop: '12px'}}>
                  <div>Dicetak pada: {rankingData.metadata.tanggalCetak} WIB</div>
                  <div style={{marginTop: '4px', fontStyle: 'italic'}}>Terima kasih atas partisipasi Bapak/Ibu umat Vihara Karuna Mukti 🙏</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'geofencing' && (
          <div>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>📍 Pengaturan Geofencing (Batas Lokasi)</h2>
              <p style={{...styles.hint, marginTop: 0, marginBottom: '24px', fontStyle: 'normal', color: '#5B7060'}}>
                Fitur ini membatasi absensi hanya untuk umat yang berada di dalam radius tertentu dari Vihara. 
                <strong> Default: NONAKTIF</strong> (aman untuk testing).
              </p>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Status Geofencing</label>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px'}}>
                    <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '600', color: geoConfig.enabled ? '#2E7D32' : '#8A9A90'}}>
                      <input type="checkbox" checked={geoConfig.enabled} onChange={(e) => setGeoConfig({...geoConfig, enabled: e.target.checked})} style={{width: '20px', height: '20px', accentColor: '#5B7060'}} />
                      {geoConfig.enabled ? '✅ AKTIF (Absen diblokir di luar radius)' : '⛔ NONAKTIF (Absen bebas lokasi)'}
                    </label>
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}><label style={styles.label}>Latitude Vihara</label><input type="number" step="any" value={geoConfig.lat} onChange={(e) => setGeoConfig({...geoConfig, lat: parseFloat(e.target.value)})} style={styles.input} /></div>
                  <div style={styles.formGroup}><label style={styles.label}>Longitude Vihara</label><input type="number" step="any" value={geoConfig.lng} onChange={(e) => setGeoConfig({...geoConfig, lng: parseFloat(e.target.value)})} style={styles.input} /></div>
                  <div style={styles.formGroup}><label style={styles.label}>Radius (Meter)</label><input type="number" value={geoConfig.radius} onChange={(e) => setGeoConfig({...geoConfig, radius: parseInt(e.target.value) || 0})} style={styles.input} /></div>
                </div>
                <div style={{display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap'}}>
                  <button type="button" onClick={gunakanLokasiSaya} style={{...styles.buttonSecondary, width: 'auto', flex: 1, minWidth: '200px'}}>📍 Gunakan Lokasi Saya Saat Ini</button>
                  <button type="button" onClick={simpanGeoConfig} disabled={loadingGeo} style={{...styles.button, width: 'auto', flex: 1, minWidth: '200px', marginTop: 0}}>{loadingGeo ? 'Menyimpan...' : '💾 Simpan Konfigurasi'}</button>
                </div>
                {geoMsg && (
                  <p style={{...styles.status, backgroundColor: geoMsg.includes('✅') ? '#E8F5E9' : geoMsg.includes('❌') ? '#FFEBEE' : '#F0F4F1', color: geoMsg.includes('✅') ? '#2E7D32' : geoMsg.includes('❌') ? '#C0392B' : '#5B7060', borderLeft: `4px solid ${geoMsg.includes('✅') ? '#2E7D32' : geoMsg.includes('❌') ? '#C0392B' : '#D4AF37'}`}}>{geoMsg}</p>
                )}
              </div>
            </section>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>🧪 Cara Testing Geofencing</h2>
              <div style={{...styles.listItem, backgroundColor: '#FDF6E3', borderLeft: '4px solid #D4AF37'}}>
                <ol style={{margin: 0, paddingLeft: '20px', color: '#5B7060', lineHeight: '1.8'}}>
                  <li>Pastikan <strong>Status Geofencing</strong> dicentang (AKTIF).</li>
                  <li>Klik <strong>"Gunakan Lokasi Saya Saat Ini"</strong> (pastikan Anda sedang di Vihara untuk akurasi maksimal).</li>
                  <li>Klik <strong>"Simpan Konfigurasi"</strong>.</li>
                  <li>Buka halaman absensi umat (<code>/</code>) di HP lain atau mode Incognito.</li>
                  <li>Coba absen. Jika di luar radius, tombol absen akan terkunci 🔒 dan muncul peringatan.</li>
                  <li>Setelah testing selesai, <strong>jangan lupa hilangkan centang</strong> agar umat bisa absen normal.</li>
                </ol>
              </div>
            </section>
          </div>
        )}

        {statusMsg && activeTab !== 'jadwal' && activeTab !== 'geofencing' && activeTab !== 'ranking' && <p style={styles.status}>{statusMsg}</p>}
        <a href="/" style={styles.link} className="no-print">← Kembali ke Halaman Absensi</a>
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
  tabs: { display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #E8ECE9', paddingBottom: '12px', flexWrap: 'wrap' },
  tab: { padding: '12px 24px', backgroundColor: 'transparent', color: '#8A9A90', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '600', borderRadius: '8px' },
  tabActive: { padding: '12px 24px', backgroundColor: '#5B7060', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '600', borderRadius: '8px' },
  section: { marginBottom: '32px' },
  sectionTitle: { color: '#5B7060', fontSize: '20px', fontWeight: '700', marginBottom: '16px', borderBottom: '2px solid #D4AF37', paddingBottom: '8px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#F0F4F1', borderRadius: '12px', borderLeft: '4px solid #D4AF37', flexWrap: 'wrap', gap: '12px' },
  listItemInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  listItemTitle: { color: '#5B7060', fontSize: '16px' },
  listItemMeta: { color: '#8A9A90', fontSize: '13px' },
  badge: { padding: '6px 14px', backgroundColor: '#5B7060', color: '#FFFFFF', borderRadius: '20px', fontSize: '14px', fontWeight: '600' },
  btnNonaktif: { padding: '8px 16px', backgroundColor: '#FFFFFF', color: '#C0392B', border: '2px solid #C0392B', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' },
  formGrid: { display: 'flex', flexDirection: 'column', gap: '16px' },
  formRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' },
  filterGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { color: '#5B7060', fontWeight: '600', fontSize: '14px' },
  input: { padding: '14px', fontSize: '16px', border: '2px solid #D1DBD4', borderRadius: '10px', outline: 'none', backgroundColor: '#FFFFFF', width: '100%', boxSizing: 'border-box' },
  select: { padding: '14px', fontSize: '16px', border: '2px solid #D1DBD4', borderRadius: '10px', outline: 'none', backgroundColor: '#FFFFFF', width: '100%', boxSizing: 'border-box' },
  button: { width: '100%', padding: '16px', fontSize: '16px', fontWeight: '700', color: '#FFFFFF', backgroundColor: '#5B7060', border: 'none', borderRadius: '12px', cursor: 'pointer', marginTop: '8px' },
  buttonSecondary: { width: '100%', padding: '14px', fontSize: '16px', fontWeight: '700', color: '#5B7060', backgroundColor: '#F0F4F1', border: '2px solid #5B7060', borderRadius: '12px', cursor: 'pointer', marginTop: '8px' },
  buttonDisabled: { width: '100%', padding: '16px', fontSize: '16px', fontWeight: '700', color: '#FFFFFF', backgroundColor: '#A8B5AD', border: 'none', borderRadius: '12px', cursor: 'not-allowed', marginTop: '8px' },
  status: { padding: '16px', backgroundColor: '#F0F4F1', borderRadius: '12px', color: '#5B7060', fontSize: '15px', fontWeight: '500', marginTop: '16px', textAlign: 'center' },
  error: { color: '#C0392B', fontSize: '14px', fontWeight: '600' },
  hint: { color: '#8A9A90', fontSize: '13px', marginTop: '16px', fontStyle: 'italic' },
  link: { display: 'block', textAlign: 'center', marginTop: '24px', color: '#5B7060', textDecoration: 'none', fontWeight: '600' },
  loading: { color: '#8A9A90', fontStyle: 'italic', padding: '16px' },
  empty: { color: '#8A9A90', fontStyle: 'italic', padding: '16px', textAlign: 'center' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' },
  statCard: { padding: '24px', borderRadius: '12px', textAlign: 'center' },
  statValue: { fontSize: '42px', fontWeight: '700', color: '#5B7060', marginBottom: '8px' },
  statLabel: { fontSize: '14px', color: '#8A9A90', fontWeight: '500' },
  liveHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  liveCount: { color: '#5B7060', fontSize: '16px', margin: '4px 0 0 0' },
  btnRefresh: { padding: '10px 20px', backgroundColor: '#5B7060', color: '#FFFFFF', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  btnTelegram: { padding: '10px 20px', backgroundColor: '#0088cc', color: '#FFFFFF', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  searchBox: { marginBottom: '20px' },
  liveCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#FFFFFF', border: '1px solid #E8ECE9', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  liveInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  liveNama: { color: '#3D4A42', fontSize: '16px', fontWeight: '700' },
  liveMeta: { color: '#8A9A90', fontSize: '13px' },
  liveTime: { color: '#5B7060', fontSize: '18px', fontWeight: '700', fontVariantNumeric: 'tabular-nums' },
  emptyState: { textAlign: 'center', padding: '40px 20px', color: '#8A9A90', fontSize: '15px', fontStyle: 'italic', backgroundColor: '#F0F4F1', borderRadius: '12px' },
  // === STYLES RANKING ===
  printHeader: { marginBottom: '20px' },
  rankingTable: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#FFFFFF', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  th: { padding: '14px 12px', backgroundColor: '#5B7060', color: '#FFFFFF', fontSize: '13px', fontWeight: '700', textAlign: 'center', borderBottom: '2px solid #D4AF37' },
  td: { padding: '12px', fontSize: '14px', borderBottom: '1px solid #E8ECE9', verticalAlign: 'middle' },
  trEven: { backgroundColor: '#FFFFFF' },
  trOdd: { backgroundColor: '#F8FAF9' },
  kategoriBadge: { display: 'inline-block', padding: '4px 10px', backgroundColor: '#FDF6E3', borderRadius: '12px', fontSize: '12px', fontWeight: '600', color: '#5B7060', border: '1px solid #D4AF37' }
};
