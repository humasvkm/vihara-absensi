export const metadata = {
  title: 'Absensi Vihara Karuna Mukti',
  description: 'Aplikasi absensi kehadiran umat Vihara Karuna Mukti Bandung',
  manifest: '/manifest.json', // Mendaftarkan file manifest untuk PWA
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VKM Absensi',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        {/* Icon untuk iPhone/iPad */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#5B7060" />
      </head>
      <body>
        {children}
        
        {/* Script untuk mendaftarkan Service Worker (PWA Cache) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('Service Worker berhasil didaftarkan: ', registration);
                  }, function(err) {
                    console.log('Gagal mendaftarkan Service Worker: ', err);
                  });
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
}
