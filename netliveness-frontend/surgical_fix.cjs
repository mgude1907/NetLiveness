const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Phishing.jsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  // If line contains broken bits AND we know it should be the password label
  if (lines[i].includes('ifre / Uygulama')) {
    lines[i] = '                      <label style={{ display: \'block\', fontSize: 12, fontWeight: 900, color: \'var(--text-3)\', textTransform: \'uppercase\', marginBottom: 8 }}>Şifre / Uygulama Şifresi</label>';
  }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Surgical line repair completed.');
