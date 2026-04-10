import { useEffect, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { loginUser, registerUser } from '../api';

const publicModules = [
  { name: 'Kurumsal Rehber', path: '/rehber', icon: Users },
  { name: 'Yardım Masası', path: '/yardim', icon: Activity },
  { name: 'Anketler', path: '/anketler', icon: Activity },
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
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: '#05070a',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Background Image */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url("/repkon-4k-bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.4,
          filter: 'grayscale(0.2) brightness(0.7)',
        }}
      />

      {/* Overlay Gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, transparent 0%, #05070a 90%)',
        }}
      />

      {/* Main Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: 420,
          padding: '0 20px',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Logo Section */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(245,158,11,0.3)',
            }}
          >
            <Activity size={26} color="#fff" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: -1, marginBottom: 4, color: '#fff' }}>REPKON</h1>
          <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
            Digital Operations
          </p>
        </div>

        {/* Login Form Card */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 24,
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, color: '#fff', textAlign: 'center' }}>
            {isReg ? 'Hesap Oluştur' : 'Operatör Girişi'}
          </h2>

          <form onSubmit={submit} style={{ display: 'grid', gap: 20 }}>
            {isReg && (
              <div style={{ display: 'grid', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Ad Soyad</span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Adınızı girin"
                  style={inputStyle}
                  required
                />
              </div>
            )}

            <div style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Kullanıcı Adı</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="isminiz"
                style={inputStyle}
                autoComplete="username"
                required
              />
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Şifre</span>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={inputStyle}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: 0.5,
                  }}
                >
                  {showPass ? <EyeOff size={18} color="#fff" /> : <Eye size={18} color="#fff" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 8,
                height: 52,
                borderRadius: 14,
                background: 'linear-gradient(to right, #f59e0b, #fbbf24)',
                border: 'none',
                color: '#000',
                fontSize: 15,
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              {loading ? 'İşleniyor...' : isReg ? 'Kayıt Ol' : 'Giriş Yap'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button
              onClick={() => setIsReg(!isReg)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
            >
              {isReg ? 'Zaten hesabınız var mı? Giriş yapın' : 'Yeni erişim mi gerekiyor? Talep oluştur'}
            </button>
          </div>
        </div>

        {/* Footer Quick Links */}
        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 20 }}>
          {publicModules.map((m) => (
            <NavLink
              key={m.path}
              to={m.path}
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.5)',
                textDecoration: 'none',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 99,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.08)';
                e.target.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.03)';
                e.target.style.color = 'rgba(255,255,255,0.5)';
              }}
            >
              <m.icon size={13} />
              {m.name}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  height: 48,
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 12,
  padding: '0 16px',
  color: '#fff',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.2s',
};
