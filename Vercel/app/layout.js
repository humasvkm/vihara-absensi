// app/layout.js - "Rumah" untuk semua halaman aplikasi
export const metadata = {
  title: 'Absensi Kehadiran - Vihara Karuna Mukti',
  description: 'Sistem absensi kehadiran umat Vihara Karuna Mukti, Bandung. Tenang, rapi, dan menghormati.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body style={{
        margin: 0,
        backgroundColor: '#F4F7F5',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        WebkitFontSmoothing: 'antialiased'
      }}>
        {children}
      </body>
    </html>
  );
}
