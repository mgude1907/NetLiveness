import { useEffect, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Users,
  LifeBuoy,
  ClipboardList,
  PenTool,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Database,
  Wifi,
  Zap,
  Monitor,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { loginUser, registerUser, getAwarenessTips } from '../api';

const IconMap = {
  Lock: <Lock size={24} />,
  ShieldCheck: <ShieldCheck size={24} />,
  AlertTriangle: <AlertTriangle size={24} />,
  Database: <Database size={24} />,
  Wifi: <Wifi size={24} />,
  Zap: <Zap size={24} />,
  Monitor: <Monitor size={24} />
};

const publicModules = [
  { name: 'Kurumsal Rehber', path: '/rehber', icon: Users, desc: 'Tüm personel iletişim bilgileri', color: '#3b82f6' },
  { name: 'Yardım Masası', path: '/yardim', icon: LifeBuoy, desc: 'Teknik destek talebi oluşturun', color: '#10b981' },
  { name: 'E-posta İmzası', path: '/imza', icon: PenTool, desc: 'Kurumsal imza oluşturucu', color: '#f59e0b' },
  { name: 'Sistem Anketleri', path: '/anketler', icon: ClipboardList, desc: 'Aktif anketlere katılım sağlayın', color: '#8b5cf6' },
];

export default function Login({ setAuth }) {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isReg, setIsReg] = useState(false);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [tips, setTips] = useState([]);
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    setMounted(true);
    getAwarenessTips().then(data => setTips(data));
  }, []);

  useEffect(() => {
    if (tips.length === 0) return;
    const it = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % tips.length);
    }, 10000);
    return () => clearInterval(it);
  }, [tips]);

  const submit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Kullanıcı adı ve şifre zorunludur.');
      return;
    }
    setLoading(true);
    try {
      if (isReg) {
        await registerUser({ username, password, fullName });
        toast.success('Hesap oluşturuldu. Giriş ekranına yönlendiriliyorsunuz.');
        setIsReg(false);
      } else {
        const data = await loginUser({ username, password });
        setAuth(data);
        localStorage.setItem('auth', JSON.stringify(data));
        toast.success('Hoş geldiniz.');
        navigate('/');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Giriş başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <style>{`
        html, body { margin: 0; padding: 0; background: #f8fafc; min-height: 100%; color: #0f172a; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideRight { from { transform: translateX(-30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes rotateMesh { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.2); } 100% { transform: rotate(360deg) scale(1); } }
        @keyframes glowPulse { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.4; } }
        @keyframes shine { 0% { left: -100%; } 20% { left: 100%; } 100% { left: 100%; } }
        
        .logo-shine {
          position: relative;
          overflow: hidden;
        }
        .logo-shine::after {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent);
          transform: skewX(-25deg);
          animation: shine 6s infinite ease-in-out;
        }

        .info-card { 
          transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1) !important; 
          backdrop-filter: blur(24px) !important;
          border: 1px solid rgba(0,0,0,0.04) !important;
          background: rgba(255,255,255,0.7) !important;
        }
        .info-card:hover { 
          transform: translateY(-8px) scale(1.02) !important; 
          background: rgba(255,255,255,0.95) !important; 
          border-color: rgba(245,158,11,0.3) !important; 
          box-shadow: 0 40px 80px rgba(15,23,42,0.1) !important;
        }
        .info-card:hover .icon-box-aura { transform: scale(1.1) rotate(3deg); filter: brightness(1.1); }
        
        .btn-primary:active { transform: scale(0.97); }
        .input-vibrant:focus { 
          border-color: #f59e0b !important; 
          background: rgba(245,158,11,0.04) !important; 
          box-shadow: 0 0 0 4px rgba(245,158,11,0.1), 0 0 20px rgba(245,158,11,0.05) !important; 
        }

        .bg-mesh-circle {
          position: fixed; border-radius: 50%; filter: blur(140px); z-index: 0; opacity: 0.15;
          animation: rotateMesh 30s infinite linear alternate; pointer-events: none;
        }
        
        @media (max-width: 1024px) {
          #login-split-root { flex-direction: column !important; overflow-y: auto !important; }
          #split-left { width: 100% !important; min-height: 500px !important; padding: 40px !important; }
          #split-right { width: 100% !important; padding: 60px 40px !important; }
        }
      `}</style>

      {/* Vibrant Mesh Background (Brightened) */}
      <div className="bg-mesh-circle" style={{ width: 1000, height: 1000, background: 'rgba(59, 130, 246, 0.2)', top: '-25%', left: '-15%' }} />
      <div className="bg-mesh-circle" style={{ width: 900, height: 900, background: 'rgba(245, 158, 11, 0.15)', bottom: '-20%', right: '-10%', animationDelay: '-7s' }} />
      <div className="bg-mesh-circle" style={{ width: 800, height: 800, background: 'rgba(59, 130, 246, 0.05)', top: '10%', left: '20%', filter: 'blur(180px)' }} />
      <div className="bg-mesh-circle" style={{ width: 700, height: 700, background: 'rgba(139, 92, 246, 0.15)', bottom: '15%', left: '10%', animationDelay: '-22s' }} />
      
      {/* Right-side subtle lighting mesh */}
      <div className="bg-mesh-circle" style={{ width: 500, height: 500, background: 'rgba(245, 158, 11, 0.08)', top: '10%', right: '-5%', filter: 'blur(120px)', zIndex: 0 }} />

      <div id="login-split-root" style={{ display: 'flex', width: '100%', height: '100vh', opacity: mounted ? 1 : 0, transition: 'opacity 1.2s ease', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        
        {/* â”€â”€â”€ LEFT PANEL (60%): INFO & AWARENESS (Morning Glass) â”€â”€â”€ */}
        <div id="split-left" style={leftPanelStyle}>
          {/* Subtle Grid + 4K Image Overlay */}
          <div style={backgroundOverlayStyle} />
          
          <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {/* Brand Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 40, animation: 'slideRight 1s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                <div style={logoBoxStyle}>
                  <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', background: 'rgba(245,158,11,0.35)', filter: 'blur(40px)', animation: 'glowPulse 3s infinite' }} />
                  <span style={{ position: 'relative', color: '#0f172a', fontSize: 52, fontWeight: 900, letterSpacing: 2 }}>REPKON</span>
                </div>
              </div>

              {/* Awareness HUD */}
              <div style={{ maxWidth: 750, marginTop: 40, animation: 'fadeIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s backwards' }}>
                <div style={awarenessHeaderStyle}>
                   <div style={{ width: 40, height: 2, background: '#f59e0b', borderRadius: 2 }} />
                   <span>KURUMSAL SİBER FARKINDALIK VE GÜVENLİK PANOSU</span>
                </div>
                
                <div key={currentTip} style={{ minHeight: 200, marginTop: 24, animation: 'fadeIn 1s ease' }}>
                   <h2 style={tipTitleStyle}>{tips[currentTip]?.title || 'Giriş Kimlik Bilgileri'}</h2>
                   <p style={tipTextStyle}>{tips[currentTip]?.text || 'Kurumsal hesap bilgileriniz şifreli tüneller üzerinden doğrulanmaktadır.'}</p>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 40 }}>
                  {tips.length > 0 ? tips.map((_, i) => (
                    <div key={i} style={{ height: 4, flex: 1, borderRadius: 10, background: i === currentTip ? '#f59e0b' : 'rgba(15,23,42,0.06)', transition: 'all 0.8s ease' }} />
                  )) : [1,2,3,4].map(i => <div key={i} style={{ height: 4, flex: 1, borderRadius: 10, background: 'rgba(15,23,42,0.06)' }} />)}
                </div>
              </div>
            </div>

            {/* Quick Access Grid (Glassmorphism 2.0 Refined) */}
            <div style={{ animation: 'fadeIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.6s backwards' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                  <div style={{ width: 24, height: 2, background: '#f59e0b', borderRadius: 10 }} />
                  <div style={{ fontSize: 13, fontWeight: 950, color: '#f59e0b', letterSpacing: 4.5, textTransform: 'uppercase', textShadow: '0 0 20px rgba(245,158,11,0.3)' }}>Hızlı Erişim Portalları</div>
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, maxWidth: 900 }}>
                  {publicModules.map((m, idx) => (
                    <NavLink 
                      key={m.path} 
                      to={m.path} 
                      className="info-card" 
                      style={{
                        ...moduleCardStyle,
                        animation: `fadeIn 0.8s ease ${0.7 + idx * 0.15}s backwards`
                      }}
                    >
                      <div className="icon-box-aura" style={{ ...moduleIconStyle, color: m.color, background: `${m.color}15`, boxShadow: `0 0 20px ${m.color}10` }}>
                        <m.icon size={22} style={{ transition: 'all 0.4s ease' }} />
                      </div>
                      <div>
                       <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', letterSpacing: '0.2px' }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: 'rgba(15,23,42,0.45)', marginTop: 4, fontWeight: 500, lineHeight: 1.4 }}>{m.desc}</div>
                      </div>
                    </NavLink>
                  ))}
               </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT PANEL (40%): AUTH FORM (Frosted Metal) ─── */}
        <div id="split-right" style={rightPanelStyle}>
          <div style={{ width: '100%', maxWidth: 440, animation: 'fadeIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.8s backwards', position: 'relative', zIndex: 1 }}>
            {/* Security Status HUD Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, padding: '8px 16px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: 100, width: 'fit-content' }}>
               <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981', animation: 'glowPulse 2s infinite' }} />
               <span style={{ fontSize: 10, fontWeight: 900, color: '#10b981', letterSpacing: 1.5, textTransform: 'uppercase' }}>System Security: Armored</span>
            </div>

            <div style={{ marginBottom: 32 }}>
              <div style={{ width: 44, height: 4, background: '#f59e0b', borderRadius: 2, marginBottom: 24 }} />
              <h3 style={{ fontSize: 28, fontWeight: 950, color: '#0f172a', marginBottom: 12, lineHeight: 1.25, letterSpacing: -0.8 }}>
                <span style={{ color: '#f59e0b', display: 'block', fontSize: 14, letterSpacing: 6, textTransform: 'uppercase', marginBottom: 10, fontWeight: 800 }}>REPKON</span>
                DİJİTAL SİSTEMLER <br/>
                <span style={{ fontSize: 22, color: 'rgba(15,23,42,0.25)', fontWeight: 800, letterSpacing: -0.5 }}>PANELİ GİRİŞ</span>
              </h3>
              <div style={{ width: '60%', height: 1, background: 'linear-gradient(to right, rgba(245,158,11,0.3), transparent)', marginBottom: 24 }} />
              <p style={{ color: 'rgba(15,23,42,0.4)', fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>Kimlik doğrulama protokollerini başlatmak için portal anahtarınızı girin.</p>
            </div>

            <form onSubmit={submit} style={{ display: 'grid', gap: 24 }}>
              {isReg && (
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Personel Ad Soyad</label>
                  <input className="input-vibrant" style={inputStyle} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Örn: Mustafa G." required />
                </div>
              )}

              <div style={formGroupStyle}>
                <label style={labelStyle}>Kullanıcı Kimliği</label>
                <input className="input-vibrant" style={inputStyle} value={username} onChange={e => setUsername(e.target.value)} placeholder="" autoComplete="username" required />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Erişim Anahtarı</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPass ? 'text' : 'password'} 
                    className="input-vibrant"
                    style={inputStyle} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    autoComplete="current-password" 
                    required 
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={eyeBtnStyle}>
                    {showPass ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary" style={submitBtnStyle}>
                {loading ? 'KİMLİK DOĞRULANIYOR...' : isReg ? 'KAYIT TALEBİ GÖNDER' : 'SİSTEME GİRİŞ YAP'}
                {!loading && <ArrowRight size={22} />}
              </button>
            </form>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
               <button onClick={() => setIsReg(!isReg)} style={toggleBtnStyle}>
                 {isReg ? 'KİMLİK BİLGİLERİYLE OTURUM AÇ' : 'YENİ PERSONEL ERİŞİM TALEBİ'}
               </button>
            </div>

            {/* Bottom Security Badges */}
            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 20, padding: '20px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
               {[
                 { icon: Lock, label: 'AES-256' },
                 { icon: ShieldCheck, label: 'ISO 27001' },
                 { icon: KeyRound, label: 'MFA READY' }
               ].map((b, i) => (
                 <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: 0.4 }}>
                    <b.icon size={16} color="#f59e0b" />
                    <span style={{ fontSize: 9, fontWeight: 900, color: '#0f172a', letterSpacing: 1 }}>{b.label}</span>
                 </div>
               ))}
            </div>
          </div>
          
          {/* Global Status Footer */}
          <div style={{ position: 'absolute', bottom: 48, color: 'rgba(15,23,42,0.1)', fontSize: 10, fontWeight: 900, letterSpacing: 3, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 10px rgba(245,158,11,0.4)' }} />
            REPKON DİJİTAL SİSTEMLER PANELİ
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Vibrant morning component styles ──

const containerStyle = {
  minHeight: '100vh',
  width: '100%',
  background: '#f8fafc',
  fontFamily: "'Inter', sans-serif"
};

const leftPanelStyle = {
  width: '60%',
  position: 'relative',
  padding: '60px 80px',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  background: 'radial-gradient(circle at 40% 40%, rgba(59,130,246,0.05) 0%, transparent 60%)'
};

const rightPanelStyle = {
  width: '40%',
  background: 'radial-gradient(circle at 70% 30%, rgba(245,158,11,0.08) 0%, #ffffff 70%)',
  backdropFilter: 'blur(40px)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '60px',
  position: 'relative',
  borderLeft: '1px solid rgba(15,23,42,0.04)',
  boxShadow: '-20px 0 50px rgba(15,23,42,0.02)'
};

const backgroundOverlayStyle = {
  position: 'absolute',
  inset: 0,
  backgroundImage: 'url("/repkon-4k-bg.png")',
  backgroundSize: 'cover',
  backgroundPosition: 'center 40%',
  opacity: 0.12,
  filter: 'brightness(0.8) contrast(1.2) grayscale(0.8)',
  maskImage: 'linear-gradient(to right, black 85%, transparent)'
};

const logoBoxStyle = {
  width: 400, height: 100, borderRadius: 24,
  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
  display: 'grid', placeItems: 'center',
  boxShadow: '0 30px 70px rgba(245,158,11,0.45), 0 0 100px rgba(245,158,11,0.1)',
  position: 'relative',
  border: '2px solid rgba(255,255,255,0.2)'
};

const titleStyle = { fontSize: 52, fontWeight: 950, color: '#0f172a', letterSpacing: -2.5, margin: 0, lineHeight: 1 };
const subtitleStyle = { fontSize: 10, fontWeight: 900, color: 'rgba(15,23,42,0.3)', letterSpacing: 4, marginTop: 6 };

const awarenessHeaderStyle = { display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, fontWeight: 900, color: '#f59e0b', letterSpacing: 2.5, marginBottom: 28 };
const tipTitleStyle = { fontSize: 34, fontWeight: 950, color: '#0f172a', marginBottom: 12, letterSpacing: -1.2, lineHeight: 1.1 };
const tipTextStyle = { fontSize: 16, color: 'rgba(15,23,42,0.5)', lineHeight: 1.6, fontWeight: 500 };

const moduleCardStyle = {
  display: 'flex', alignItems: 'center', gap: 20, padding: '16px 24px', borderRadius: 28, 
  background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(15,23,42,0.05)',
  textDecoration: 'none', transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
  backdropFilter: 'blur(10px)'
};

const moduleIconStyle = { 
  width: 48, height: 48, borderRadius: 14, 
  background: 'rgba(15,23,42,0.04)', color: '#f59e0b',
  display: 'grid', placeItems: 'center',
  transition: 'all 0.4s ease'
};

const formGroupStyle = { display: 'grid', gap: 8 };
const labelStyle = { fontSize: 12, fontWeight: 900, color: 'rgba(15,23,42,0.3)', textTransform: 'uppercase', letterSpacing: 1.5 };
const inputStyle = { 
  width: '100%', height: 60, background: 'rgba(15,23,42,0.02)', 
  border: '1px solid rgba(15,23,42,0.1)', borderRadius: 18, 
  padding: '0 24px', color: '#0f172a', outline: 'none', transition: 'all 0.3s ease',
  fontSize: 16, fontWeight: 600
};
const eyeBtnStyle = { position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(15,23,42,0.3)' };

const submitBtnStyle = {
  marginTop: 8, height: 56, borderRadius: 20, 
  background: 'linear-gradient(to right, #f59e0b, #fbbf24)', border: 'none',
  color: '#000', fontSize: 16, fontWeight: 950, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
  boxShadow: '0 15px 40px rgba(245,158,11,0.25)', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
};

const toggleBtnStyle = { background: 'none', border: 'none', color: 'rgba(15,23,42,0.3)', fontSize: 12, fontWeight: 800, cursor: 'pointer', letterSpacing: 1, transition: 'color 0.3s' };
