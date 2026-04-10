import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Bell,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wifi,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { loginUser, registerUser } from '../api';

const publicModules = [
  { name: 'Kurumsal Rehber', path: '/rehber', icon: Users, accent: '#fbbf24' },
  { name: 'Yardım Masası', path: '/yardim', icon: MessageSquare, accent: '#ffffff' },
  { name: 'Anketler', path: '/anketler', icon: Bell, accent: '#e5e7eb' },
];

const illusionBubbles = [
  {
    title: '24/7',
    subtitle: 'Operasyon',
    detail: 'Anlık görünürlük',
    icon: Activity,
    width: 220,
    minHeight: 150,
    tint: 'rgba(245,158,11,0.16)',
    border: 'rgba(245,158,11,0.22)',
    delay: '0s',
  },
  {
    title: '360°',
    subtitle: 'Kontrol',
    detail: 'Süreç hakimiyeti',
    icon: ShieldCheck,
    width: 210,
    minHeight: 150,
    tint: 'rgba(255,255,255,0.08)',
    border: 'rgba(255,255,255,0.16)',
    delay: '0.6s',
  },
  {
    title: 'Tek Merkez',
    subtitle: 'Yönetim',
    detail: 'Birleşik deneyim',
    icon: Sparkles,
    width: 250,
    minHeight: 150,
    tint: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.18)',
    delay: '1.1s',
  },
  {
    title: 'Canlı',
    subtitle: 'İzleme',
    detail: 'Sürekli akış',
    icon: TrendingUp,
    width: 190,
    minHeight: 138,
    tint: 'rgba(255,255,255,0.08)',
    border: 'rgba(255,255,255,0.14)',
    delay: '0.35s',
  },
  {
    title: 'Güvenli',
    subtitle: 'Erişim',
    detail: 'Kurumsal koruma',
    icon: Fingerprint,
    width: 220,
    minHeight: 138,
    tint: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.18)',
    delay: '0.85s',
  },
];

