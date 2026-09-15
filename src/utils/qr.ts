import QRCode from 'qrcode';

export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

export function printQrElement(title: string, subtitle: string, qrDataUrl: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    // If popup is blocked in iframe, trigger in-app print
    window.print();
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Etiqueta QR - ${title}</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #fff;
          }
          .label-card {
            border: 2px dashed #0f172a;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            width: 260px;
          }
          .title {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 4px 0;
            letter-spacing: 0.5px;
          }
          .subtitle {
            font-size: 13px;
            color: #475569;
            margin: 0 0 12px 0;
          }
          .qr-img {
            width: 180px;
            height: 180px;
            display: block;
            margin: 0 auto 10px auto;
          }
          .footer {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
        </style>
      </head>
      <body>
        <div class="label-card">
          <div class="title">${title}</div>
          <div class="subtitle">${subtitle}</div>
          <img class="qr-img" src="${qrDataUrl}" alt="${title}" />
          <div class="footer">HydroControl • La Bocana</div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
