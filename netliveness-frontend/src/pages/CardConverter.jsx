import { useState, useEffect, useCallback } from 'react';
import { getPersonnel } from '../api';
import { CreditCard, ArrowRight, UserCheck, UserX } from 'lucide-react';

export default function CardConverter() {
  const [personnels, setPersonnels] = useState([]);
  const [meyer, setMeyer] = useState('');
  const [yazici, setYazici] = useState('');
  const [unilever, setUnilever] = useState('');
  const [macgal, setMacgal] = useState('');
  
  const [personnelMatch, setPersonnelMatch] = useState(null);
  const [isConverting, setIsConverting] = useState(false);

  // Fetch personnel to match card numbers
  useEffect(() => {
    getPersonnel().then(setPersonnels).catch(console.error);
  }, []);

  const checkPersonnel = useCallback((meyerDecOrStr) => {
    if (!meyerDecOrStr) {
      setPersonnelMatch(null);
      return;
    }
    const match = personnels.find(p => p.kartNo === String(meyerDecOrStr));
    setPersonnelMatch(match || false); // false means 'not found', null means 'empty input'
  }, [personnels]);

  // Handle Meyer Input
  const handleMeyer = (val) => {
    if (isConverting) return;
    setMeyer(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      setIsConverting(true);
      const m = num >>> 0; // force unsigned 32-bit
      setYazici(m.toString(16).toUpperCase().padStart(8, '0'));
      setMacgal(m.toString(10));
      
      const uni = ((m >>> 24) | ((m >>> 8) & 0x0000FF00) | ((m << 8) & 0x00FF0000) | ((m << 24) >>> 0)) >>> 0;
      setUnilever(uni.toString(10));
      
      checkPersonnel(m);
      setTimeout(() => setIsConverting(false), 50);
    } else {
      clearAll(val);
    }
  };

  // Handle Yazıcı (Hex) Input
  const handleYazici = (val) => {
    if (isConverting) return;
    setYazici(val);
    const num = parseInt(val, 16);
    if (!isNaN(num) && num >= 0 && val.trim() !== '') {
      setIsConverting(true);
      const y = num >>> 0;
      setMeyer(y.toString(10));
      setMacgal(y.toString(10));
      
      const uni = ((y >>> 24) | ((y >>> 8) & 0x0000FF00) | ((y << 8) & 0x00FF0000) | ((y << 24) >>> 0)) >>> 0;
      setUnilever(uni.toString(10));
      
      checkPersonnel(y);
      setTimeout(() => setIsConverting(false), 50);
    } else {
      clearAll(val, 'yazici');
    }
  };

  // Handle Unilever (Endian Swapped) Input
  const handleUnilever = (val) => {
    if (isConverting) return;
    setUnilever(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      setIsConverting(true);
      const u = num >>> 0;
      // Reverse the swap to get original Meyer
      const y = ((u >>> 24) | ((u >>> 8) & 0x0000FF00) | ((u << 8) & 0x00FF0000) | ((u << 24) >>> 0)) >>> 0;
      setMeyer(y.toString(10));
      setMacgal(y.toString(10));
      setYazici(y.toString(16).toUpperCase().padStart(8, '0'));
      
      checkPersonnel(y);
      setTimeout(() => setIsConverting(false), 50);
    } else {
      clearAll(val, 'unilever');
    }
  };

  // Handle Macgal Input (Same as Meyer)
  const handleMacgal = (val) => {
    if (isConverting) return;
    setMacgal(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      setIsConverting(true);
      const m = num >>> 0;
      setMeyer(m.toString(10));
      setYazici(m.toString(16).toUpperCase().padStart(8, '0'));
      
      const uni = ((m >>> 24) | ((m >>> 8) & 0x0000FF00) | ((m << 8) & 0x00FF0000) | ((m << 24) >>> 0)) >>> 0;
      setUnilever(uni.toString(10));
      
      checkPersonnel(m);
      setTimeout(() => setIsConverting(false), 50);
    } else {
      clearAll(val, 'macgal');
    }
  };

  const clearAll = (val, excludeField = 'meyer') => {
    if (excludeField !== 'meyer') setMeyer('');
    if (excludeField !== 'yazici') setYazici('');
    if (excludeField !== 'unilever') setUnilever('');
    if (excludeField !== 'macgal') setMacgal('');
    
    if (!val || val.trim() === '') setPersonnelMatch(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Kart Dönüştürücü</h2>
          <p>Meyer, Yazıcı, Unilever ve Macgal sistemleri arası otomatik kart dönüşümü</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, alignItems: 'start' }}>
        <div className="card">
          <div className="card-header">
            <h3><CreditCard size={18} style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--accent-green)' }} /> Kart Veri Girişi</h3>
          </div>
          
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            Herhangi bir alana değer girmeniz yeterlidir. Diğer sistemlerdeki karşılıkları otomatik olarak 32-bit (Endian Swap) ve Hex matematik formülleriyle anında hesaplanacaktır.
          </p>

          <div className="form-group">
            <label>Meyer (Decimal)</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Örn: 10425" 
              value={meyer} 
              onChange={e => handleMeyer(e.target.value)} 
              style={{ fontSize: 16, fontFamily: 'monospace', letterSpacing: 1 }}
            />
          </div>

          <div className="form-group">
            <label>Yazıcı (Hexadecimal)</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Örn: 000028B9" 
              value={yazici} 
              onChange={e => handleYazici(e.target.value)} 
              style={{ fontSize: 16, fontFamily: 'monospace', letterSpacing: 1 }}
            />
          </div>

          <div className="form-group">
            <label>Unilever (Endian Swapped)</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Decimal gösterim" 
              value={unilever} 
              onChange={e => handleUnilever(e.target.value)} 
              style={{ fontSize: 16, fontFamily: 'monospace', letterSpacing: 1 }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Macgal (Decimal)</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Meyer ile aynıdır" 
              value={macgal} 
              onChange={e => handleMacgal(e.target.value)} 
              style={{ fontSize: 16, fontFamily: 'monospace', letterSpacing: 1 }}
            />
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h3><UserCheck size={18} style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--accent-blue)' }} /> Personel Durumu</h3>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ 
                width: 50, height: 50, borderRadius: 'var(--radius-md)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: personnelMatch === null ? 'var(--bg-input)' : (personnelMatch ? 'var(--accent-green-dim)' : 'var(--accent-red-dim)'),
                color: personnelMatch === null ? 'var(--text-muted)' : (personnelMatch ? 'var(--accent-green)' : 'var(--accent-red)')
              }}>
                {personnelMatch === null ? <ArrowRight size={24} /> : (personnelMatch ? <UserCheck size={24} /> : <UserX size={24} />)}
              </div>

              <div>
                {personnelMatch === null && (
                  <>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-secondary)' }}>Kart Numarası Bekleniyor</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Lütfen soldaki alanlardan birine kart okutunuz.</div>
                  </>
                )}
                {personnelMatch === false && (
                  <>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent-red)' }}>Personel Bulunamadı</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Bu numaraya ({meyer}) kayıtlı personel sistemde yoktur.</div>
                  </>
                )}
                {personnelMatch && (
                  <>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent-green)' }}>{personnelMatch.adSoyad}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{personnelMatch.bolum} {personnelMatch.gorev ? `- ${personnelMatch.gorev}` : ''}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 12 }}>
                      {personnelMatch.firma && <span>Firma: {personnelMatch.firma}</span>}
                      {personnelMatch.sicilNo && <span>Sicil No: {personnelMatch.sicilNo}</span>}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="card" style={{ background: 'rgba(245, 197, 24, 0.03)', borderColor: 'var(--border-light)' }}>
            <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--accent-green)', marginBottom: 12, letterSpacing: 0.5 }}>Teknik Bilgi</h4>
            <ul style={{ fontSize: 13, color: 'var(--text-secondary)', paddingLeft: 18, lineHeight: 1.6 }}>
              <li><strong>Meyer</strong> ve <strong>Macgal</strong> kart numaraları sistemde 10'luk tabanda (Decimal) tutulmaktadır.</li>
              <li><strong>Yazıcı</strong> sistemleri Meyer numarasının bilgisayar dilindeki (16'lık taban / Hexadecimal) eşdeğeridir.</li>
              <li><strong>Unilever</strong> sistemleri ise 32-bit sistemlerde yaşanan byte sıralama farklılığından dolayı (<a href="https://en.wikipedia.org/wiki/Endianness" target="_blank" style={{ color:'var(--accent-blue)' }}>Endian Swap</a>) tersten okunarak elde edilmiş decimal değerdir.</li>
            </ul>
          </div>
          
        </div>
      </div>
    </div>
  );
}
