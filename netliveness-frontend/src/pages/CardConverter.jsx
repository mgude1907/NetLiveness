import { useState, useEffect, useCallback, useRef } from 'react';
import { getPersonnel } from '../api';
import { 
  CreditCard, ArrowRight, UserCheck, UserX, Search, Users, 
  Mail, Copy, Check, Info, Briefcase, Building2, Repeat, 
  Hash, ShieldCheck, X, ChevronRight, UserCircle, Stars
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CardConverter() {
  const [personnels, setPersonnels] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [meyer, setMeyer] = useState('');
  const [yazici, setYazici] = useState('');
  const [unilever, setUnilever] = useState('');
  const [macgal, setMacgal] = useState('');
  
  const [personnelMatch, setPersonnelMatch] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Fetch personnel to match card numbers
  useEffect(() => {
    loadPersonnel();
  }, []);

  const loadPersonnel = async () => {
    try {
      const data = await getPersonnel();
      setPersonnels(Array.isArray(data) ? data : []);
    } catch { toast.error('Personel rehberi yüklenemedi.'); }
  };

  const checkPersonnel = useCallback((meyerDecOrStr) => {
    if (!meyerDecOrStr) {
      setPersonnelMatch(null);
      return;
    }
    const match = personnels.find(p => p.kartNo === String(meyerDecOrStr));
    setPersonnelMatch(match || false);
  }, [personnels]);

  // Unified Conversion Logic
  const convertFromMeyer = (val) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      const m = num >>> 0;
      setMeyer(val);
      setMacgal(m.toString(10));
      setYazici(m.toString(16).toUpperCase().padStart(8, '0'));
      const uni = ((m >>> 24) | ((m >>> 8) & 0x0000FF00) | ((m << 8) & 0x00FF0000) | ((m << 24) >>> 0)) >>> 0;
      setUnilever(uni.toString(10));
      checkPersonnel(m);
    } else {
      clearAll();
      setMeyer(val);
    }
  };

  const handleMeyer = (val) => {
    if (isConverting) return;
    setIsConverting(true);
    convertFromMeyer(val);
    setTimeout(() => setIsConverting(false), 20);
  };

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
      setTimeout(() => setIsConverting(false), 20);
    } else { clearAll(); setYazici(val); }
  };

  const handleUnilever = (val) => {
    if (isConverting) return;
    setUnilever(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      setIsConverting(true);
      const u = num >>> 0;
      const y = ((u >>> 24) | ((u >>> 8) & 0x0000FF00) | ((u << 8) & 0x00FF0000) | ((u << 24) >>> 0)) >>> 0;
      setMeyer(y.toString(10));
      setMacgal(y.toString(10));
      setYazici(y.toString(16).toUpperCase().padStart(8, '0'));
      checkPersonnel(y);
      setTimeout(() => setIsConverting(false), 20);
    } else { clearAll(); setUnilever(val); }
  };

  const clearAll = () => {
    setMeyer(''); setYazici(''); setUnilever(''); setMacgal('');
    setPersonnelMatch(null);
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Kopyalandı!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const sendUnileverEmail = () => {
    if (!unilever) {
      toast.error('Önce bir kart numarası seçmelisiniz.');
      return;
    }
    const recipients = "umraniye.cctv@unilever.com, Kemal.Sen@unilever.com";
    const subject = encodeURIComponent("Personel Kart Kaydı Talebi");
    const personName = personnelMatch ? personnelMatch.adSoyad : "[Personel Adı]";
    const body = encodeURIComponent(
      `Sayın yetkili,\n\n${unilever} numaralı (${personName}) kişinin sisteminize eklenmesi konusunda destek olabilirmisiniz?\n\nİyi çalışmalar.`
    );
    window.location.href = `mailto:${recipients}?subject=${subject}&body=${body}`;
  };

  const selectPerson = (p) => {
    if (p.kartNo) {
      convertFromMeyer(p.kartNo);
      toast.success(`${p.adSoyad} bilgileri yüklendi.`);
    } else {
      toast.error('Bu personelin kart numarası sistemde tanımlı değil.');
    }
    setShowPicker(false);
  };

  const filteredPersonnel = personnels.filter(p => 
    p.adSoyad?.toLocaleLowerCase('tr').includes(searchQuery.toLocaleLowerCase('tr')) ||
    p.sicilNo?.includes(searchQuery)
  );

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <div className="icon-box-sm icon-green">
                <CreditCard size={18} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-1)', letterSpacing: '-0.5px' }}>Kart Dönüştürücü & Sorgulama</h2>
           </div>
           <p style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>Sistemler arası otomatik byte sıralama (Endian Swap) ve veri eşleştirme merkezi.</p>
        </div>
        
        <button className="btn btn-primary" onClick={() => setShowPicker(true)}>
           <Search size={16} /> Personel Ara / Kart Bul
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '440px 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* ─── Input Sidebar ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div className="card" style={{ padding: 24, borderRadius: 28 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div className="icon-box-sm icon-slate">
                   <Repeat size={16} />
                </div>
                <span style={{ fontWeight: 800, fontSize: 15 }}>Değer Girişi</span>
             </div>

             <div style={{ display: 'grid', gap: 18 }}>
                <ConversionInput 
                  label="Meyer (Decimal / Standart)" 
                  value={meyer} 
                  onChange={handleMeyer} 
                  onCopy={() => copyToClipboard(meyer, 'meyer')}
                  isCopied={copiedField === 'meyer'}
                />

                <ConversionInput 
                  label="Yazıcı (Hexadecimal)" 
                  value={yazici} 
                  onChange={handleYazici} 
                  onCopy={() => copyToClipboard(yazici, 'yazici')}
                  isCopied={copiedField === 'yazici'}
                  placeholder="0000XXXX"
                />

                <div className="form-group" style={{ position: 'relative' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>Unilever (Endian Swapped)</label>
                      <button 
                        onClick={sendUnileverEmail}
                        className="btn btn-icon" 
                        style={{ width: 28, height: 28, background: 'var(--blue-soft)', borderColor: 'var(--blue-border)', color: 'var(--blue-text)' }}
                        title="Unilever'e Mail At"
                      >
                         <Mail size={14} />
                      </button>
                   </div>
                   <div style={{ position: 'relative' }}>
                      <input 
                        className="form-input" 
                        style={{ paddingRight: 45, fontWeight: 'bold', letterSpacing: 1 }}
                        value={unilever} 
                        onChange={e => handleUnilever(e.target.value)} 
                        placeholder="Endian Swap Değeri"
                      />
                      <button 
                        onClick={() => copyToClipboard(unilever, 'uni')} 
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
                      >
                         {copiedField === 'uni' ? <Check size={14} color="var(--green)" /> : <Copy size={14} />}
                      </button>
                   </div>
                </div>

                <ConversionInput 
                  label="Macgal (Decimal)" 
                  value={macgal} 
                  onChange={handleMeyer} 
                  onCopy={() => copyToClipboard(macgal, 'macgal')}
                  isCopied={copiedField === 'macgal'}
                />
             </div>

             <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-inset)', borderRadius: 16, border: '1px dashed var(--border)' }}>
                <div style={{ display: 'flex', gap: 10 }}>
                   <Info size={16} color="var(--text-3)" style={{ marginTop: 2 }} />
                   <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>
                      Herhangi bir alana değer girmeniz yeterlidir. Diğer alanlar <strong>32-bit Matematiksel Dönüşüm</strong> formülleriyle anlık hesaplanır.
                   </p>
                </div>
             </div>
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#fff', border: 'none', padding: 24, borderRadius: 24 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
                   <ShieldCheck size={20} color="var(--amber)" />
                </div>
                <span style={{ fontWeight: 800 }}>Teknik Algoritma</span>
             </div>
             <p style={{ fontSize: 12, opacity: 0.7, lineHeight: 1.6 }}>
                Sistem; 32-bit tam sayı değerini byte dizisine ayırır, sırasını tersine çevirir (Endianness) ve yeni tamsayıyı oluşturur. Hexadecimal dönüşümler IEEE bit gösterimine uygundur.
             </p>
          </div>
        </div>

        {/* ─── Result & Status Section ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
           
           <div className="card" style={{ padding: 32, borderRadius: 32, border: personnelMatch ? '1.5px solid var(--green-border)' : '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                 <div style={{ 
                    width: 80, height: 80, borderRadius: 24, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: personnelMatch === null ? 'var(--bg-inset)' : (personnelMatch ? 'var(--green-soft)' : 'var(--red-soft)'),
                    color: personnelMatch === null ? 'var(--text-3)' : (personnelMatch ? 'var(--green)' : 'var(--red)'),
                    transition: 'all 0.3s'
                 }}>
                    {personnelMatch === null ? <UserCircle size={40} /> : (personnelMatch ? <UserCheck size={40} /> : <UserX size={40} />)}
                 </div>

                 <div style={{ flex: 1 }}>
                    {personnelMatch === null ? (
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-1)' }}>Personel Bekleniyor</div>
                        <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Kart numarasını manuel girin veya rehberden arama yapın.</p>
                      </div>
                    ) : personnelMatch === false ? (
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--red-text)' }}>Personel Bulunamadı</div>
                        <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Bu kart numarası ({meyer}) herhangi bir personele atanmamış.</p>
                      </div>
                    ) : (
                      <div className="animate-in">
                         <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <div className="badge badge-green">AKTİF KAYIT</div>
                            <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 700 }}>Sicil: {personnelMatch.sicilNo}</span>
                         </div>
                         <div style={{ fontSize: 24, fontWeight: 950, color: 'var(--text-1)', letterSpacing: '-0.5px' }}>{personnelMatch.adSoyad}</div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>
                               <Building2 size={16} color="var(--text-3)" /> {personnelMatch.firma}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>
                               <Hash size={16} color="var(--text-3)" /> Bölüm: {personnelMatch.bolum}
                            </div>
                         </div>
                      </div>
                    )}
                 </div>

                 {personnelMatch && (
                   <button 
                    onClick={() => { window.location.href = `/cv/${personnelMatch.sicilNo}`; }}
                    className="btn btn-ghost" 
                    style={{ borderRadius: 16, padding: '12px 20px' }}
                   >
                     Detaylı Gör <ChevronRight size={16} />
                   </button>
                 )}
              </div>
           </div>

           {/* Visualization of Endian Swap */}
           <div className="card" style={{ padding: 24, borderRadius: 28, background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                 <div className="icon-box-sm icon-amber">
                    <Stars size={16} />
                 </div>
                 <span style={{ fontWeight: 800, fontSize: 15 }}>Unilever Endian Sıralaması</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0', gap: 10 }}>
                 <ByteBox byte={(yazici?.slice(0, 2) || '00')} label="B1" color="#f59e0b" />
                 <ByteBox byte={(yazici?.slice(2, 4) || '00')} label="B2" color="#475569" />
                 <ByteBox byte={(yazici?.slice(4, 6) || '00')} label="B3" color="#475569" />
                 <ByteBox byte={(yazici?.slice(6, 8) || '00')} label="B4" color="#22c55e" />
                 <div style={{ padding: '0 10px', color: 'var(--text-3)' }}><ArrowRight /></div>
                 <ByteBox byte={(yazici?.slice(6, 8) || '00')} label="B4" color="#22c55e" />
                 <ByteBox byte={(yazici?.slice(4, 6) || '00')} label="B3" color="#475569" />
                 <ByteBox byte={(yazici?.slice(2, 4) || '00')} label="B2" color="#475569" />
                 <ByteBox byte={(yazici?.slice(0, 2) || '00')} label="B1" color="#f59e0b" />
              </div>
              <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', marginTop: 10 }}>
                 Byte dizilimi CPU mimarisine göre <strong>Little-Endian</strong>'dan <strong>Big-Endian</strong>'a dönüştürülür.
              </p>
           </div>
        </div>
      </div>

      {/* Personnel Picker Modal */}
      {showPicker && (
        <div className="modal-overlay" onClick={() => setShowPicker(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h2><Users size={20} /> Personel Seçimi</h2>
              <button className="icon-btn" onClick={() => setShowPicker(false)}><X size={18} /></button>
            </div>
            
            <div className="search-bar" style={{ marginBottom: 16 }}>
               <Search size={18} />
               <input 
                 className="form-input" 
                 style={{ border: 'none', boxShadow: 'none' }}
                 placeholder="İsim, Bölüm veya Sicil No ile ara..." 
                 value={searchQuery} 
                 onChange={e => setSearchQuery(e.target.value)}
                 autoFocus
               />
            </div>

            <div style={{ maxHeight: 450, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
               {filteredPersonnel.map(p => (
                 <div 
                   key={p.id} 
                   className="list-item" 
                   onClick={() => selectPerson(p)}
                   style={{ 
                     padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                     display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                     transition: 'all 0.15s', border: '1px solid transparent'
                   }}
                   onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-inset)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                   onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                 >
                   <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-1)' }}>{p.adSoyad}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>{p.bolum} — Kart: {p.kartNo || 'Tanımsız'}</div>
                   </div>
                   <span className="badge badge-neutral" style={{ fontSize: 10 }}>{p.firma}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConversionInput({ label, value, onChange, onCopy, isCopied, placeholder }) {
  return (
    <div className="form-group">
       <label className="form-label">{label}</label>
       <div style={{ position: 'relative' }}>
          <input 
            className="form-input" 
            style={{ paddingRight: 45, fontWeight: 'bold', letterSpacing: 1 }}
            value={value} 
            onChange={e => onChange(e.target.value)} 
            placeholder={placeholder}
          />
          <button 
            onClick={onCopy} 
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
          >
             {isCopied ? <Check size={14} color="var(--green)" /> : <Copy size={14} />}
          </button>
       </div>
    </div>
  );
}

function ByteBox({ byte, label, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
       <div style={{ 
          width: 32, height: 32, background: 'var(--bg-page)', 
          border: `2px solid ${color}`, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 900, color: 'var(--text-1)'
       }}>
          {byte}
       </div>
       <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-3)', marginTop: 4 }}>{label}</div>
    </div>
  );
}
