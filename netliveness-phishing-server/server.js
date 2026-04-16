const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors()); // CORS yapılandırması
// Her isteği logla (Middleware sırası önemli)
app.use((req, res, next) => {
  console.log(`[REQUEST] ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Ana Dizin
app.get('/', (req, res) => {
  res.send('<h1>NetLiveness Phishing Sunucusu Aktif ✅</h1><p>Takip ve gönderim işlemleri için hazır.</p>');
});

let trackingStats = {
  clicks: 0,
  users: []
};

// Phishing Mail Gönderim (CID Attachment Destekli)
app.post('/api/send-phishing', async (req, res) => {
  const { smtp, mailData } = req.body;
  
  if (!smtp || !smtp.user || !smtp.password) {
    return res.status(400).json({ success: false, error: 'SMTP bilgileri eksik.' });
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host || 'smtp.gmail.com',
    port: parseInt(smtp.port) || 587,
    secure: smtp.secure || false,
    auth: { user: smtp.user, pass: smtp.password },
    tls: { rejectUnauthorized: false }
  });

  // Logoyu CID olarak ekle (Eğer varsa)
  let attachments = [];
  let customizedContent = mailData.content;

  try {
    const logoPath = path.join(__dirname, '..', 'logo_utf8.txt');
    if (fs.existsSync(logoPath)) {
      const logoBase64 = fs.readFileSync(logoPath, 'utf8').trim();
      attachments.push({
        filename: 'logo.png',
        content: logoBase64,
        encoding: 'base64',
        cid: 'reprologo' // HTML içinde <img src="cid:reprologo" /> olarak kullanılır
      });
      // Geçici çözüm: İçerikteki dış linkleri veya placeholderları CID ile değiştir
      customizedContent = customizedContent.replace(/src="https:\/\/.*repkon.*"/g, 'src="cid:reprologo"');
    }
  } catch (e) {
    console.error("Logo attachment hatası:", e.message);
  }

  try {
    const info = await transporter.sendMail({
      from: `"${mailData.senderName}" <${smtp.user}>`,
      to: mailData.recipient,
      subject: mailData.subject,
      html: customizedContent,
      replyTo: mailData.senderEmail,
      attachments: attachments
    });
    console.log(`[MAIL SENT] To: ${mailData.recipient}`);
    res.json({ success: true });
  } catch (error) {
    console.error('[MAIL ERROR]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Tıklama Takibi
app.get('/track/:userId', (req, res) => {
  const userId = decodeURIComponent(req.params.userId);
  trackingStats.clicks++;
  trackingStats.users.push({ userId, timestamp: new Date().toISOString(), ip: req.ip });
  console.log(`[CLICK DETECTED] User: ${userId}`);

  let logoBase64 = "";
  try {
    const logoPath = path.join(__dirname, '..', 'logo_utf8.txt');
    logoBase64 = fs.readFileSync(logoPath, 'utf8').trim();
  } catch (e) {}

  res.send(`
    <html>
      <head>
        <title>Güvenlik Uyarısı</title>
        <style>
          body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #fef2f2; margin: 0; }
          .card { background: white; padding: 40px; border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.1); text-align: center; max-width: 500px; border: 2px solid #fee2e2; }
          h1 { color: #dc2626; margin-bottom: 24px; font-size: 28px; }
          p { color: #4b5563; line-height: 1.8; font-size: 16px; }
          .logo { max-width: 180px; margin-bottom: 30px; }
        </style>
      </head>
      <body>
        <div class="card">
          ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" class="logo" alt="REPKON" />` : ''}
          <h1>⚠️ OLTALAMA UYARISI</h1>
          <p>Şu anda şirket içi farkındalık testi kapsamında gönderilen bir linke tıkladınız.</p>
          <p>Eğer bu gerçek bir saldırı olsaydı, şifreleriniz veya verileriniz şu an çalınmış olabilirdi.</p>
          <p style="margin-top: 20px; font-weight: 600;">Lütfen bir dahaki sefere daha dikkatli olun!</p>
        </div>
      </body>
    </html>
  `);
});

app.get('/api/stats', (req, res) => {
  res.json(trackingStats);
});

// SMTP Bağlantı Testi
app.post('/api/test-smtp', async (req, res) => {
  const { smtp } = req.body;
  if (!smtp || !smtp.user || !smtp.password) {
    return res.status(400).json({ success: false, error: 'SMTP bilgileri eksik.' });
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host || 'smtp.gmail.com',
    port: parseInt(smtp.port) || 587,
    secure: smtp.secure || false,
    auth: { user: smtp.user, pass: smtp.password },
    tls: { rejectUnauthorized: false }
  });

  try {
    await transporter.verify();
    res.json({ success: true, message: 'Bağlantı Başarılı' });
  } catch (error) {
    console.error('[SMTP TEST ERROR]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Phishing Backend http://191.168.1.228:${PORT} adresinde aktif.`);
});
