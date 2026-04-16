const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Phishing.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Multi-phase cleanup
const charMap = {
  'Åž': 'Ş',
  'ÅŸ': 'ş',
  'ÄŸ': 'ğ',
  'Äž': 'Ğ',
  'Ä±': 'ı',
  'Ä°': 'İ',
  'Ã¼': 'ü',
  'Ãœ': 'Ü',
  'Ã¶': 'ö',
  'Ã–': 'Ö',
  'Ã§': 'ç',
  'Ã‡': 'Ç',
  'â€¢': '•',
  'âš ': '⚠️'
};

for (const [broken, fixed] of Object.entries(charMap)) {
  content = content.split(broken).join(fixed);
}

// Targeted logic fixes if they got corrupted during previous attempts
content = content.replace(/BT\. TESTÄ°/g, 'BAĞLANTI TESTİ');
content = content.replace(/BT\. TESTİ/g, 'BAĞLANTI TESTİ');

// Fix the onClick again - being very flexible with potential corrupted residue
content = content.replace(
  /onClick=\{\(\) => toast\.success\('Sunucu yanıt verdi: Bağlantı Başarılı'\)\}/g,
  'onClick={testSmtpConnection}'
);

// Ensure function exists
if (!content.includes('const testSmtpConnection')) {
  const functionCode = `  const testSmtpConnection = async () => {
    const loadingToast = toast.loading('Bağlantı test ediliyor...');
    try {
      const response = await fetch('http://191.168.1.228:3001/api/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtp })
      });
      const data = await response.json();
      toast.dismiss(loadingToast);
      if (data.success) {
        toast.success('Bağlantı Başarılı!');
      } else {
        toast.error('Bağlantı Hatası: ' + data.error);
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Sunucuya erişilemiyor.');
    }
  };\n\n`;
  content = content.replace('const saveSmtp = (settings) => {', functionCode + 'const saveSmtp = (settings) => {');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Cleanup V3 applied.');
