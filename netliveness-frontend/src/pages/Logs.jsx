import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getLogs } from '../api';
import { 
  Search, ScrollText, RefreshCw, Zap, Shield, 
  Package, LifeBuoy, Users, Activity, Clock,
  Filter, ChevronRight, Globe, AlertTriangle,
  BarChart3, Calendar, Layers, Terminal,
  Cpu, LayoutDashboard, Settings2, Info
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, Cell, AreaChart, Area 
} from 'recharts';
import toast from 'react-hot-toast';

const CATEGORY_MAP = {
  SYSTEM:    { icon: Zap,           color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',   label: 'Sistem' },
  SECURITY:  { icon: Shield,        color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    label: 'Güvenlik' },
  NETWORK:   { icon: Globe,         color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',   label: 'Ağ/Cihaz' },
  INVENTORY: { icon: Package,       color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   label: 'Envanter' },
  SUPPORT:   { icon: LifeBuoy,      color: '#10b981', bg: 'rgba(16,185,129,0.1)',   label: 'Destek' },
  PERSONNEL: { icon: Users,         color: '#ec4899', bg: 'rgba(236,72,153,0.1)',   label: 'Personel' },
};

const DEFAULT_CAT = { icon: Activity, color: '#64748b', bg: 'rgba(100,116,139,0.1)', label: 'Genel' };

export default function Logs() {
  const [logs, setLogs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [activeTab, setActiveTab]   = useState('ALL');
  const [isLive, setIsLive]         = useState(true);
  const [_lastUpdate, setLastUpdate] = useState(new Date());

  const pollRef = useRef(null);

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try { 
      const data = await getLogs();
      setLogs(Array.isArray(data) ? data : []); 
      setLastUpdate(new Date());
    } catch { 
      toast.error('Log verileri alınamadı.');
    } finally { 
      if (!isSilent) setLoading(false); 
    }
  }, []);

  useEffect(() => {
    load();
    if (isLive) {
      pollRef.current = setInterval(() => load(true), 15000);
    }
    return () => clearInterval(pollRef.current);
  }, [load, isLive]);

  // --- Processed Data ---
  const filtered = useMemo(() => {
    return logs.filter(l => {
      const q = search.toLowerCase();
      const matchSearch = !q || 
        l.details?.toLowerCase().includes(q) || 
        l.action?.toLowerCase().includes(q) || 
        l.operator?.toLowerCase().includes(q);
      
      const matchTab = activeTab === 'ALL' || l.category === activeTab;
      return matchSearch && matchTab;
    });
  }, [logs, search, activeTab]);

  const stats = useMemo(() => {
    const counts = {};
    logs.forEach(l => { counts[l.category] = (counts[l.category] || 0) + 1; });
    return Object.entries(CATEGORY_MAP).map(([key, cfg]) => ({
      name: cfg.label,
      value: counts[key] || 0,
      color: cfg.color
    })).sort((a,b) => b.value - a.value);
  }, [logs]);

  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, count: 0 }));
    logs.forEach(l => {
      const h = new Date(l.date).getHours();
      hours[h].count++;
    });
    return hours;
  }, [logs]);

  if (loading && logs.length === 0) return (
    <div className="loading-screen">
       <div className="spinner" style={{ width: 40, height: 40 }} />
       <span style={{ fontWeight: 800, color: 'var(--text-3)', letterSpacing: '2px' }}>OPERASYONEL GÜNLÜK YÜKLENİYOR...</span>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 60, position: 'relative' }}>
      
      {/* ─── Premium Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div className="icon-box-sm icon-slate" style={{ width: 40, height: 40, borderRadius: 14 }}>
                 <Terminal size={22} color="var(--text-1)" />
              </div>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 950, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.02em' }}>Sistem Aktivite Akışı</h1>
                <p style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600, margin: 0 }}>Uçtan uca operasyonel işlem kayıtları ve güvenlik günlükleri</p>
              </div>
           </div>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
           <div className="card" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: isLive ? 'var(--green)' : 'var(--text-4)', boxShadow: isLive ? '0 0 12px var(--green)' : 'none' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: isLive ? 'var(--green)' : 'var(--text-3)' }}>{isLive ? 'CANLI MOD' : 'DURDURULDU'}</span>
              </div>
              <div className="divider-v" style={{ height: 16 }} />
              <button 
                onClick={() => setIsLive(!isLive)}
                className="btn-icon-plain" 
                style={{ width: 28, height: 28 }}
                title={isLive ? "Durdur" : "Başlat"}
              >
                 {isLive ? <Activity size={14} /> : <RefreshCw size={14} />}
              </button>
           </div>
           
           <button 
             onClick={() => load()}
             className="btn btn-primary"
             style={{ borderRadius: 16, height: 44, padding: '0 20px', gap: 8 }}
           >
              <RefreshCw size={16} className={loading ? 'spin' : ''} /> <span style={{ fontWeight: 800 }}>ŞİMDİ YENİLE</span>
           </button>
        </div>
      </div>

      {/* ─── Action Center Matrix ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 24, marginBottom: 32 }}>
        
        {/* Left: Main Logs area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
           
           {/* Filters & Search */}
           <div className="card" style={{ padding: '8px', borderRadius: 24, background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ flex: 1, display: 'flex', gap: 4, overflowX: 'auto', padding: '2px' }} className="no-scrollbar">
                 {['ALL', 'SECURITY', 'NETWORK', 'INVENTORY', 'SUPPORT', 'PERSONNEL', 'SYSTEM'].map(tab => (
                   <button
                     key={tab}
                     onClick={() => setActiveTab(tab)}
                     style={{ 
                       padding: '10px 18px', borderRadius: 18, border: 'none',
                       background: activeTab === tab ? 'var(--text-1)' : 'transparent',
                       color: activeTab === tab ? '#fff' : 'var(--text-3)',
                       fontSize: 12, fontWeight: 850, cursor: 'pointer', transition: 'all 0.3s',
                       whiteSpace: 'nowrap'
                     }}
                   >
                      {tab === 'ALL' ? 'TÜMÜ' : (CATEGORY_MAP[tab]?.label || tab).toUpperCase()}
                   </button>
                 ))}
              </div>
              <div className="divider-v" style={{ height: 24 }} />
              <div style={{ width: 280, position: 'relative' }}>
                 <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
                 <input 
                   placeholder="İşlem veya kullanıcı ara..." 
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                   style={{ 
                     width: '100%', padding: '12px 16px 12px 44px', borderRadius: 18, border: '1px solid var(--border)',
                     fontSize: 13, fontWeight: 700, outline: 'none', background: 'var(--bg-inset)', color: 'var(--text-1)'
                   }}
                 />
              </div>
           </div>

           {/* Timeline Feed */}
           <div style={{ position: 'relative', paddingLeft: 40 }}>
              <div style={{ position: 'absolute', left: 14, top: 10, bottom: 0, width: 2, background: 'linear-gradient(to bottom, var(--border), transparent)' }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                 {filtered.slice(0, 100).map((l, i) => {
                    const cat = CATEGORY_MAP[l.category] || DEFAULT_CAT;
                    const CatIcon = cat.icon;
                    return (
                      <div key={l.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.02}s`, position: 'relative' }}>
                         {/* Bullet Point */}
                         <div style={{ 
                           position: 'absolute', left: -33, top: 24, width: 14, height: 14, 
                           borderRadius: '50%', background: '#fff', border: `4px solid ${cat.color}`,
                           zIndex: 2, boxShadow: `0 0 15px ${cat.color}44`
                         }} />

                         <div className="card log-entry-card" style={{ 
                           padding: '20px 24px', borderRadius: 28, background: 'var(--bg-surface)', 
                           border: '1px solid var(--border)', display: 'flex', gap: 24, alignItems: 'center',
                           transition: 'all 0.3s ease'
                         }}>
                            {/* Icon Box */}
                            <div style={{ 
                              width: 52, height: 52, borderRadius: 18, background: cat.bg, color: cat.color,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.02)'
                            }}>
                               <CatIcon size={24} />
                            </div>

                            {/* Content Matrix */}
                            <div style={{ flex: 1 }}>
                               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                     <span style={{ fontSize: 11, fontWeight: 900, color: cat.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{cat.label}</span>
                                     <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-4)' }} />
                                     <span style={{ fontSize: 15, fontWeight: 850, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{l.action}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', background: 'var(--bg-inset)', padding: '4px 10px', borderRadius: 10 }}>
                                     <Clock size={12} />
                                     <span style={{ fontSize: 11, fontWeight: 800 }}>{new Date(l.date).toLocaleString('tr-TR')}</span>
                                  </div>
                               </div>
                               <p style={{ margin: 0, fontSize: 14, color: 'var(--text-2)', fontWeight: 600, lineHeight: 1.5 }}>{l.details}</p>
                               
                               <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                     <div style={{ width: 22, height: 22, borderRadius: 8, background: 'var(--bg-inset)', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900 }}>
                                        {l.operator?.charAt(0).toUpperCase() || 'S'}
                                     </div>
                                     <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-3)' }}>{l.operator || 'Sistem Otomasyon'}</span>
                                  </div>
                               </div>
                            </div>

                            <div style={{ color: 'var(--text-4)', padding: 8 }}>
                               <ChevronRight size={20} />
                            </div>
                         </div>
                      </div>
                    );
                 })}

                 {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '120px 40px', background: 'var(--bg-inset)', borderRadius: 32, border: '2px dashed var(--border)' }}>
                       <AlertTriangle size={64} style={{ color: 'var(--text-4)', marginBottom: 20, opacity: 0.3 }} />
                       <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-2)' }}>Sonuç Yok</div>
                       <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 8, fontWeight: 600 }}>Arama kriterlerinize uygun log kaydı bulunamadı.</p>
                       <button onClick={() => { setSearch(''); setActiveTab('ALL'); }} className="btn btn-ghost" style={{ marginTop: 20, fontWeight: 800 }}>Geri Dön</button>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* Right: Stats & Widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'sticky', top: 24, height: 'fit-content' }}>
           
           {/* Activity Mini Chart */}
           <div className="card" style={{ padding: 24, borderRadius: 28, background: 'var(--text-1)', color: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BarChart3 size={16} color="rgba(255,255,255,0.6)" />
                    <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.5 }}>24S AKTİVİTE</span>
                 </div>
              </div>
              <div style={{ height: 100, marginBottom: 16 }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyData}>
                       <defs>
                          <linearGradient id="logColor" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                             <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#logColor)" strokeWidth={3} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
              <div>
                 <div style={{ fontSize: 24, fontWeight: 950 }}>{logs.filter(l => new Date(l.date) > new Date(Date.now() - 24*3600*1000)).length}</div>
                 <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Son 24 saatteki toplam işlem</div>
              </div>
           </div>

           {/* Distribution */}
           <div className="card" style={{ padding: 24, borderRadius: 28 }}>
              <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 20, color: 'var(--text-1)' }}>DAĞILIM ANALİZİ</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                 {stats.map((s, i) => (
                    <div key={i}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
                          <span style={{ color: 'var(--text-2)' }}>{s.name.toUpperCase()}</span>
                          <span style={{ color: s.color }}>{s.value}</span>
                       </div>
                       <div style={{ height: 6, width: '100%', background: 'var(--bg-inset)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: s.color, width: `${(s.value / logs.length) * 100}%`, borderRadius: 3 }} />
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Info Box */}
           <div className="card" style={{ padding: 20, borderRadius: 24, background: 'var(--bg-inset)', display: 'flex', gap: 12 }}>
              <div className="icon-box-sm" style={{ background: '#fff', width: 32, height: 32 }}><Info size={16} color="var(--text-3)" /></div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', fontWeight: 600, lineHeight: 1.5 }}>
                 Log kayıtları 30 saniyede bir otomatik güncellenir. Güvenlik ve ağ kayıtları anlık olarak akışa dahil edilir.
              </p>
           </div>
        </div>

      </div>

      <style>{`
        .log-entry-card:hover { 
          transform: translateX(8px); 
          border-color: var(--text-4) !important; 
          background: #fff !important; 
          box-shadow: 0 10px 40px rgba(0,0,0,0.04) !important;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

    </div>
  );
}
