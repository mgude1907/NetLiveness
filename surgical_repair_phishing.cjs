const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'netliveness-frontend/src/pages/Phishing.jsx');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Line 595 (Index 594)
lines[594] = '               <Plus size={18} strokeWidth={3} /> <span style={{ fontWeight: 800 }}>YENİ TEST BAŞLAT</span>';

// Line 740 (Index 739)
lines[739] = '                <ExternalLink size={16} /> CSV OLARAK DIŞA AKTAR';

// Line 949 (Index 948)
lines[948] = '                   <button className="btn btn-secondary" onClick={testSmtpConnection} style={{ height: 44, padding: "0 20px", borderRadius: 12, fontWeight: 800 }}>BAĞLANTI TESTİ</button>';

// Line 972 (Index 971)
lines[971] = '                      <b>Nasıl çalışır?</b> E-posta içindeki linklere tıklandığında, sunucumuz (IP: 191.168.1.228) bu isteği yakalar ve ihlal olarak kaydeder. ';

// Line 1150 (Index 1149)
lines[1149] = '                     {loading ? "HAZIRLANIYOR..." : "TESTİ ŞİMDİ BAŞLAT"}';

// Line 591 (Index 590) - Fixing the toasted message just in case
lines[590] = '            <button className="icon-btn-glass" onClick={() => toast.success(\'Veriler güncellendi\')} style={{ width: 40, height: 40, borderRadius: 12 }}>';

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Surgical repair of Phishing.jsx completed successfully.');
