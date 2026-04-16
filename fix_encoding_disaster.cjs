const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'netliveness-frontend/src/pages/Phishing.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Disaster mapping
const map = {
    'ü…Âž': 'Ş',
    '±': 'ı',
    '°': 'İ',
    'ü¼': 'ü',
    'ü§': 'ç',
    'ü¶': 'ö',
    'Ÿ': 'ğ',
    'â”€': '─',
    'ü–': 'Ö',
    'ü–': 'Ö' // Double check
};

// Also handle the YEN° case
content = content.replace(/YEN°/g, 'YENİ');

Object.keys(map).forEach(key => {
    const regex = new RegExp(key, 'g');
    content = content.replace(regex, map[key]);
});

// Final specific fixes for the most mangled parts
content = content.replace(/BAŞLAT/g, 'BAŞLAT'); // Just in case
content = content.replace(/ŞİMDİ/g, 'ŞİMDİ');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Encoding disaster fixed safely.');
