import { useState, useEffect, useMemo } from 'react';
import { FileText, Calendar, Filter, Monitor, Code, Clock, LifeBuoy, BarChart as BarChartIcon, PieChart as PieIcon, User, ClipboardList, Download } from 'lucide-react';
import { getUserActivityTargets, getUserReport, getHelpStats, getAdminSurveys, getSurveyResults } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#a855f7', '#ec4899'];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
      borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: 12,
      boxShadow: 'var(--shadow-md)',
    }}>
      {label && <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--text-primary)', fontWeight: 600 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

export default function Reports() {
  const [activeTab, setActiveTab]         = useState('activity');
  const [targets, setTargets]             = useState([]);
  const [selectedPc, setSelectedPc]       = useState('');
  const [startDate, setStartDate]         = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate]             = useState(() => new Date().toISOString().split('T')[0]);
  const [reportData, setReportData]       = useState(null);
  const [helpData, setHelpData]           = useState(null);
  const [surveysList, setSurveysList]     = useState([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState('');
  const [surveyResults, setSurveyResults] = useState(null);
  const [loading, setLoading]             = useState(false);

  useEffect(() => {
    getUserActivityTargets().then(d => { setTargets(d || []); if (d?.length) setSelectedPc(d[0].pcName); });
    getAdminSurveys().then(d => setSurveysList(d || []));
  }, []);

  const run = async () => {
    setLoading(true);
    try {
      if (activeTab === 'activity') {
        if (!selectedPc) return toast.error('Bir cihaz seçin.');
        const d = await getUserReport(selectedPc, startDate, endDate);
        setReportData(d); setHelpData(null); setSurveyResults(null);
        toast.success('Rapor oluşturuldu.');
      } else if (activeTab === 'helpdesk') {
        const d = await getHelpStats(startDate, endDate);
        setHelpData(d); setReportData(null); setSurveyResults(null);
        toast.success('İstatistikler güncellendi.');
      } else {
        if (!selectedSurveyId) return toast.error('Bir anket seçin.');
        const d = await getSurveyResults(selectedSurveyId);
        setSurveyResults(d); setReportData(null); setHelpData(null);
        toast.success('Anket analizi yüklendi.');
      }
    } catch { toast.error('Hata oluştu.'); }
    finally { setLoading(false); }
  };

  const quickRange = (days) => {
    const end = new Date(), start = new Date();
    start.setDate(end.getDate() - days);
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  };

  const fmt = (s) => {
    if (!s && s !== 0) return '0s';
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}s ${m}d`;
    if (m > 0) return `${m}d`;
    return `${s}s`;
  };

  const helpStats = useMemo(() => {
    if (!helpData) return null;
    const byUser = {}, byCategory = {}, byStatus = {};
    helpData.forEach(r => {
      byUser[r.senderName] = (byUser[r.senderName] || 0) + 1;
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    });
    return {
      userChart:     Object.entries(byUser).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      categoryChart: Object.entries(byCategory).map(([name, value]) => ({ name, value })),
      statusChart:   Object.entries(byStatus).map(([name, value]) => ({ name, value })),
      total: helpData.length,
    };
  }, [helpData]);

  const renderSurveyChart = (question, results) => {
    if (question.type === 'text') return <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Metin soruları için grafik gösterilemez.</p>;
    const qAnswers = results.answers.filter(a => a.questionId === question.id);
    const counts   = {};
    qAnswers.forEach(a => {
      if (question.type === 'checkbox') {
        try { JSON.parse(a.value).forEach(v => counts[v] = (counts[v] || 0) + 1); }
        catch { counts[a.value] = (counts[a.value] || 0) + 1; }
      } else { counts[a.value] = (counts[a.value] || 0) + 1; }
    });
    const data = Object.keys(counts).map(name => ({ name, value: counts[name] }));
    return (
      <div style={{ height: 200, marginTop: 12 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={130} style={{ fontSize: 11 }} stroke="var(--text-muted)" />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const TABS = [
    { id: 'activity', icon: Monitor,       label: 'Kullanıcı Etkinlik' },
    { id: 'helpdesk', icon: LifeBuoy,      label: 'Yardım Masası' },
    { id: 'surveys',  icon: ClipboardList, label: 'Anket Raporları' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">
            <FileText size={20} color="var(--indigo-bright)" />
            Sistem Raporları
          </h1>
          <p className="page-subtitle">Performans, etkinlik ve destek taleplerine ait kapsamlı analizler</p>
        </div>

        <div className="tab-list">
          {TABS.map(t => (
            <button key={t.id} className={`tab-item ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Panel */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
        {activeTab === 'activity' && (
          <div className="form-group" style={{ flex: '1', minWidth: 200 }}>
            <label className="form-label">Hedef Cihaz</label>
            <select className="form-select" value={selectedPc} onChange={e => setSelectedPc(e.target.value)}>
              <option value="">Cihaz seçin…</option>
              {Object.entries(targets.reduce((acc, t) => {
                const g = t.group || 'Genel'; if (!acc[g]) acc[g] = []; acc[g].push(t); return acc;
              }, {})).map(([group, list]) => (
                <optgroup key={group} label={group}>
                  {list.map(t => <option key={t.id} value={t.pcName}>{t.pcName}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
        )}

        {activeTab === 'surveys' && (
          <div className="form-group" style={{ flex: '1', minWidth: 200 }}>
            <label className="form-label">Anket</label>
            <select className="form-select" value={selectedSurveyId} onChange={e => setSelectedSurveyId(e.target.value)}>
              <option value="">Anket seçin…</option>
              {surveysList.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>
        )}

        <div className="form-group" style={{ flex: '0 1 160px' }}>
          <label className="form-label">Başlangıç</label>
          <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>

        <div className="form-group" style={{ flex: '0 1 160px' }}>
          <label className="form-label">Bitiş</label>
          <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 8, paddingBottom: 1 }}>
          <button className="btn btn-ghost" onClick={() => quickRange(7)}>7 Gün</button>
          <button className="btn btn-ghost" onClick={() => quickRange(30)}>30 Gün</button>
          <button className="btn btn-primary" onClick={run} disabled={loading}>
            <Filter size={14} />
            {loading ? 'Hazırlanıyor…' : 'Oluştur'}
          </button>
        </div>
      </div>

      {/* ── Activity Report Results ── */}
      {activeTab === 'activity' && reportData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'var(--indigo-dim)', border: '1px solid var(--border-accent)', borderRadius: 'var(--r-md)', fontSize: 13 }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Cihaz: </span>
              <strong>{reportData.pcName}</strong>
              <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>·</span>
              <span style={{ color: 'var(--text-secondary)' }}>{reportData.dateRange}</span>
            </div>
            <button className="btn btn-ghost" onClick={() => window.print()} style={{ fontSize: 12 }}>
              <Download size={13} /> Yazdır
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { label: 'Toplam Açık', val: fmt(reportData.totalOpenSeconds), icon: Clock, color: 'var(--indigo)' },
              { label: 'Aktif Kullanım', val: fmt(reportData.totalActiveSeconds), icon: Monitor, color: 'var(--cyan)' },
              { label: 'Boşta', val: fmt(reportData.idleSeconds), icon: Clock, color: 'var(--text-muted)' },
              { label: 'SolidWorks', val: fmt(reportData.solidWorksActiveSeconds), icon: Code, color: 'var(--amber)' },
            ].map(s => (
              <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px' }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: `${s.color}15`, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={16} color={s.color} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5 }}>{s.val}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={14} color="var(--indigo-bright)" /> Günlük Döküm
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Toplam Açık</th>
                    <th>Aktif Kullanım</th>
                    <th>SolidWorks</th>
                    <th>Verimlilik</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.dailyBreakdown.map((day, i) => {
                    const eff = day.solidWorksOpen > 0 ? Math.round((day.solidWorksActive / day.solidWorksOpen) * 100) : 0;
                    return (
                      <tr key={i}>
                        <td><strong>{day.date}</strong></td>
                        <td>{fmt(day.totalSeconds)}</td>
                        <td style={{ color: 'var(--cyan)' }}>{fmt(day.activeSeconds)}</td>
                        <td style={{ color: 'var(--amber)' }}>{fmt(day.solidWorksActive)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ flex: 1, height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${eff}%`, background: 'var(--green)' }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', minWidth: 28 }}>%{eff}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Help Desk Results ── */}
      {activeTab === 'helpdesk' && helpStats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { label: 'Toplam Talep',   val: helpStats.total,                   icon: LifeBuoy,      color: 'var(--amber)' },
              { label: 'Kullanıcı',      val: helpStats.userChart.length,         icon: User,          color: 'var(--indigo-bright)' },
              { label: 'Kategori',       val: helpStats.categoryChart.length,     icon: BarChartIcon,  color: 'var(--green)' },
            ].map(s => (
              <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', background: `${s.color}15`, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={18} color={s.color} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5 }}>{s.val}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <PieIcon size={14} color="var(--indigo-bright)" /> Kategori Dağılımı
              </div>
              <div style={{ padding: '12px 16px 20px', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={helpStats.categoryChart} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5}>
                      {helpStats.categoryChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChartIcon size={14} color="var(--cyan)" /> Personel Yoğunluğu
              </div>
              <div style={{ padding: '12px 16px 20px', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={helpStats.userChart} layout="vertical" margin={{ left: 40, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} width={100} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" fill="var(--cyan)" radius={[0, 4, 4, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Survey Results ── */}
      {activeTab === 'surveys' && surveyResults && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{surveyResults.title}</h3>
              <span className="badge badge-blue">{surveyResults.totalResponses} katılım</span>
            </div>
            <button className="btn btn-ghost" onClick={() => window.print()} style={{ fontSize: 12 }}>
              <Download size={13} /> PDF / Yazdır
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {surveyResults.questions.map((q, idx) => (
              <div key={q.id} className="card">
                <div style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', background: 'var(--indigo-dim)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: 'var(--indigo-bright)', flexShrink: 0 }}>
                    {idx + 1}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{q.text}</h4>
                    <span className="badge badge-blue" style={{ fontSize: 10 }}>{q.type}</span>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-input)', padding: 16, borderRadius: 'var(--r-md)', marginBottom: 16 }}>
                  {renderSurveyChart(q, surveyResults)}
                </div>

                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 }}>Tüm Yanıtlar</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                    {surveyResults.answers.filter(a => a.questionId === q.id).map((ans, i) => (
                      <div key={i} style={{ padding: '9px 12px', background: 'var(--bg-input)', borderRadius: 'var(--r-sm)', fontSize: 13, color: 'var(--text-secondary)' }}>
                        {ans.value}
                      </div>
                    ))}
                    {surveyResults.answers.filter(a => a.questionId === q.id).length === 0 && (
                      <div style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>Henüz yanıt yok.</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!reportData && !helpData && !surveyResults && (
        <div style={{ textAlign: 'center', padding: '100px 24px', borderRadius: 'var(--r-xl)', border: '2px dashed var(--border)' }}>
          <FileText size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)' }}>Rapor hazır değil</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Yukarıdaki filtrelerden seçim yaparak analiz oluşturun.</p>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .reports-page, .reports-page * { visibility: visible !important; }
          .reports-page { position: absolute; left: 0; top: 0; width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
