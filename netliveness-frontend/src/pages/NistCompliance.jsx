import { useState, useEffect } from 'react';
import { 
  ShieldCheck, Search, Save, CircleAlert, CircleCheck, 
  CircleHelp, RefreshCcw, Info, FileText, Upload, Download, Trash2, FilePlus, ExternalLink
} from 'lucide-react';
import { getNistRequirements, updateNistRequirement, seedNistRequirements, uploadNistDocument, downloadNistDocument } from '../api';
import ComplianceDocManager from '../components/ComplianceDocManager';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  'Implemented': '#22c55e',
  'Partially Implemented': '#eab308',
  'Not Implemented': '#ef4444',
  'N/A': '#94a3b8'
};

export default function NistCompliance() {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getNistRequirements();
      setRequirements(data);
    } catch (err) {
      console.error(err);
      toast.error("Veriler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    try {
      toast.loading("Liste oluşturuluyor...", { id: 'seed' });
      await seedNistRequirements();
      toast.success("NIST listesi başarıyla oluşturuldu.", { id: 'seed' });
      loadData();
    } catch {
      toast.error("Liste zaten mevcut veya bir hata oluştu.", { id: 'seed' });
    }
  };

  const handleUpdate = async (req) => {
    try {
      setSavingId(req.id);
      await updateNistRequirement(req.id, req);
      toast.success("Güncellendi");
      setRequirements(prev => prev.map(r => r.id === req.id ? req : r));
    } catch {
      toast.error("Güncelleme başarısız.");
    } finally {
      setSavingId(null);
    }
  };

  const handleFileUpload = async (id, file) => {
    try {
      toast.loading("Dosya yükleniyor...", { id: 'upload' });
      await uploadNistDocument(id, file);
      toast.success("Dosya başarıyla yüklendi.", { id: 'upload' });
      loadData();
    } catch {
      toast.error("Dosya yükleme hatası.");
    }
  };

  const handleDownload = (id, fileName) => {
    if (!fileName) return;
    const url = downloadNistDocument(id);
    window.open(url, '_blank');
  };

  const families = requirements && Array.isArray(requirements) ? [...new Set(requirements.map(r => r.family))] : [];
  const filtered = (requirements || []).filter(r => 
    (r.family || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.requirementId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: requirements.length,
    implemented: requirements.filter(r => r.status === 'Implemented').length,
    partial: requirements.filter(r => r.status === 'Partially Implemented').length,
    notStarted: requirements.filter(r => r.status === 'Not Implemented').length,
    na: requirements.filter(r => r.status === 'N/A').length
  };

  const compliancePercentage = stats.total > 0 
    ? Math.round(((stats.implemented + (stats.partial * 0.5)) / (stats.total - stats.na)) * 100) 
    : 0;

  if (loading) return <div className="loading-state">Yükleniyor...</div>;

  return (
    <div className="page-container" style={{ padding: '24px 24px 40px', maxWidth: '100%', overflowX: 'hidden' }}>
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: '1', minWidth: '300px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldCheck color="var(--accent-green)" size={28} />
              NIST 800-171 R2 Uyum Takibi
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              REPKON Bilişim Sistemleri CUI (Controlled Unclassified Information) Güvenlik Standartları
            </p>

            {requirements.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <div className="stat-card" style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', minWidth: '140px' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Genel Uyum</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-green)' }}>%{compliancePercentage}</div>
                    <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: '2px', width: `${compliancePercentage}%`, background: 'var(--accent-green)' }} />
                    </div>
                  </div>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', minWidth: '120px' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase' }}>Tamamlanan</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#22c55e' }}>{stats.implemented} <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 400 }}>/ {stats.total}</span></div>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', minWidth: '100px' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase' }}>Devam Eden</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#eab308' }}>{stats.partial}</div>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', minWidth: '100px' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase' }}>Kritik (Eksik)</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#ef4444' }}>{stats.notStarted}</div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <a 
              href="/templates/NIST_Compliance_Template.md" 
              download="NIST_Compliance_Template.md"
              className="btn-secondary" 
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontSize: '13px' }}
            >
              <FilePlus size={16} /> Şablon İndir
            </a>
            <div className="search-box" style={{ 
              display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-card)', 
              border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0 12px' 
            }}>
              <Search size={16} color="var(--text-secondary)" />
              <input 
                type="text" 
                placeholder="Gereksinim veya aile ara..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '10px 0', outline: 'none', width: '200px', fontSize: '13px' }}
              />
            </div>
          </div>
        </div>

        {requirements.length === 0 && (
          <div style={{ 
            marginTop: '40px', textAlign: 'center', padding: '60px', background: 'var(--bg-card)', 
            borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' 
          }}>
            <CircleHelp size={48} color="var(--text-secondary)" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3 style={{ marginBottom: '8px' }}>NIST Gereksinim Listesi Boş</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Standardı takip etmeye başlamak için listeyi oluşturun.</p>
            <button className="btn-primary" onClick={handleSeed} style={{ padding: '12px 24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCcw size={16} /> Listeyi Oluştur
            </button>
          </div>
        )}
      </div>

      <ComplianceDocManager standard="NIST" />

      {requirements.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {families.map(family => {
            const familyReqs = filtered.filter(r => r.family === family);
            if (familyReqs.length === 0) return null;

            return (
              <section key={family}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '4px', height: '18px', background: 'var(--accent-green)', borderRadius: '2px' }} />
                  {family}
                </h2>
                
                <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden', width: '100%' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', width: '80px' }}>ID</th>
                        <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', width: 'auto' }}>Gereksinim Açıklaması</th>
                        <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', width: '180px' }}>Durum</th>
                        <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', width: '220px' }}>Yorum / Notlar</th>
                        <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', width: '90px' }}>Belge</th>
                      </tr>
                    </thead>
                    <tbody>
                      {familyReqs.map(req => (
                        <tr key={req.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                          <td style={{ padding: '16px', fontWeight: 600, color: 'var(--accent-green)', verticalAlign: 'top' }}>{req.requirementId}</td>
                          <td style={{ padding: '16px', verticalAlign: 'top' }}>
                            <div style={{ fontSize: '14px', lineHeight: '1.5', whiteSpace: 'normal', wordBreak: 'break-word', minWidth: 0 }}>{req.description}</div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <select 
                              value={req.status}
                              onChange={(e) => handleUpdate({ ...req, status: e.target.value })}
                              style={{ 
                                width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', 
                                border: `1px solid ${STATUS_COLORS[req.status]}`, borderRadius: '6px', 
                                color: 'var(--text-primary)', fontSize: '13px', outline: 'none'
                              }}
                            >
                              <option value="Implemented">Implemented</option>
                              <option value="Partially Implemented">Partially Implemented</option>
                              <option value="Not Implemented">Not Implemented</option>
                              <option value="N/A">N/A</option>
                            </select>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input 
                                type="text"
                                placeholder="Not ekleyin..."
                                value={req.comments}
                                onChange={(e) => setRequirements(prev => prev.map(r => r.id === req.id ? {...r, comments: e.target.value} : r))}
                                onBlur={() => handleUpdate(req)}
                                style={{ 
                                  flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', 
                                  border: '1px solid var(--border-color)', borderRadius: '6px', 
                                  color: 'var(--text-primary)', fontSize: '13px', outline: 'none'
                                }}
                              />
                                {savingId === req.id && <RefreshCcw size={14} className="spin" color="var(--accent-green)" />}
                              </div>
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {req.documentPath ? (
                                  <button 
                                    onClick={() => handleDownload(req.id, req.documentPath)}
                                    title={req.documentPath}
                                    style={{ background: 'rgba(34, 197, 94, 0.1)', border: 'none', padding: '8px', borderRadius: '4px', color: '#22c55e', cursor: 'pointer' }}
                                  >
                                    <Download size={16} />
                                  </button>
                                ) : (
                                  <div style={{ color: 'var(--text-secondary)', opacity: 0.3 }} title="Dosya yok">
                                    <Download size={16} />
                                  </div>
                                )}
                                <label style={{ background: 'rgba(255, 255, 255, 0.05)', border: 'none', padding: '8px', borderRadius: '4px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                  <Upload size={16} />
                                  <input 
                                    type="file" 
                                    hidden 
                                    onChange={(e) => {
                                      if (e.target.files?.[0]) handleFileUpload(req.id, e.target.files[0]);
                                    }}
                                  />
                                </label>
                              </div>
                            </td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
