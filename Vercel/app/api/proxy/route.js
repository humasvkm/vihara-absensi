export async function POST(request) {
  try {
    const body = await request.json();
    const gasUrl = process.env.GAS_WEB_APP_URL;

    if (!gasUrl) {
      return Response.json({ success: false, message: 'Konfigurasi server belum lengkap.' }, { status: 500 });
    }

    // Mengirim data ke Google Apps Script
    const response = await fetch(gasUrl, {
      method: 'POST',
      // Menggunakan text/plain untuk menghindari masalah CORS preflight di Google Apps Script
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    return Response.json(result);

  } catch (error) {
    console.error('Proxy Error:', error);
    return Response.json({ success: false, message: 'Gagal terhubung ke server Vihara.' }, { status: 500 });
  }
}