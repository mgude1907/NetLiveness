import { useState, useEffect, useCallback } from 'react';
import { getSettings, updateSettings, restartSystem, getSystemHealth, startWorker, testPersonnelConnection} from '../api';
import { Save, Settings as SettingsIcon, X as XIcon, Plus, Terminal, RefreshCw, TriangleAlert, Zap, Activity, Database, PlayCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [form, setForm]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [newFirm, setNewFirm] = useState('');
  
  // System Health
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [workerStarting, setWorkerStarting] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await getSystemHealth();
      setHealth(res);
    } catch {
      setHealth({ api: "Hata", worker: "Hata", database: "Hata" });
    }
    setHealthLoading(false);
  }, []);

  const handleStartWorker = async () => {
    setWorkerStarting(true);
    try {
      await startWorker();
      toast.success("Worker başlatma komutu iletildi.");
      setTimeout(fetchHealth, 2000);
    } catch (e) {
      toast.error("Worker başlatılamadı!");
    } finally {
      setWorkerStarting(false);
    }
  };

  const handleRestart = async () => {
    if (!window.confirm("DIKKAT! Sistem yeniden başlatılacak. Servisleriniz geçici olarak kesintiye uğrayabilir. Onaylıyor musunuz?")) return;
    setRestarting(true);
    try {
      const res = await restartSystem();
      toast.success(res.message || "Yeniden başlatılıyor...");
      setTimeout(() => window.location.reload(), 5000);
    } catch (e) {
      toast.error("Yeniden başlatma isteği başarısız oldu!");
      setRestarting(false);
    }
  };

  const handleTestConnection = async () => {
    // Local validation
    if (form.personnelIntegrationType === 'SQL' || form.personnelSqlAuthType === 'SQL') {
       if (!form.personnelSqlHost) { toast.error("Sunucu Adı boş bırakılamaz."); return; }
       if (form.personnelSqlAuthType !== 'Windows' && !form.personnelSqlUser) {
          toast.error("SQL Kimlik Doğrulaması için Kullanıcı Adı (Login) gereklidir.");
          return;
       }
    }

    setTestingConnection(true);
    const tid = toast.loading('SQL Server bağlantısı test ediliyor...');
    try {
      console.log("Bağlantı Testi Gönderiliyor:", form); // Debug
      const res = await testPersonnelConnection(form);
      toast.success(res.message || "Bağlantı başarılı! Lütfen sağ üstteki 'Kaydet' butonu ile ayarları onaylamayı unutmayın.");
      toast.dismiss(tid);
    } catch (e) {
      toast.error(e.response?.data?.message || "Bağlantı başarısız!");
      toast.dismiss(tid);
    } finally {
      setTestingConnection(false);
    }
  };

  const load = useCallback(async () => {
    try { 
      const raw = await getSettings();
      // Ensure defaults for integration
      const withDefaults = {
        ...raw,
        personnelSqlAuthType: raw.personnelSqlAuthType || 'SQL',
        personnelIntegrationType: raw.personnelIntegrationType || 'None'
      };
      setForm(withDefaults); 
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { 
    load(); 
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, [load, fetchHealth]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(form);
      toast.success('Ayarlar başarıyla kaydedildi!');
      window.dispatchEvent(new CustomEvent('settingsUpdated'));
    } catch (e) { 
      toast.error('Kaydetme hatası!'); 
      console.error(e); 
    }
    finally { setSaving(false); }
  };

  if (loading || !form) return <div className="loading-spinner"><div className="spinner" /> Yükleniyor…</div>;

  const update = (key, val) => setForm({ ...form, [key]: val });
  
  return (
    <div>
      <div className="page-header">
        <div><h2>Ayarlar</h2><p>Uygulama yapılandırması</p></div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} /> {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </div>
      
      {/* Branding & Logo */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-header"><h3>🎨 Markalama & Logo</h3></div>
        <div className="form-row">
          <div className="form-group">
            <label>Uygulama Başlığı</label>
            <input 
              className="form-control" 
              value={form.appTitle || ''} 
              onChange={e => update('appTitle', e.target.value)} 
              placeholder="REPKON" 
            />
          </div>
          <div className="form-group">
            <label>Uygulama Logosu</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <div style={{ 
                width: 64, height: 64, background: 'var(--bg-secondary)', 
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', border: '1px solid var(--border-color)'
              }}>
                {form.appLogo ? (
                  <img src={form.appLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Logo Yok</span>
                )}
              </div>
              <label className="btn btn-ghost" style={{ cursor: 'pointer', fontSize: 13 }}>
                <Plus size={14} /> Logo Değiştir
                <input 
                  type="file" 
                  accept="image/*" 
                  hidden 
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => update('appLogo', reader.result);
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
              </label>
              {form.appLogo && (
                <button 
                  className="btn btn-ghost" 
                  style={{ color: 'var(--accent-red)' }}
                  onClick={() => update('appLogo', '')}
                >
                  Kaldır
                </button>
              )}
            </div>
            <p style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
              Önerilen: 200x200px, şeffaf PNG. Logoyu kaldırırsanız varsayılan logo kullanılır.
            </p>
          </div>
        </div>
      </div>


      {/* Monitoring */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-header"><h3>📡 İzleme Ayarları</h3></div>
        <div className="form-group">
          <label>Ping Aralığı (ms)</label>
          <input type="number" className="form-control" style={{ maxWidth:240 }}
            value={form.pingIntervalMs} onChange={e => update('pingIntervalMs', parseInt(e.target.value) || 5000)} />
        </div>
      </div>

      {/* WMI Authentication */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-header"><h3>🖥️ WMI İzleme Yetkilendirmesi</h3></div>
        <div className="form-row">
          <div className="form-group">
            <label>WMI Kullanıcı Adı</label>
            <input className="form-control" value={form.wmiUser || ''} onChange={e => update('wmiUser', e.target.value)} placeholder="administrator" />
          </div>
          <div className="form-group">
            <label>WMI Şifre</label>
            <input type="password" className="form-control" value={form.wmiPass || ''} onChange={e => update('wmiPass', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>WMI Domain (Opsiyonel)</label>
          <input className="form-control" value={form.wmiDomain || ''} onChange={e => update('wmiDomain', e.target.value)} placeholder="DOMAIN_ADINIZ" />
          <p style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: 12 }}>
            Ağdaki uzak sunuculardan kaynak verisi çekebilmek için yetkili bir kullanıcı bilgisi girin.
          </p>
        </div>
      </div>

      {/* SMTP */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-header"><h3>📧 E-Posta (SMTP)</h3></div>
        <div className="form-group" style={{ display:'flex', alignItems:'center', gap:8 }}>
          <input type="checkbox" id="smtpEnabled" checked={form.smtpEnabled} onChange={e => update('smtpEnabled', e.target.checked)} />
          <label htmlFor="smtpEnabled" style={{ margin:0, textTransform:'none', letterSpacing:0 }}>SMTP Aktif</label>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>SMTP Sunucu</label>
            <input className="form-control" value={form.smtpServer} onChange={e => update('smtpServer', e.target.value)} />
          </div>
          <div className="form-group">
            <label>SMTP Port</label>
            <input type="number" className="form-control" value={form.smtpPort} onChange={e => update('smtpPort', parseInt(e.target.value) || 587)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Kullanıcı Adı</label>
            <input className="form-control" value={form.smtpUser} onChange={e => update('smtpUser', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Şifre</label>
            <input type="password" className="form-control" value={form.smtpPass} onChange={e => update('smtpPass', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>BT Departmanı E-Posta</label>
            <input className="form-control" value={form.itEmailTo || ''} onChange={e => update('itEmailTo', e.target.value)} placeholder="bt@domain.com" />
          </div>
          <div className="form-group">
            <label>İdari İşler E-Posta</label>
            <input className="form-control" value={form.adminEmailTo || ''} onChange={e => update('adminEmailTo', e.target.value)} placeholder="idari@domain.com" />
          </div>
        </div>
        <div className="form-group">
          <label>Genel Sistem Alarm E-Posta (Opsiyonel)</label>
          <input className="form-control" value={form.alertEmailTo || ''} onChange={e => update('alertEmailTo', e.target.value)} />
        </div>
      </div>

      {/* GLPI */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-header"><h3>🔧 GLPI Entegrasyonu</h3></div>
        <div className="form-group">
          <label>GLPI URL</label>
          <input className="form-control" value={form.glpiUrl} onChange={e => update('glpiUrl', e.target.value)} placeholder="https://glpi.domain.com" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>App Token</label>
            <input className="form-control" value={form.glpiAppToken} onChange={e => update('glpiAppToken', e.target.value)} />
          </div>
          <div className="form-group">
            <label>User Token</label>
            <input className="form-control" value={form.glpiUserToken} onChange={e => update('glpiUserToken', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Firmalar (Şubeler) Yönetimi */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-header">
          <h3>🏢 Firma Yönetimi</h3>
          <p style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: 13, fontWeight: 'normal' }}>
            Ağ İzleme ve Personel sayfalarındaki firma listelerini buradan yönetebilirsiniz.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {(form.firmsList || '').split(',').map(f => f.trim()).filter(Boolean).map(firm => (
            <div key={firm} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--bg-input)', border: '1px solid var(--border-light)',
              padding: '6px 12px', borderRadius: 20, fontSize: 13, color: 'var(--text-primary)'
            }}>
              <span>{firm}</span>
              <button className="btn-icon" onClick={() => {
                const list = (form.firmsList || '').split(',').map(f => f.trim()).filter(Boolean);
                update('firmsList', list.filter(x => x !== firm).join(','));
              }} style={{ width: 18, height: 18, color: 'var(--text-muted)' }}>
                <XIcon size={14} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, maxWidth: 300 }}>
          <input 
            className="form-control" 
            placeholder="Yeni Firma Adı..." 
            value={newFirm} 
            onChange={e => setNewFirm(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('btnAddFirm')?.click();
              }
            }}
          />
          <button 
            id="btnAddFirm"
            className="btn btn-secondary" 
            onClick={() => {
              if (!newFirm.trim()) return;
              const list = (form.firmsList || '').split(',').map(f => f.trim()).filter(Boolean);
              if (!list.includes(newFirm.trim())) {
                update('firmsList', [...list, newFirm.trim()].join(','));
                setNewFirm('');
              }
            }}>
            <Plus size={16} /> Ekle
          </button>
        </div>
      </div>
      
      {/* 🔗 Personel Sistem Entegrasyonu */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
           <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
             <Activity size={18} /> 🔗 Personel Sistem Entegrasyonu (Meyer / IFS)
           </h3>
        </div>
        <div className="form-group">
          <label>Entegrasyon Tipi</label>
          <select 
            className="form-control" 
            style={{ maxWidth: 300 }}
            value={form.personnelIntegrationType} 
            onChange={e => update('personnelIntegrationType', e.target.value)}
          >
            <option value="None">Devre Dışı</option>
            <option value="SQL">SQL Server (Doğrudan Bağlantı)</option>
          </select>
        </div>

        {form.personnelIntegrationType === 'SQL' && (
          <div style={{ 
            marginTop: 20, 
            background: '#fff', 
            border: '1px solid #ccc', 
            borderRadius: 4, 
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            maxWidth: 600,
            margin: '20px auto 0 auto',
            fontFamily: '"Segoe UI", Tahoma, sans-serif'
          }}>
            {/* SSMS Style Header */}
            <div style={{ 
              background: '#f0f0f0', 
              padding: '10px 15px', 
              borderBottom: '1px solid #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: 24, fontWeight: 400, color: '#333' }}>SQL Server</span>
              <XIcon size={16} style={{ color: '#666', cursor: 'pointer' }} />
            </div>

            <div style={{ padding: '20px 30px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) 2fr', gap: '12px 20px', alignItems: 'center' }}>
                
                {/* Server Type (Disabled in SSMS usually) */}
                <span style={{ fontSize: 13, color: '#666' }}>Server type:</span>
                <select className="form-control" disabled style={{ background: '#f5f5f5', fontSize: 13, height: 28, padding: '0 8px' }}>
                  <option>Database Engine</option>
                </select>

                {/* Server Name */}
                <span style={{ fontSize: 13, color: '#333' }}>Server name:</span>
                <input 
                  className="form-control" 
                  style={{ height: 28, fontSize: 13, padding: '0 8px' }}
                  value={form.personnelSqlHost || ''} 
                  onChange={e => update('personnelSqlHost', e.target.value)}
                  placeholder="MEYER"
                />

                {/* Authentication */}
                <span style={{ fontSize: 13, color: '#333' }}>Authentication:</span>
                <select 
                  className="form-control" 
                  style={{ height: 28, fontSize: 13, padding: '0 8px' }}
                  value={form.personnelSqlAuthType || 'SQL'} 
                  onChange={e => update('personnelSqlAuthType', e.target.value)}
                >
                  <option value="SQL">SQL Server Authentication</option>
                  <option value="Windows">Windows Authentication</option>
                </select>

                {/* Database Name (Essential) */}
                <span style={{ fontSize: 13, color: '#333' }}>Database name:</span>
                <input 
                  className="form-control" 
                  style={{ height: 28, fontSize: 13, padding: '0 8px' }}
                  value={form.personnelSqlDatabase || ''} 
                  onChange={e => update('personnelSqlDatabase', e.target.value)}
                  placeholder="MeyerDB"
                />

                {/* Login */}
                <span style={{ fontSize: 13, color: form.personnelSqlAuthType === 'Windows' ? '#999' : '#333' }}>Login:</span>
                <input 
                  className="form-control" 
                  disabled={form.personnelSqlAuthType === 'Windows'}
                  style={{ height: 28, fontSize: 13, padding: '0 8px', background: form.personnelSqlAuthType === 'Windows' ? '#f5f5f5' : '#fff' }}
                  value={form.personnelSqlUser || ''} 
                  onChange={e => update('personnelSqlUser', e.target.value)}
                  placeholder="meyer"
                />

                {/* Password */}
                <span style={{ fontSize: 13, color: form.personnelSqlAuthType === 'Windows' ? '#999' : '#333' }}>Password:</span>
                <input 
                  type="password"
                  className="form-control" 
                  disabled={form.personnelSqlAuthType === 'Windows'}
                  style={{ height: 28, fontSize: 13, padding: '0 8px', background: form.personnelSqlAuthType === 'Windows' ? '#f5f5f5' : '#fff' }}
                  value={form.personnelSqlPass || ''} 
                  onChange={e => update('personnelSqlPass', e.target.value)}
                />
              </div>

              {/* Remember Password Checkbox */}
              <div style={{ marginTop: 10, marginLeft: 140, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="remPass" style={{ width: 13, height: 13 }} defaultChecked />
                <label htmlFor="remPass" style={{ fontSize: 12, color: '#333', textTransform: 'none', margin: 0 }}>Remember password</label>
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: 30, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button 
                  className="btn" 
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  style={{ padding: '4px 20px', fontSize: 13, minWidth: 80, background: '#e1e1e1', border: '1px solid #ccc', cursor: testingConnection ? 'not-allowed' : 'pointer' }}>
                  {testingConnection ? 'Testing...' : 'Connect'}
                </button>
                <button 
                  className="btn" 
                  onClick={() => update('personnelIntegrationType', 'None')}
                  style={{ padding: '4px 20px', fontSize: 13, minWidth: 80, background: '#e1e1e1', border: '1px solid #ccc' }}>
                  Cancel
                </button>
              </div>
            </div>

            {/* Sync Status Footer */}
            {form.personnelIntegrationLastSync && (
              <div style={{ background: '#f5f5f5', padding: '5px 15px', borderTop: '1px solid #ddd', fontSize: 11, color: '#666' }}>
                Son Başarılı Senkronizasyon: {new Date(form.personnelIntegrationLastSync).toLocaleString()}
              </div>
            )}
          </div>
        )}

        {form.personnelIntegrationType === 'SQL' && (
          <div style={{ marginTop: 30 }}>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Database size={14} /> Personel Çekme Sorgusu (SQL Query)
              </label>
              <textarea 
                className="form-control" 
                rows={4}
                style={{ fontFamily: 'monospace', fontSize: 13, background: 'var(--bg-input)' }}
                value={form.personnelIntegrationSqlQuery || ''} 
                onChange={e => update('personnelIntegrationSqlQuery', e.target.value)}
                placeholder="SELECT SicilNo, Ad, Soyad, Bolum, Gorev, KartNo FROM Employees WHERE Active=1"
              />
              <p style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: 11 }}>
                * Bu sorgu Meyer veya IFS veritabanınızda çalıştırılır. <br/>
                * <b>SicilNo, Ad, Soyad, Bolum, Gorev, KartNo</b> kolonlarını içermelidir.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Zimmet Template */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h3>📄 Zimmet Şablonu</h3></div>
        <div className="form-group">
          <label>Zimmet Template Dosya Yolu</label>
          <input className="form-control" value={form.zimmetTemplatePath} onChange={e => update('zimmetTemplatePath', e.target.value)} />
        </div>
      </div>

      {/* Sisteme Ayağa Kaldırma & Servis Yönetimi */}
      <div className="card" style={{ border: '1px solid var(--border-color)' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-amber)' }}>
            <Activity size={18} /> Sistemi Ayağa Kaldırma & Servis Yönetimi
          </h3>
          <button className="btn btn-secondary" onClick={fetchHealth} disabled={healthLoading}>
            <RefreshCw size={14} style={{ animation: healthLoading ? 'spin 1s linear infinite' : 'none' }} /> Durumu Güncelle
          </button>
        </div>
        
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          
          {/* API Servis */}
          <div style={{ 
            padding: 20, borderRadius: 12, background: 'var(--bg-secondary)', 
            border: `1px solid ${health?.api === 'Çalışıyor' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <div style={{ color: health?.api === 'Çalışıyor' ? '#10b981' : '#ef4444' }}><Zap size={24} /></div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>API Servisi (Port 5006)</div>
                <div style={{ fontSize: 12, color: health?.api === 'Çalışıyor' ? '#10b981' : '#ef4444' }}>{health?.api || 'Yükleniyor...'}</div>
              </div>
            </div>
            <button className="btn" 
              onClick={handleRestart}
              disabled={restarting}
              style={{ 
                background: health?.api === 'Çalışıyor' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                color: health?.api === 'Çalışıyor' ? '#10b981' : '#ef4444',
                borderColor: health?.api === 'Çalışıyor' ? '#10b981' : '#ef4444',
                fontSize: 12
              }}>
              <RefreshCw size={12} /> {restarting ? 'Başlatılıyor...' : 'Yeniden Başlat'}
            </button>
          </div>

          {/* Monitor Worker */}
          <div style={{ 
            padding: 20, borderRadius: 12, background: 'var(--bg-secondary)', 
            border: `1px solid ${health?.worker === 'Çalışıyor' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <div style={{ color: health?.worker === 'Çalışıyor' ? '#10b981' : '#ef4444' }}><Activity size={24} /></div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>İzleme Servisi (Worker)</div>
                <div style={{ fontSize: 12, color: health?.worker === 'Çalışıyor' ? '#10b981' : '#ef4444' }}>{health?.worker || 'Yükleniyor...'}</div>
              </div>
            </div>
            <button className="btn" 
              onClick={health?.worker === 'Çalışıyor' ? null : handleStartWorker}
              disabled={workerStarting || health?.worker === 'Çalışıyor'}
              style={{ 
                background: health?.worker === 'Çalışıyor' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                color: health?.worker === 'Çalışıyor' ? '#10b981' : '#ef4444',
                borderColor: health?.worker === 'Çalışıyor' ? '#10b981' : '#ef4444',
                fontSize: 12
              }}>
              <PlayCircle size={12} /> {workerStarting ? 'Başlatılıyor...' : (health?.worker === 'Çalışıyor' ? 'Aktif' : 'Başlat')}
            </button>
          </div>

          {/* Database */}
          <div style={{ 
            padding: 20, borderRadius: 12, background: 'var(--bg-secondary)', 
            border: `1px solid ${health?.database === 'Bağlı' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            display: 'flex', alignItems: 'center', gap: 15
          }}>
            <div style={{ color: health?.database === 'Bağlı' ? '#10b981' : '#ef4444' }}><Database size={24} /></div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Veritabanı (SQLite)</div>
              <div style={{ fontSize: 12, color: health?.database === 'Bağlı' ? '#10b981' : '#ef4444' }}>{health?.database || 'Yükleniyor...'}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
