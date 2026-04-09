import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../api';
import {
  Eye, EyeOff, Activity, Shield, Users, Zap, BarChart2, Lock,
  ArrowRight, ChevronRight, CircleCheck, Search, HelpCircle,
  FileText, ArrowUp, X, Key, ChevronUp, Bell, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login({ setAuth }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isReg, setIsReg] = useState(false);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  
  // UI State
  const [showPanel, setShowPanel] = useState(false);
  const [mounted, setMounted] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

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
        toast.success('Hesap oluşturuldu! Giriş yapılıyor…');
        setIsReg(false);
      } else {
        const data = await loginUser({ username, password });
        setAuth(data);
        localStorage.setItem('auth', JSON.stringify(data));
        toast.success(`Hoş geldiniz!`);
        navigate('/');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || (isReg ? 'Kayıt başarısız.' : 'Kullanıcı adı veya şifre hatalı.');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const publicModules = [
    { name: 'Kurumsal Rehber', path: '/rehber', icon: Users, color: '#3b82f6' },
    { name: 'Yardım Masası', path: '/yardim', icon: MessageSquare, color: '#ef4444' },
    { name: 'Anketler', path: '/anketler', icon: Bell, color: '#f59e0b' }
  ];

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif",
      background: '#000'
    }}>
      {/* ─── Unified Background (Sync with Survey/Directory) ─── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url("/bg-login-3.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transform: showPanel ? 'scale(1.03)' : 'scale(1)',
        transition: 'transform 1.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
        filter: showPanel ? 'blur(15px) brightness(0.4)' : 'brightness(0.7)',
      }} />

      {/* ─── Consistent Dark Overlay ─── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 1
      }} />

      {/* ─── Refined Brand Header ─── */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        padding: '24px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'none' : 'translateY(-10px)',
        transition: 'all 0.8s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 15px rgba(245,158,11,0.4)'
          }}>
            <Activity size={20} color="#fff" />
          </div>
          <div style={{ color: '#fff' }}>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.5 }}>REPKON</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 2 }}>Dijital Sistemler</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: 1 }}>V4.0.2</div>
      </div>

      {/* ─── Refined Hero Section ─── */}
      <div style={{
        position: 'relative',
        zIndex: 5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: showPanel ? 0 : 1,
        visibility: showPanel ? 'hidden' : 'visible',
        transition: 'all 0.4s ease'
      }}>
        <div style={{ textAlign: 'center', maxWidth: 700, padding: '0 20px' }}>
          <h1 style={{ 
            fontSize: 'max(3.5vw, 36px)', 
            fontWeight: 900, 
            color: '#fff', 
            lineHeight: 1.1, 
            letterSpacing: -1.5,
            marginBottom: 20
          }}>
            Geleceğin Operasyon<br/>
            <span style={{ color: '#f59e0b' }}>Merkezine Hoş Geldiniz</span>
          </h1>
          <p style={{ 
            fontSize: 16, 
            color: 'rgba(255,255,255,0.5)', 
            marginBottom: 36,
            maxWidth: 440,
            margin: '0 auto 36px',
            lineHeight: 1.5
          }}>
            Tüm veri merkezlerinizi ve kurumsal süreçlerinizi 
            tek noktadan yönetin.
          </p>
          
          <button 
            onClick={() => setShowPanel(true)}
            style={{
              padding: '14px 36px',
              fontSize: 15,
              fontWeight: 800,
              borderRadius: 100,
              background: '#f59e0b',
              color: '#000',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'none'}
          >
            Sisteme Giriş Yap <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* ─── Refined Footer Options ─── */}
      <div style={{
        position: 'absolute',
        bottom: 40, left: 0, right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: 12,
        zIndex: 10,
        opacity: showPanel ? 0 : 1,
        transition: 'all 0.4s ease'
      }}>
        {publicModules.map(mod => (
          <button 
            key={mod.name}
            onClick={() => navigate(mod.path)}
            style={{
              background: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '10px 20px',
              borderRadius: 12,
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.borderColor = mod.color;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <mod.icon size={15} color={mod.color} />
            {mod.name}
          </button>
        ))}
      </div>

      {/* ─── Sliding Login Panel ─── */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '100%',
        zIndex: 20,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        pointerEvents: showPanel ? 'auto' : 'none',
        visibility: showPanel || mounted ? 'visible' : 'hidden'
      }}>
        {/* Backdrop for closing */}
        {showPanel && (
          <div 
            onClick={() => setShowPanel(false)}
            style={{ position: 'absolute', inset: 0, background: 'transparent' }} 
          />
        )}

        <div style={{
          width: '100%',
          maxWidth: 440,
          background: 'rgba(10, 10, 10, 0.9)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderBottom: 'none',
          borderRadius: '28px 28px 0 0',
          padding: '36px 44px 50px',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.6)',
          transform: showPanel ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
          position: 'relative'
        }}>
          {/* Close Handle */}
          <div 
            onClick={() => setShowPanel(false)}
            style={{
              position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
              width: 32, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2,
              cursor: 'pointer'
            }} 
          />

          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 6 }}>
              {isReg ? 'Kayıt Olun' : 'Giriş Yapın'}
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              {isReg ? 'Aramıza katılmak için formu doldurun' : 'Güvenli dijital portal erişimi'}
            </p>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isReg && (
              <div className="form-group">
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, marginBottom: 6, display: 'block', letterSpacing: 1 }}>AD SOYAD</label>
                <input
                  style={{ 
                    width: '100%', padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none',
                    fontSize: 14, fontWeight: 500
                  }}
                  placeholder="İsim Soyisim..."
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, marginBottom: 6, display: 'block', letterSpacing: 1 }}>KULLANICI ADI</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }}>
                   <Users size={16} />
                </span>
                <input
                  style={{ 
                    width: '100%', padding: '12px 16px 12px 42px', borderRadius: 10, background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none',
                    fontSize: 14, fontWeight: 500
                  }}
                  placeholder="Kullanıcı adı..."
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, marginBottom: 6, display: 'block', letterSpacing: 1 }}>GÜVENLİ ŞİFRE</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }}>
                  <Key size={16} />
                </span>
                <input
                  style={{ 
                    width: '100%', padding: '12px 42px', borderRadius: 10, background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none',
                    fontSize: 14, fontWeight: 500
                  }}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={password => setPassword(password.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.2)', display: 'flex'
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ 
                width: '100%', padding: '14px', borderRadius: 12, 
                background: '#f59e0b',
                color: '#000', border: 'none', fontSize: 14, fontWeight: 900,
                cursor: 'pointer', marginTop: 8, display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
              }}
            >
              {loading ? 'YÜKLENİYOR...' : (isReg ? 'HESAP OLUŞTUR' : 'SİSTEME GİRİŞ YAP')}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>
              {isReg ? 'Zaten hesabınız var mı?' : 'Yetkiniz yok mu?'}
            </span>{' '}
            <button
              onClick={() => setIsReg(p => !p)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#f59e0b', fontWeight: 800, fontSize: 12
              }}
            >
              {isReg ? 'Giriş Yapın' : 'Talep Edin'}
            </button>
          </div>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 40,
        zIndex: 5,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: 'rgba(255,255,255,0.2)',
        fontSize: 10,
        fontWeight: 800
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%', background: '#10b981',
          boxShadow: '0 0 8px #10b981'
        }} />
        SİSTEM DURUMU: AKTİF
      </div>
    </div>
  );
}
