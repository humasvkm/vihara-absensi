export async function POST(request) {
  try {
    const body = await request.json();
    const gasUrl = process.env.GAS_WEB_APP_URL;

    if (!gasUrl) {
      console.error('GAS_WEB_APP_URL not configured');
      return Response.json({ 
        success: false, 
        message: 'Konfigurasi server belum lengkap.' 
      }, { status: 500 });
    }

    console.log('Proxy request:', body.action);

    // Mengirim data ke Google Apps Script
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'text/plain;charset=utf-8' 
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      console.error('GAS response not ok:', response.status);
      return Response.json({ 
        success: false, 
        message: 'GAS returned status: ' + response.status 
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('GAS response:', JSON.stringify(result).substring(0, 200));
    
    return Response.json(result);

  } catch (error) {
    console.error('Proxy Error:', error);
    return Response.json({ 
      success: false, 
      message: 'Gagal terhubung ke server Vihara: ' + error.message 
    }, { status: 500 });
  }
}
