const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Phishing.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Regex to fix line 937 and similar ones
// Searches for a label containing Åž followed by "ifre"
content = content.replace(/<label[^>]*>.*Åžifre.*<\/label>/g, (match) => {
  return match.replace(/Åžifre/g, 'Şifre');
});

// Broad cleanup for any remaining Åž and similar patterns
const cleanupMap = {
  '\u00C5\u017D': 'Ş',
  '\u00C5\u0178': 'ş',
  '\u00C3\u0153': 'Ü',
  '\u00C3\u0178': 'ü',
  '\u00C3\u2013': 'Ö',
  '\u00C3\u00B6': 'ö',
  '\u00C3\u2021': 'Ç',
  '\u00C3\u00A7': 'ç',
  '\u00C4\u0130': 'İ',
  '\u00C4\u0131': 'ı',
  '\u00C4\u011E': 'Ğ',
  '\u00C4\u011F': 'ğ',
  'Åž': 'Ş',
  'ÅŸ': 'ş'
};

for (const [broken, fixed] of Object.entries(cleanupMap)) {
  content = content.split(broken).join(fixed);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Hex fix applied.');
