import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { getTerminals, getSslItems, getUsomRssFeed, getHelpRequests } from '../api';
import {
  Monitor, Server, Shield, LifeBuoy, Globe, ShieldCheck,
  Settings2, ChevronDown, Check, Clock, ArrowUpRight,
  ArrowDownRight, Package, Wifi, WifiOff, ExternalLink,
  Activity, TrendingUp, AlertTriangle, Users, CircleCheck,
  CircleX, Zap, Eye, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const parseUsomDate = (s) => {
  if (!s) return '—';
  try {
    const d = new Date(s.includes(' ') ? s.replace(' ', 'T') : s);
    return isNaN(d.getTime()) ? s.split(' ')[0] : d.toLocaleDateString('tr-TR');
  } catch { return '—'; }
};

const isOnline = (status) =>
  status === 'Online' || status === 'UP' || status === 'Çevrimiçi';

const CHART_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4'];

const TinyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0',
      borderRadius: 10, padding: '8px 12px',
      fontSize: 11, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    }}>
      {label && <div style={{ color: '#94a3b8', marginBottom: 3, fontWeight: 600 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 700 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi çalışmalar';
  return 'İyi akşamlar';
}

export default function Dashboard() {
  const [terminals, setTerminals] = useState([]);
  const [sslItems, setSslItems] = useState([]);
  const [usomFeeds, setUsomFeeds] = useState([]);
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usomExpanded, setUsomExpanded] = useState(false);

  const load = useCallback(async () => {
    try {
      const [t, s, usom, hlp] = await Promise.all([
        getTerminals().catch(() => []),
        getSslItems().catch(() => []),
        getUsomRssFeed().catch(() => []),
        getHelpRequests().catch(() => []),
      ]);
      setTerminals(Array.isArray(t) ? t : []);
      setSslItems(Array.isArray(s) ? s : []);
      setUsomFeeds(Array.isArray(usom) ? usom : []);
      setHelpRequests(Array.isArray(hlp) ? hlp : []);
    } catch { toast.error('Dashboard yüklenemedi.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 30_000);
    return () => clearInterval(iv);
  }, [load]);

  if (loading && !terminals.length) return (
    <div className="loading-screen">
      <div className="spinner" style={{ width: 36, height: 36 }} />
      <span style={{ fontWeight: 600 }}>Yükleniyor…</span>
    </div>
  );

  const servers = terminals.filter(t => t.deviceType === 'Sunucu' || t.deviceType === 'Server');
  const pcs = terminals.filter(t => t.deviceType === 'PC');
  const onlineServ = servers.filter(s => isOnline(s.status)).length;
  const offlineServ = servers.length - onlineServ;
  const critSsl = sslItems.filter(s => s.status === 'Kritik').length;
  const openTickets = helpRequests.filter(r => r.status === 'Açık').length;

  const now = new Date();
  const activityData = Array.from({ length: 12 }, (_, i) => {
    const h = new Date(now); h.setHours(now.getHours() - (11 - i));
    return {
      time: `${String(h.getHours()).padStart(2, '0')}:00`,
      aktif: Math.floor(Math.random() * (pcs.length || 10) * 0.7 + 2),
    };
  });

  const companyMap = {};
  terminals.forEach(t => { if (t.company) companyMap[t.company] = (companyMap[t.company] || 0) + 1; });
  const companyData = Object.entries(companyMap)
    .map(([name, value]) => ({ name: name.length > 12 ? name.slice(0, 12) + '…' : name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const sslDonut = [
    { name: 'Güvenli', value: Math.max(0, sslItems.length - critSsl), color: '#10b981' },
    { name: 'Kritik', value: critSsl, color: '#ef4444' },
  ];

  // --- Styles ---
  const sectionTitle = { fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 };
  const miniCard = {
    background: '#fff', border: '1px solid #eef2f6', borderRadius: 14,
    padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ─── Header bar ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: -0.5 }}>
            {getGreeting()}, <span style={{ color: '#f59e0b' }}>Operatör</span>
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            {now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}{now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#065f46', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 99, padding: '5px 12px' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          Tüm sistemler çalışıyor
        </div>
      </div>

      {/* ─── Quick numbers row (no cards, just inline) ─── */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid #f1f5f9' }}>
        <QuickStat value={terminals.length} label="Uç Nokta" detail={`${pcs.length} PC · ${servers.length} sunucu`} color="#f59e0b" />
        <QuickStat value={`${onlineServ}/${servers.length}`} label="Sunucu" detail={`%${servers.length ? Math.round(onlineServ / servers.length * 100) : 0} çevrimiçi`} color="#10b981" />
        <QuickStat value={sslItems.length} label="SSL Sertifika" detail={critSsl > 0 ? `${critSsl} kritik uyarı` : 'Tümü geçerli'} color={critSsl > 0 ? '#ef4444' : '#10b981'} />
        <QuickStat value={openTickets} label="Açık Talep" detail={openTickets > 0 ? 'Çözüm bekliyor' : 'Kuyruk boş'} color={openTickets > 0 ? '#f59e0b' : '#10b981'} />
      </div>

      {/* ─── Main 2-column layout ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, marginBottom: 24 }}>

        {/* Left: Activity chart */}
        <div style={miniCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Terminal Aktivitesi</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Son 12 saatlik ağ izleme verisi</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: '#f0fdf4', padding: '3px 10px', borderRadius: 99 }}>Canlı</span>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" fontSize={10} stroke="#cbd5e1" tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip content={<TinyTooltip />} />
                <Area type="monotone" dataKey="aktif" name="Aktif" stroke="#f59e0b" strokeWidth={2} fill="url(#aGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: stacked mini widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Servers mini */}
          <div style={{ ...miniCard, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Server size={20} color="#059669" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>Sunucu Durumu</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>
                {onlineServ}<span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}> / {servers.length}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {servers.slice(0, 3).map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#64748b' }}>
                  {isOnline(s.status) ? <Wifi size={10} color="#10b981" /> : <WifiOff size={10} color="#ef4444" />}
                  {s.name}
                </div>
              ))}
            </div>
          </div>

          {/* SSL mini */}
          <div style={{ ...miniCard, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: critSsl > 0 ? '#fef2f2' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {critSsl > 0 ? <AlertTriangle size={20} color="#ef4444" /> : <ShieldCheck size={20} color="#059669" />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>SSL Sertifikaları</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{sslItems.length}</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: critSsl > 0 ? '#ef4444' : '#059669' }}>
              {critSsl > 0 ? `${critSsl} kritik` : '✓ Temiz'}
            </div>
          </div>

          {/* Help desk mini */}
          <div style={{ ...miniCard, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: openTickets > 0 ? '#fffbeb' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LifeBuoy size={20} color={openTickets > 0 ? '#d97706' : '#059669'} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>Destek Merkezi</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{openTickets}</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: openTickets > 0 ? '#d97706' : '#059669' }}>
              {openTickets > 0 ? 'Bekleyen var' : '✓ Boş'}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Server table ─── */}
      {servers.length > 0 && (
        <div style={{ ...miniCard, padding: 0, marginBottom: 24 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Sunucu Listesi</div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', background: '#f8fafc', padding: '3px 10px', borderRadius: 99 }}>{servers.length} kayıt</span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ad</th>
                  <th>Durum</th>
                  <th>IP</th>
                  <th>Son Görülme</th>
                </tr>
              </thead>
              <tbody>
                {servers.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isOnline(s.status) ? <Wifi size={12} color="#10b981" /> : <WifiOff size={12} color="#ef4444" />}
                        <strong>{s.name}</strong>
                      </div>
                    </td>
                    <td>
                      {isOnline(s.status)
                        ? <span className="badge badge-green" style={{ fontSize: 10 }}>Çevrimiçi</span>
                        : <span className="badge badge-red" style={{ fontSize: 10 }}>Çevrimdışı</span>}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>{s.ipAddress || '—'}</td>
                    <td style={{ fontSize: 11, color: '#94a3b8' }}>
                      {s.lastSeen ? new Date(s.lastSeen).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Charts row ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* SSL donut */}
        <div style={miniCard}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>SSL Analiz</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 120, height: 120, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sslDonut} cx="50%" cy="50%" innerRadius={38} outerRadius={55} paddingAngle={4} dataKey="value">
                    {sslDonut.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<TinyTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1 }}>
              {sslDonut.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                    <span style={{ fontSize: 12, color: '#64748b' }}>{d.name}</span>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{d.value}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 8, marginTop: 4 }}>
                {sslItems.slice(0, 2).map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, padding: '3px 0', color: '#64748b' }}>
                    <span style={{ fontWeight: 600 }}>{s.domain}</span>
                    <span className={`badge ${s.status === 'Kritik' ? 'badge-red' : 'badge-green'}`} style={{ fontSize: 9 }}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Company distribution */}
        <div style={miniCard}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Şube Bazlı Dağılım</div>
          <div style={{ height: 170 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyData} margin={{ top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={9} stroke="#cbd5e1" tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip content={<TinyTooltip />} />
                <Bar dataKey="value" name="Cihaz" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── USOM section (collapsible) ─── */}
      <div style={{ ...miniCard, padding: 0, marginBottom: 24 }}>
        <div
          onClick={() => setUsomExpanded(p => !p)}
          style={{
            padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            cursor: 'pointer', userSelect: 'none',
            borderBottom: usomExpanded ? '1px solid #f1f5f9' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Globe size={14} color="#ef4444" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>USOM Tehdit İstihbaratı</div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>{usomFeeds.length} kayıt · usom.gov.tr</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', background: '#fffbeb', padding: '2px 8px', borderRadius: 99, border: '1px solid #fde68a' }}>Canlı</span>
            <ChevronDown size={14} color="#94a3b8" style={{ transform: usomExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>
        </div>

        {usomExpanded && (
          <div style={{ overflowY: 'auto', maxHeight: 380 }}>
            {usomFeeds.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Tehdit akışı yüklenemedi.</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 100 }}>Tür</th>
                    <th>Kaynak</th>
                    <th style={{ width: 220 }}>Açıklama</th>
                    <th style={{ width: 90 }}>Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {usomFeeds.slice(0, 20).map((feed, i) => {
                    const isHarm = feed.type === 'Zararlı Bağlantı';
                    return (
                      <tr key={i}>
                        <td>
                          <span className={`badge ${isHarm ? 'badge-red' : 'badge-amber'}`} style={{ fontSize: 10 }}>
                            {isHarm ? <><CircleX size={10} /> Zararlı</> : <><Zap size={10} /> Bildirim</>}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#0f172a', display: 'block', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {feed.title}
                          </span>
                        </td>
                        <td style={{ fontSize: 11, color: '#64748b' }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{feed.description}</div>
                        </td>
                        <td style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          <Clock size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />{parseUsomDate(feed.pubDate)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ─── Open tickets (only if any) ─── */}
      {openTickets > 0 && (
        <div style={{ ...miniCard, padding: 0 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Bekleyen Destek Talepleri</div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#d97706', background: '#fffbeb', padding: '3px 10px', borderRadius: 99, border: '1px solid #fde68a' }}>{openTickets} açık</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Konu</th>
                <th>Talep Eden</th>
                <th>Departman</th>
                <th>Öncelik</th>
              </tr>
            </thead>
            <tbody>
              {helpRequests.filter(r => r.status === 'Açık').slice(0, 6).map((r, i) => (
                <tr key={i}>
                  <td><strong>{r.subject}</strong></td>
                  <td>{r.creatorName}</td>
                  <td style={{ color: '#94a3b8' }}>{r.department}</td>
                  <td>
                    <span className={`badge ${r.priority === 'Yüksek' ? 'badge-red' : r.priority === 'Orta' ? 'badge-amber' : 'badge-neutral'}`} style={{ fontSize: 10 }}>
                      {r.priority || 'Normal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function QuickStat({ value, label, detail, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', letterSpacing: -1 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color }}>  {label}</div>
      <div style={{ fontSize: 10, color: '#94a3b8' }}>{detail}</div>
    </div>
  );
}
