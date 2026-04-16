import { useState, useEffect, useCallback, useMemo } from 'react';
import { getDirectoryEntries, getActiveSurveys, STATIC_URL } from '../api';
import { 
  Search, Mail, Building2, User, PhoneCall, 
  ArrowLeft, Users, Hash,
  ShieldCheck, Layers, Bell, MessageSquare
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function DirectoryPublic() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSurveys, setActiveSurveys] = useState([]);
  const [showSurveys, setShowSurveys] = useState(false);
  const [selectedDept, setSelectedDept] = useState('All');
  
  const navigate = useNavigate();

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'rehber-unified-fix';
    style.innerHTML = `
      html, body { background: #f8fafc !important; margin: 0; padding: 0; min-height: 100vh; overflow-x: hidden; color: #0f172a; }
      #root { 
        background: #f8fafc !important; 
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }
      .page-overlay { position: fixed; inset: 0; background: radial-gradient(circle at 30% 20%, rgba(59,130,246,0.05) 0%, transparent 60%); z-index: 1; pointer-events: none; }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: #f8fafc; }
      ::-webkit-scrollbar-thumb { background: rgba(245, 158, 11, 0.2); border-radius: 10px; }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById('rehber-unified-fix');
      if (el) el.remove();
    };
  }, []);

  const load = useCallback(async () => {
    // Independent fetching to prevent blocking
    getDirectoryEntries()
      .then(setEntries)
      .catch(e => console.error('Directory fetch error:', e))
      .finally(() => setLoading(false));

    getActiveSurveys()
      .then(setActiveSurveys)
      .catch(e => console.error('Surveys fetch error:', e));
  }, []);

  useEffect(() => { load(); }, [load]);

  const departments = useMemo(() => {
    const depts = new Set(entries.map(e => e.department).filter(Boolean));
    return ['All', ...Array.from(depts).sort()];
  }, [entries]);

  const filtered = entries.filter(e => {
    const matchesDept = selectedDept === 'All' || e.department === selectedDept;
    if (!matchesDept) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (e.firstName || '').toLowerCase().includes(q) ||
      (e.lastName || '').toLowerCase().includes(q) ||
      (e.department || '').toLowerCase().includes(q) ||
      (e.position || '').toLowerCase().includes(q) ||
      (e.internalPhone || '').toLowerCase().includes(q) ||
      (e.email || '').toLowerCase().includes(q)
    );
  });

  if (loading) return (
    <div style={{ width: '100vw', height: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 15 }}>
      <div className="spinner" style={{ width: 36, height: 36, borderTopColor: '#f59e0b', borderWidth: 3 }} />
      <span style={{ fontSize: 10, color: 'rgba(15,23,42,0.4)', letterSpacing: 3, fontWeight: 900 }}>REPKON</span>
    </div>
  );

  return (
    <div style={{ width: '100%', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#0f172a', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2 }}>
      <div className="page-overlay" />

      <div style={{ position: 'relative', width: '100%', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, padding: '30px 0' }}>
        <div style={{ maxWidth: 800, width: '100%', padding: '0 40px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <div onClick={() => navigate('/login')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#f59e0b', fontSize: 11, fontWeight: 800, cursor: 'pointer', marginBottom: 20, background: 'rgba(245,158,11,0.06)', padding: '8px 16px', borderRadius: 100, border: '1px solid rgba(245,158,11,0.15)', textTransform: 'uppercase', letterSpacing: 1.5, backdropFilter: 'blur(10px)' }}>
            <ArrowLeft size={12} strokeWidth={3} /> Giriş Ekranı
          </div>
          <h1 style={{ fontSize: 'max(3.2vw, 28px)', fontWeight: 900, marginBottom: 12, letterSpacing: -1.5, color: '#0f172a' }}>
            Kurumsal <span style={{ color: '#f59e0b' }}>Rehber</span>
          </h1>
          <div style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(30px)', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 20, padding: '8px 8px 8px 24px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 10px 30px rgba(15,23,42,0.05)', maxWidth: 540, margin: '0 auto' }}>
            <Search size={18} color="#f59e0b" strokeWidth={3} />
            <input style={{ background: 'none', border: 'none', color: '#0f172a', fontSize: 16, flex: 1, outline: 'none', fontWeight: 600 }} placeholder="Hızlı ara..." value={search} onChange={e => setSearch(e.target.value)} />
            <div style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '10px 20px', borderRadius: 14, fontWeight: 900, fontSize: 11, border: '1px solid rgba(245,158,11,0.2)', textTransform: 'uppercase' }}>
              {filtered.length} Kayıt
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, width: '100%', margin: '0 auto', padding: '0 40px 60px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, flexWrap: 'wrap', gap: 15 }}>
          <div style={{ display: 'flex', gap: 20 }}>
            <StatBox icon={Users} label="PERSONEL" value={entries.length} color="#f59e0b" />
            <StatBox icon={Layers} label="BİRİMLER" value={departments.length - 1} color="#3b82f6" />
          </div>
          <div style={{ background: 'rgba(15,23,42,0.03)', padding: '6px', borderRadius: 16, border: '1px solid rgba(15,23,42,0.05)', display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {departments.slice(0, 8).map(dept => (
              <button key={dept} onClick={() => setSelectedDept(dept)} style={{ padding: '8px 16px', borderRadius: 12, border: 'none', background: selectedDept === dept ? '#f59e0b' : 'transparent', color: selectedDept === dept ? '#000' : 'rgba(15,23,42,0.35)', fontSize: 11, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                {dept === 'All' ? 'TÜMÜ' : dept.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', background: 'rgba(15,23,42,0.02)', borderRadius: 24, border: '1px dashed rgba(15,23,42,0.08)' }}>
            <p style={{ color: 'rgba(15,23,42,0.2)', fontSize: 14 }}>Sonuç bulunamadı.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))',
            gap: 16
          }}>
            {filtered.map(entry => (
              <HorizontalPersonCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        <div style={{ marginTop: 60, textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>
            © {new Date().getFullYear()} REPKON DIGITAL
          </div>
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100, display: 'flex', gap: 12 }}>
        {activeSurveys.length > 0 && (
          <button onClick={() => setShowSurveys(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: 100, fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', cursor: 'pointer' }}>
            <Bell size={16} /> ANKETLER
          </button>
        )}
        <Link to="/yardim" style={{ background: '#fff', color: '#000', padding: '12px 20px', borderRadius: 100, fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', textDecoration: 'none' }}>
          <MessageSquare size={16} color="#f59e0b" /> DESTEK
        </Link>
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color={color} strokeWidth={2.5} />
      </div>
      <div>
        <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(15,23,42,0.3)', letterSpacing: 1 }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1, color: '#0f172a' }}>{value}</div>
      </div>
    </div>
  );
}

function HorizontalPersonCard({ entry }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(15px)',
      border: '1px solid rgba(15,23,42,0.04)',
      borderRadius: 18,
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 15px rgba(15,23,42,0.02)',
      position: 'relative',
      overflow: 'hidden'
    }}
      onMouseOver={e => {
        e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(15,23,42,0.06)';
      }}
      onMouseOut={e => {
        e.currentTarget.style.borderColor = 'rgba(15,23,42,0.04)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.7)';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 4px 15px rgba(15,23,42,0.02)';
      }}
    >
      <div style={{
        width: 60, height: 60, borderRadius: 14,
        background: 'rgba(15,23,42,0.02)',
        border: '1px solid rgba(15,23,42,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', flexShrink: 0
      }}>
        {entry.imageUrl
          ? <img src={`${STATIC_URL}${entry.imageUrl}`} alt={entry.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <User size={28} color="rgba(15,23,42,0.1)" />
        }
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 2, letterSpacing: -0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {entry.firstName} {entry.lastName}
        </h4>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginBottom: 2 }}>
          {entry.position || 'UZMAN'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(15,23,42,0.4)', fontSize: 11, fontWeight: 500 }}>
          <Building2 size={12} /> {entry.department}
        </div>
      </div>
      
      <div style={{ width: 1, height: 40, background: 'rgba(15,23,42,0.06)' }} />

      <div style={{ width: 160, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <MiniContact icon={Hash} text={entry.internalPhone} color="#f59e0b" />
        <MiniContact icon={PhoneCall} text={entry.mobilePhone} color="#10b981" />
        {entry.email && (
          <a href={`mailto:${entry.email}`} style={{ textDecoration: 'none' }}>
            <MiniContact icon={Mail} text={entry.email} color="#3b82f6" />
          </a>
        )}
      </div>

      <div style={{ position: 'absolute', top: 8, right: 8, opacity: 0.2 }}>
        <ShieldCheck size={12} color="#f59e0b" />
      </div>
    </div>
  );
}

function MiniContact({ icon: Icon, text, color }) {
  if (!text || text === '-' || text === 'null') {
    return <div style={{ fontSize: 10, color: 'rgba(15,23,42,0.1)', display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon size={12} style={{ opacity: 0.3 }} /> <span style={{ letterSpacing: 0.5 }}>---</span>
    </div>;
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(15,23,42,0.6)', fontSize: 11 }}>
      <Icon size={12} color={color} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{text}</span>
    </div>
  );
}