const accessSignals = [
  { icon: ShieldCheck, title: 'Koruma', value: 'Aktif', accent: '#fbbf24' },
  { icon: Wifi, title: 'Ağ Geçidi', value: 'Stabil', accent: '#ffffff' },
  { icon: Sparkles, title: 'Erişim', value: 'Hazır', accent: '#f5d36c' },
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
      const msg =
        err?.response?.data?.message ||
        (isReg ? 'Kayıt başarısız.' : 'Kullanıcı adı veya şifre hatalı.');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(circle at top left, rgba(37,99,235,0.18), transparent 24%), linear-gradient(135deg, #05070c 0%, #0a0f16 40%, #05070c 100%)',
        color: '#f8fafc',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <style>{`
        @keyframes repkonFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes repkonFloatSoft {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes repkonBubble {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(0, -14px, 0) scale(1.015); }
        }
        @keyframes repkonGlow {
          0%, 100% { box-shadow: 0 0 0 rgba(245,158,11,0.0); opacity: 0.75; }
          50% { box-shadow: 0 0 34px rgba(245,158,11,0.22); opacity: 1; }
        }
        .login-bubble {
          width: clamp(190px, 24vw, 250px);
          min-height: 142px;
          padding: 18px 18px 16px;
          border-radius: 34px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
        }
        .login-bubble-title {
          font-size: 21px;
          font-weight: 900;
          line-height: 1.05;
          margin-bottom: 4px;
          word-break: break-word;
        }
        .login-bubble-subtitle {
          font-size: 12px;
          font-weight: 800;
          color: #fbbf24;
          margin-bottom: 4px;
          letter-spacing: 0.2px;
        }
        .login-bubble-detail {
          font-size: 12px;
          line-height: 1.45;
          color: rgba(226,232,240,0.72);
          word-break: break-word;
        }
        @media (max-width: 760px) {
          .login-bubble {
            width: 100%;
            min-height: 128px;
          }
        }
      `}</style>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url("/repkon-4k-bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          transform: 'scale(1.03)',
          opacity: 0.9,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(3,7,18,0.88) 0%, rgba(3,7,18,0.5) 42%, rgba(2,6,23,0.88) 100%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0.25))',
          opacity: 0.35,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: -120,
          right: -90,
          width: 340,
          height: 340,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.22), transparent 68%)',
          filter: 'blur(18px)',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px clamp(20px, 4vw, 54px) 34px',
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(-12px)',
            transition: 'all 0.7s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                display: 'grid',
                placeItems: 'center',
                background:
                  'linear-gradient(135deg, rgba(245,158,11,0.95), rgba(249,115,22,0.82))',
                boxShadow: '0 18px 50px rgba(249,115,22,0.28)',
              }}
            >
              <Activity size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.8 }}>REPKON</div>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: 2.6,
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.6)',
                  fontWeight: 700,
                }}
              >
                Digital Operations Platform
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(18px)',
              color: 'rgba(255,255,255,0.78)',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 12px rgba(34,197,94,0.9)',
              }}
            />
            Sistem aktif
          </div>
        </header>

        <main
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.18fr) minmax(360px, 0.82fr)',
            alignItems: 'center',
            gap: 34,
            paddingTop: 28,
            paddingBottom: 24,
          }}
        >
          <section
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(26px)',
              transition: 'all 0.85s ease 0.08s',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                marginBottom: 24,
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(16px)',
                color: 'rgba(255,255,255,0.82)',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <Fingerprint size={16} color="#fbbf24" />
              Yeni nesil kurumsal operasyon deneyimi
            </div>

            <h1
              style={{
                maxWidth: 760,
                fontSize: 'clamp(42px, 6vw, 84px)',
                lineHeight: 0.96,
                letterSpacing: -3.6,
                fontWeight: 900,
                marginBottom: 18,
                textWrap: 'balance',
              }}
            >
              İlk bakışta güven veren,
              <span
                style={{
                  display: 'block',
                  background: 'linear-gradient(135deg, #fff 0%, #8ec5ff 34%, #f9b14b 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                güçlü bir giriş katmanı.
              </span>
            </h1>

            <p
              style={{
                maxWidth: 600,
                fontSize: 17,
                lineHeight: 1.75,
                color: 'rgba(226,232,240,0.78)',
                marginBottom: 30,
              }}
            >
              Düz kutular yerine, görselle uyumlu yüzen bilgi baloncuklarıyla daha sahne
              etkili bir ilk izlenim.
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 16,
                alignItems: 'flex-start',
                maxWidth: 860,
              }}
            >
              {illusionBubbles.map((item) => (
                <div
                  key={item.title + item.subtitle}
                  className="login-bubble"
                  style={{
                    minHeight: item.minHeight,
                    background: `linear-gradient(180deg, ${item.tint}, rgba(255,255,255,0.04))`,
                    border: `1px solid ${item.border}`,
                    boxShadow: '0 24px 70px rgba(2,6,23,0.14)',
                    backdropFilter: 'blur(22px)',
                    animation: `repkonBubble 6.5s ease-in-out infinite`,
                    animationDelay: item.delay,
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      marginBottom: 12,
                    }}
                  >
                    <item.icon size={18} color="#f8fafc" />
                  </div>

                  <div className="login-bubble-title">{item.title}</div>
                  <div className="login-bubble-subtitle">{item.subtitle}</div>
                  <div className="login-bubble-detail">{item.detail}</div>
                </div>
              ))}
            </div>
          </section>

          <section
            style={{
              display: 'flex',
              justifyContent: 'center',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(26px)',
              transition: 'all 0.85s ease 0.18s',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 460,
                position: 'relative',
                animation: 'repkonFloat 6s ease-in-out infinite',
              }}
            >
              <div
                style={{
                  padding: 28,
                  borderRadius: 32,
                  background: 'linear-gradient(180deg, rgba(7,15,28,0.74), rgba(10,20,38,0.76))',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 28px 90px rgba(2,6,23,0.55)',
                  backdropFilter: 'blur(28px)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 24,
                    right: -40,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(245,158,11,0.18), transparent 70%)',
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    background: 'linear-gradient(180deg, rgba(245,158,11,0), rgba(245,158,11,0.85), rgba(245,158,11,0))',
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'radial-gradient(circle at top right, rgba(96,165,250,0.18), transparent 30%), radial-gradient(circle at 20% 0%, rgba(249,115,22,0.16), transparent 24%)',
                    pointerEvents: 'none',
                  }}
                />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 14,
                      marginBottom: 18,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 12px',
                          borderRadius: 999,
                          marginBottom: 12,
                          fontSize: 11,
                          letterSpacing: 1.2,
                          color: '#f8fafc',
                          fontWeight: 800,
                          border: '1px solid rgba(255,255,255,0.08)',
                          background: 'rgba(255,255,255,0.04)',
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#22c55e',
                            animation: 'repkonGlow 2.6s ease-in-out infinite',
                          }}
                        />
                        ACCESS NODE ONLINE
                      </div>

                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 12px',
                          borderRadius: 999,
                          marginBottom: 12,
                          fontSize: 11,
                          textTransform: 'uppercase',
                          letterSpacing: 1.6,
                          color: 'rgba(255,255,255,0.74)',
                          fontWeight: 800,
                          border: '1px solid rgba(255,255,255,0.08)',
                          background: 'rgba(255,255,255,0.04)',
                        }}
                      >
                        <Fingerprint size={14} color="#fbbf24" />
                        Repkon Access Core
                      </div>
                      <h2
                        style={{
                          fontSize: 34,
                          lineHeight: 1,
                          fontWeight: 900,
                          marginBottom: 10,
                          letterSpacing: -1.4,
                        }}
                      >
                        {isReg ? 'Yeni Hesap Katmanı' : 'Yetkili Operasyon Girişi'}
                      </h2>
                      <p
                        style={{
                          color: 'rgba(226,232,240,0.72)',
                          fontSize: 14,
                          lineHeight: 1.7,
                          maxWidth: 320,
                        }}
                      >
                        {isReg
                          ? 'Kurumsal erişim alanına dahil olun ve güvenli akışa bağlanın.'
                          : 'Kontrol merkezine bağlanın. Hızlı, güvenli ve güçlü bir oturum başlatın.'}
                      </p>
                    </div>

                    <div
                      style={{
                        minWidth: 68,
                        height: 68,
                        borderRadius: 24,
                        display: 'grid',
                        placeItems: 'center',
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.24), rgba(255,255,255,0.08))',
                        border: '1px solid rgba(245,158,11,0.22)',
                        boxShadow: '0 18px 34px rgba(249,115,22,0.14)',
                      }}
                    >
                      <KeyRound size={30} color="#f8fafc" />
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      flexWrap: 'wrap',
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 12px',
                        borderRadius: 16,
                        border: '1px solid rgba(245,158,11,0.2)',
                        background: 'rgba(245,158,11,0.08)',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      <ShieldCheck size={15} color="#fbbf24" />
                      ENCRYPTION 256-BIT
                    </div>

                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 12px',
                        borderRadius: 16,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.04)',
                        color: 'rgba(255,255,255,0.82)',
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      <Activity size={15} color="#8ec5ff" />
                      NODE STABILITY HIGH
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: 10,
                      marginBottom: 18,
                    }}
                  >
                    {accessSignals.map((item, idx) => (
                      <div
                        key={item.title}
                        style={{
                          padding: '12px 10px',
                          borderRadius: 18,
                          border: '1px solid rgba(255,255,255,0.08)',
                          background: 'rgba(255,255,255,0.04)',
                          animation: `repkonFloatSoft ${4.5 + idx * 0.45}s ease-in-out infinite`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                          <item.icon size={16} color={item.accent} />
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            textAlign: 'center',
                            color: 'rgba(255,255,255,0.54)',
                            marginBottom: 4,
                          }}
                        >
                          {item.title}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 900, textAlign: 'center', color: '#fff' }}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
                    {isReg && (
                      <label style={{ display: 'grid', gap: 8 }}>
                        <span style={fieldLabelStyle}>Ad Soyad</span>
                        <input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Tam adınızı yazın"
                          style={inputStyle}
                        />
                      </label>
                    )}

                    <label style={{ display: 'grid', gap: 8 }}>
                      <span style={fieldLabelStyle}>Kullanıcı Adı</span>
                      <div style={{ position: 'relative' }}>
                        <span style={leadingIconStyle}>
                          <Users size={16} color="rgba(255,255,255,0.48)" />
                        </span>
                        <input
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Kullanıcı adınızı yazın"
                          autoComplete="username"
                          style={{ ...inputStyle, paddingLeft: 48 }}
                        />
                      </div>
                    </label>

                    <label style={{ display: 'grid', gap: 8 }}>
                      <span style={fieldLabelStyle}>Şifre</span>
                      <div style={{ position: 'relative' }}>
                        <span style={leadingIconStyle}>
                          <KeyRound size={16} color="rgba(255,255,255,0.48)" />
                        </span>
                        <input
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          type={showPass ? 'text' : 'password'}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          style={{ ...inputStyle, paddingLeft: 48, paddingRight: 52 }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass((prev) => !prev)}
                          style={visibilityButtonStyle}
                        >
                          {showPass ? (
                            <EyeOff size={18} color="rgba(255,255,255,0.58)" />
                          ) : (
                            <Eye size={18} color="rgba(255,255,255,0.58)" />
                          )}
                        </button>
                      </div>
                    </label>

                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        marginTop: 6,
                        height: 58,
                        border: 'none',
                        borderRadius: 18,
                        background:
                          'linear-gradient(135deg, rgba(245,158,11,1), rgba(249,115,22,0.96))',
                        color: '#08111f',
                        fontSize: 15,
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 18px 40px rgba(249,115,22,0.32)',
                      }}
                    >
                      {loading
                        ? 'Yükleniyor...'
                        : isReg
                          ? 'Hesabı oluştur'
                          : 'Güvenli oturum aç'}
                      {!loading && <ArrowRight size={18} />}
                    </button>
                  </form>

                  <div
                    style={{
                      marginTop: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap',
                      color: 'rgba(226,232,240,0.64)',
                      fontSize: 13,
                    }}
                  >
                    <span>{isReg ? 'Zaten hesabın var mı?' : 'Yeni erişim mi gerekiyor?'}</span>
                    <button
                      type="button"
                      onClick={() => setIsReg((prev) => !prev)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#fbbf24',
                        fontWeight: 800,
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      {isReg ? 'Giriş ekranına dön' : 'Talep oluştur'}
                    </button>
                  </div>

                  <div
                    style={{
                      marginTop: 24,
                      paddingTop: 18,
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: 10,
                    }}
                  >
                    {publicModules.map((mod) => (
                      <button
                        key={mod.name}
                        type="button"
                        onClick={() => navigate(mod.path)}
                        style={{
                          padding: '14px 10px',
                          borderRadius: 18,
                          border: '1px solid rgba(255,255,255,0.08)',
                          background: 'rgba(255,255,255,0.04)',
                          color: '#f8fafc',
                          display: 'grid',
                          justifyItems: 'center',
                          gap: 8,
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 14,
                            display: 'grid',
                            placeItems: 'center',
                            background: `${mod.accent}20`,
                            border: `1px solid ${mod.accent}55`,
                          }}
                        >
                          <mod.icon size={16} color={mod.accent} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.35 }}>{mod.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

const fieldLabelStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: 1,
  textTransform: 'uppercase',
};

const inputStyle = {
  width: '100%',
  height: 54,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(16px)',
  color: '#f8fafc',
  fontSize: 14,
  fontWeight: 600,
  padding: '0 18px',
  outline: 'none',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
};

const leadingIconStyle = {
  position: 'absolute',
  left: 16,
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
};

const visibilityButtonStyle = {
  position: 'absolute',
  right: 14,
  top: '50%',
  transform: 'translateY(-50%)',
  width: 32,
  height: 32,
  borderRadius: 10,
  border: 'none',
  background: 'transparent',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
};
