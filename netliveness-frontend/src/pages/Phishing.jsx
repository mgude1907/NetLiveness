import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Send, Users, Activity, BarChart3, 
  Search, Plus, RefreshCcw, MoreHorizontal, 
  ExternalLink, Trash2, Eye, Mail, MousePointer2, 
  UserX, CheckCircle2, AlertTriangle, ChevronRight,
  TrendingDown, TrendingUp, Info, Building2,
  Layers, UserCircle, X, ChevronLeft, HelpCircle,
  Settings as SettingsIcon, LayoutDashboard, Binary,
  ShieldCheck, Server, Key, MailSearch, UserPlus,
  ArrowRight, Save, Globe, Code, Edit3, ClipboardList,
  Flame, MailWarning, Link2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line,
  Cell, PieChart, Pie
} from 'recharts';
import toast from 'react-hot-toast';

const DEFAULT_TEMPLATES = [
  { 
    id: 'hr_payroll', 
    name: 'Maaş Bordrosu Görüntüleme', 
    category: 'İK', 
    risk: 'Kritik', 
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=100&h=100&fit=crop',
    subject: 'NetLiveness Giriş: Maaş Bordronuz Hazırlandı',
    senderName: 'NetLiveness HR Portal',
    senderEmail: 'hr@netliveness-portal.com',
    content: `
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-family: Arial, sans-serif;">
        <tr>
          <td align="center" style="padding: 20px;">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #ffffff;">
              <tr>
                <td style="background: #f8fafc; padding: 20px; text-align: center; border-bottom: 1px solid #e2e8f0;">
                  <img src="cid:reprologo" width="140" alt="REPKON" style="display: block; margin: 0 auto;" />
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 20px;">Sayın çalışanımız,</h2>
                  <p style="color: #475569; line-height: 1.6; margin: 0 0 25px 0;">Nisan 2026 dönemine ait maaş bordronuz dijital platformumuza yüklenmiştir. Detayları görüntülemek ve bordro dökümünüzü indirmek için aşağıdaki butonu kullanabilirsiniz.</p>
                  <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                    <tr>
                      <td align="center" bgcolor="#d4af37" style="border-radius: 6px;">
                        <a href="#" target="_blank" style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 14px;">BORDROYU GÖRÜNTÜLE</a>
                      </td>
                    </tr>
                  </table>
                  <p style="color: #94a3b8; font-size: 12px; margin: 30px 0 0 0; text-align: center;">Güvenliğiniz için sisteme giriş yaparken şirket e-posta adresinizi kullanın.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
  },
  { 
    id: 'it_storage', 
    name: 'Disk Depolama Kotası', 
    category: 'IT Destek', 
    risk: 'Yüksek', 
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=300&fit=crop',
    subject: 'UYARI: Bulut Saklama Alanınız %98 Doldu',
    senderName: 'IT Support Team',
    senderEmail: 'support@cloud-verify.com',
    content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #dc2626; border-radius: 12px; padding: 20px; background: #fffafb;">
        <h3 style="color: #dc2626; margin-top: 0;">⚠️ Depolama Alanı Tükeniyor</h3>
        <p>Bulut saklama alanınızdaki veriler %98 doluluk oranına ulaştı. Kota aşımı durumunda e-posta alımınız durdurulacaktır.</p>
        <div style="background: #e2e8f0; height: 12px; border-radius: 6px; margin: 20px 0; overflow: hidden;">
          <div style="background: #dc2626; width: 98%; height: 100%;"></div>
        </div>
        <a href="#" style="background: #dc2626; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Hemen Alan Boşaltın</a>
        <p style="font-size: 11px; color: #666; margin-top: 20px;">Bu bir sistem uyarısıdır. İşlem yapılmazsa 2 saat içerisinde hesabınız kısıtlanacaktır.</p>
      </div>
    `
  },
  { 
    id: 'teams_meeting', 
    name: 'Teams Toplantı Daveti', 
    category: 'İletişim', 
    risk: 'Orta', 
    image: 'https://images.unsplash.com/photo-1611606063065-ee7946f0787a?w=100&h=100&fit=crop',
    subject: 'Yeni Toplantı Talebi: Yıllık Planlama Revizyonu',
    senderName: 'Microsoft Teams',
    senderEmail: 'noreply@msteams-invite.com',
    content: `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; background: #f3f2f1; border-radius: 4px;">
        <div style="background: #ffffff; padding: 20px; border-radius: 4px; border-top: 4px solid #464eb8;">
          <h4 style="color: #464eb8; margin: 0 0 10px 0;">Teams Toplantısı</h4>
          <p><strong>Konu:</strong> 2026 Hedefleri ve Bütçe Planlaması</p>
          <p><strong>Zaman:</strong> Yarın, 10:00 - 11:30</p>
          <a href="#" style="background: #464eb8; color: white; padding: 10px 18px; text-decoration: none; border-radius: 2px; display: inline-block; margin-top: 10px;">Toplantıya Katıl</a>
        </div>
      </div>
    `
  },
  { 
    id: 'finance_invoice', 
    name: 'E-Fatura Onayı', 
    category: 'Finans', 
    risk: 'Yüksek', 
    image: 'https://images.unsplash.com/photo-1573164060897-425941c30241?w=400&h=300&fit=crop',
    subject: 'Firma Adına Yeni E-Arşiv Faturası Oluşturuldu',
    senderName: 'Gelir İdaresi / E-Logo',
    senderEmail: 'no-reply@efatura-onay.com',
    content: `
      <div style="font-family: 'Segoe UI', Arial; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 25px;">
        <h3 style="color: #444;">E-Fatura Bilgilendirme</h3>
        <p>Hesabınıza <strong>7.450,00 TL</strong> tutarında yeni bir e-fatura gelmiştir.</p>
        <p>Fatura detayını görmek ve onaylamak için lütfen aşağıdaki bağlantıyı kullanın.</p>
        <div style="margin: 25px 0;">
          <a href="#" style="color: #007bff; font-weight: bold; text-decoration: underline;">FATURA_DETAY_SORGULA.pdf.html</a>
        </div>
        <p style="font-size: 11px; color: #888;">Bu e-posta otomatik oluşturulmuştur.</p>
      </div>
    `
  },
  {
    id: 'netflix_payment',
    name: 'Netflix Üyelik Askıya Alındı',
    category: 'Eğlence',
    risk: 'Orta',
    image: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400&h=300&fit=crop',
    subject: 'Ödemeniz Reddedildi: Netflix Üyeliğiniz Dondurulmuştur',
    senderName: 'Netflix Support',
    senderEmail: 'billing@netflix-support.com',
    content: `
      <div style="background: #141414; padding: 40px; font-family: 'Helvetica', Arial; color: #fff; max-width: 600px; margin: auto;">
        <h1 style="color: #e50914; font-size: 32px; margin-bottom: 20px;">Netflix</h1>
        <h2 style="font-size: 24px; margin-bottom: 20px;">Ödeme Bilgilerinizi Güncelleyin</h2>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">Son faturalama dönemine ait ödemeniz gerçekleştirilemedi. Mevcut üyeliğinizi korumak için lütfen ödeme bilgilerinizi 24 saat içerisinde güncelleyin.</p>
        <a href="#" style="background: #e50914; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">HESABI GÜNCELLE</a>
      </div>
    `
  },
  {
    id: 'ms_security',
    name: 'Microsoft Hesap Güvenliği',
    category: 'Sistem',
    risk: 'Yüksek',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop',
    subject: 'UYARI: Farklı Bir Cihazdan Giriş Tespit Edildi',
    senderName: 'Microsoft Güvenlik Ekibi',
    senderEmail: 'security@ms-verify.com',
    content: `
      <div style="font-family: Arial; padding: 30px; border: 1px solid #f0f0f0; max-width: 600px; margin: auto;">
        <div style="color: #0078d4; font-size: 20px; font-weight: bold; margin-bottom: 20px;">Microsoft Hesabı</div>
        <p>Hesabınıza yeni bir cihaz üzerinden (IP: 95.1.25.10 - Rusya) giriş yapıldığını fark ettik.</p>
        <p>Eğer bu işlemi siz yapmadıysanız, hesabınızın güvenliğini sağlamak için lütfen hemen şifrenizi yenileyin ve erişimi engelleyin.</p>
        <div style="margin: 30px 0;">
          <a href="#" style="background: #0078d4; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 2px;">Giriş Etkinliğini Gözden Geçir</a>
        </div>
      </div>
    `
  }
];

const COMPANIES = ['CLR', 'REP', 'MEYER', 'REPKON', 'SYSTEM'];
const DEPARTMENTS = ['IT', 'İnsan Kaynakları', 'Üretim', 'Finans', 'Satın Alma'];

export default function Phishing() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]); // Yeni: İhlal günlükleri
  
  // Scenarios State
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateForEdit, setSelectedTemplateForEdit] = useState(null);
  const [showScenarioEditor, setShowScenarioEditor] = useState(false);
  
  // Custom Groups State
  const [manualGroups, setManualGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newGroupInput, setNewGroupInput] = useState('');
  const [newUser, setNewUser] = useState({ name: '', email: '' });

  // SMTP Settings State
  const [smtp, setSmtp] = useState({
    host: 'smtp.gmail.com',
    port: '587',
    user: '',
    password: '',
    secure: false,
    trackingUrl: 'http://191.168.1.228:3001/track'
  });

  // Wizard Data
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    senderName: '',
    senderEmail: '',
    company: '',
    department: '',
    targetType: 'manual',
    manualGroupId: '',
    date: new Date().toISOString().slice(0, 16)
  });

  useEffect(() => {
    const savedCampaigns = localStorage.getItem('phishing_campaigns');
    if (savedCampaigns) setCampaigns(JSON.parse(savedCampaigns));

    const savedGroups = localStorage.getItem('phishing_manual_groups');
    if (savedGroups) setManualGroups(JSON.parse(savedGroups));

    const savedSmtp = localStorage.getItem('phishing_smtp_settings');
    if (savedSmtp) setSmtp(JSON.parse(savedSmtp));

    const savedTemplates = localStorage.getItem('phishing_custom_templates');
    if (savedTemplates) {
      const parsed = JSON.parse(savedTemplates);
      // Yeni eklenen default şablonları mevcut şablonlara enjekte et (Eğer yoklarsa)
      const merged = [...parsed];
      DEFAULT_TEMPLATES.forEach(def => {
        const index = parsed.findIndex(t => t.id === def.id);
        if (index === -1) {
          merged.push(def);
        } else {
          // Varsayılan şablonların görsellerini her zaman güncelle (Fix for broken images)
          merged[index] = { ...merged[index], image: def.image };
        }
      });
      setTemplates(merged);
      // Güncellenmiş listeyi her zaman kaydet (Böylece görsel fixleri kalıcı olur)
      localStorage.setItem('phishing_custom_templates', JSON.stringify(merged));
    } else {
      setTemplates(DEFAULT_TEMPLATES);
    }
  }, []);

  // Canlı Tıklama Takibi (Polling)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('http://191.168.1.228:3001/api/stats');
        const stats = await response.json();
        
        if (stats.clicks > 0) {
          if (stats.users) setHistoryLogs(stats.users); // Logları güncelle
          
          setCampaigns(prev => {
            const hasChange = prev.some(c => c.status === 'Aktif' && c.clicked !== stats.clicks);
            if (!hasChange) return prev;

            const newList = prev.map((c, i) => {
               // En son başlatılan (id bazlı) aktif kampanyaya global tıklamaları ata (Demo/Test kolaylığı için)
               if (c.status === 'Aktif' && i === 0) {
                 return { ...c, clicked: stats.clicks, compromised: stats.clicks }; // Her tıklama bir ihlal sayılıyor (Örn)
               }
               return c;
            });
            localStorage.setItem('phishing_campaigns', JSON.stringify(newList));
            return newList;
          });
        }
      } catch (err) {
        console.warn('Click polling failed, backend might be offline.');
      }
    }, 3000); // 3 saniyede bir kontrol et

    return () => clearInterval(interval);
  }, []);

  const saveCampaigns = (newList) => {
    setCampaigns(newList);
    localStorage.setItem('phishing_campaigns', JSON.stringify(newList));
  };

  const saveGroups = (newList) => {
    setManualGroups(newList);
    localStorage.setItem('phishing_manual_groups', JSON.stringify(newList));
  };

  const saveTemplates = (newList) => {
    setTemplates(newList);
    localStorage.setItem('phishing_custom_templates', JSON.stringify(newList));
    toast.success('Senaryolar kaydedildi.');
  };

  const testSmtpConnection = async () => {
    const loadingToast = toast.loading('Bağlantı test ediliyor...');
    try {
      const response = await fetch('http://191.168.1.228:3001/api/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtp })
      });
      const data = await response.json();
      toast.dismiss(loadingToast);
      if (data.success) {
        toast.success('Bağlantı Başarılı!');
      } else {
        toast.error('Bağlantı Hatası: ' + data.error);
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Sunucuya erişilemiyor.');
    }
  };

  const saveSmtp = (settings) => {
    setSmtp(settings);
    localStorage.setItem('phishing_smtp_settings', JSON.stringify(settings));
    toast.success('Ayarlar kaydedildi.');
  };

  const resetTemplates = () => {
    if (window.confirm('Tüm özelleştirmeleriniz silinecek ve şablonlar varsayılana dönecek. Emin misiniz?')) {
      localStorage.removeItem('phishing_custom_templates');
      setTemplates(DEFAULT_TEMPLATES);
      toast.success('Senaryolar varsayılana sıfırlandı.');
    }
  };

  const handleExportCSV = () => {
    if (historyLogs.length === 0) {
      toast.error('Dışa aktarılacak veri bulunamadı.');
      return;
    }
    
    const headers = ['Kullanıcı', 'Tarih', 'IP Adresi', 'Durum'];
    const rows = historyLogs.map(log => [
      log.userId,
      `"${new Date(log.timestamp).toLocaleString()}"`,
      log.ip,
      'Linke Tıklandı (İhlal)'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `phishing_rapor_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Rapor CSV olarak indirildi.');
  };

  const totals = campaigns.reduce((acc, c) => ({
    sent: acc.sent + (c.sent || 0),
    clicked: acc.clicked + (c.clicked || 0),
    compromised: acc.compromised + (c.compromised || 0)
  }), { sent: 0, clicked: 0, compromised: 0 });

  const stats = [
    { label: 'Aktif Testler', value: campaigns.filter(c => c.status === 'Aktif').length.toString(), icon: Activity, color: 'var(--blue-text)', trend: '0', up: true },
    { label: 'Gönderilen Mail', value: totals.sent.toLocaleString(), icon: Mail, color: 'var(--violet)', trend: '0', up: true },
    { label: 'Tıklama Oranı', value: totals.sent > 0 ? `%${((totals.clicked / totals.sent) * 100).toFixed(1)}` : '%0.0', icon: MousePointer2, color: 'var(--amber)', trend: '0', up: false },
    { label: 'Kritik İhlal', value: totals.compromised.toString(), icon: UserX, color: 'var(--red)', trend: '0', up: true },
  ];

  const handleCreateCampaign = async () => {
    if (!form.name) return toast.error('Lütfen bir kampanya adı giriniz.');
    if (!selectedTemplateId) return toast.error('Lütfen bir senaryo seçiniz.');
    if (!form.senderEmail) return toast.error('Gönderen e-posta adresi zorunludur.');
    if (form.targetType === 'company' && !form.company) return toast.error('Lütfen hedef bir firma seçiniz.');
    if (form.targetType === 'manual' && !form.manualGroupId) return toast.error('Lütfen bir hedef grup seçiniz.');
    
    // SMTP Check
    if (!smtp.user || !smtp.password) {
      return toast.error('SMTP Ayarları eksik! Ayarlar sekmesinden Gmail bilgilerinizi giriniz.');
    }

    setLoading(true);
    const loadingToast = toast.loading('Bağlantı kuruluyor ve mail gönderiliyor...');

    try {
      const template = templates.find(t => t.id === selectedTemplateId);
      const manualGroup = manualGroups.find(g => g.id === form.manualGroupId);
      
      // Determine recipients and names
      let targets = [];
      if (manualGroup) {
        targets = manualGroup.users.map(u => ({ email: u.email, name: u.name }));
      } else {
        // Fallback for direct tests
        targets = [{ email: 'mustafa.gude@hotmail.com', name: 'Mustafa Gude' }];
      }

      // Send to each recipient via backend
      for (const target of targets) {
        // Inject tracking ID into email content
        // Normalize characters: ü -> u, ş -> s, ı -> i etc.
        const normalizedId = target.name
          .toLowerCase()
          .replace(/ğ/g, 'g')
          .replace(/ü/g, 'u')
          .replace(/ş/g, 's')
          .replace(/ı/g, 'i')
          .replace(/ö/g, 'o')
          .replace(/ç/g, 'c')
          .replace(/\s+/g, '_');
          
        const trackingUrlWithId = `${smtp.trackingUrl}/${normalizedId}`;
        const customizedContent = template.content.replace(/href="#"/g, `href="${trackingUrlWithId}"`);

        const response = await fetch('http://localhost:3001/api/send-phishing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            smtp: smtp,
            mailData: {
              senderName: form.senderName || template.senderName,
              senderEmail: form.senderEmail || template.senderEmail,
              recipient: target.email,
              subject: template.subject,
              content: customizedContent
            }
          })
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error);
      }

      const newCampaign = {
        id: Date.now(),
        name: form.name,
        template: template.name,
        sender: `${form.senderName} <${form.senderEmail}>`,
        company: 'Manuel Grup',
        department: manualGroup?.name || 'Özel Liste',
        status: 'Aktif',
        sent: targets.length,
        clicked: 0,
        compromised: 0,
        date: form.date.split('T')[0]
      };
      
      const newList = [newCampaign, ...campaigns];
      saveCampaigns(newList);
      
      toast.dismiss(loadingToast);
      toast.success(`${targets.length} adet phishing maili başarıyla gönderildi.`);
      setShowCreateModal(false);
      setForm({ ...form, name: '' });
      setSelectedTemplateId(null);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Gönderim Hatası: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = (id) => {
    const newList = campaigns.filter(c => c.id !== id);
    saveCampaigns(newList);
    toast.success('Kampanya silindi.');
  };

  // Scenario Handlers
  const openScenarioEditor = (template = null) => {
    if (template) {
       setSelectedTemplateForEdit({...template});
    } else {
       setSelectedTemplateForEdit({
         id: 'custom_' + Date.now(),
         name: 'Yeni Senaryo',
         category: 'Genel',
         risk: 'Yüksek',
         image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=100&h=100&fit=crop',
         subject: 'Test Konusu',
         senderName: 'Sistem Yöneticisi',
         senderEmail: 'admin@repsomtec.local',
         content: '<p>Mail içeriği buraya gelecek...</p>'
       });
    }
    setShowScenarioEditor(true);
  };

  const saveScenario = () => {
    const exists = templates.find(t => t.id === selectedTemplateForEdit.id);
    let newList;
    if (exists) {
      newList = templates.map(t => t.id === selectedTemplateForEdit.id ? selectedTemplateForEdit : t);
    } else {
      newList = [...templates, selectedTemplateForEdit];
    }
    saveTemplates(newList);
    setShowScenarioEditor(false);
    setSelectedTemplateForEdit(null);
  };

  const deleteScenario = (id) => {
    if (templates.length <= 1) {
      toast.error('En az bir senaryo kalmalıdır.');
      return;
    }
    const newList = templates.filter(t => t.id !== id);
    saveTemplates(newList);
  };

  // Group Handlers
  const addGroup = () => {
    if (!newGroupInput.trim()) return;
    const newG = { id: Date.now().toString(), name: newGroupInput, users: [] };
    const newList = [...manualGroups, newG];
    saveGroups(newList);
    setNewGroupInput('');
    toast.success('Grup oluşturuldu.');
  };

  const deleteGroup = (id) => {
    const newList = manualGroups.filter(g => g.id !== id);
    saveGroups(newList);
    if (selectedGroup?.id === id) setSelectedGroup(null);
    toast.success('Grup silindi.');
  };

  const addUserToGroup = () => {
    if (!newUser.name || !newUser.email || !selectedGroup) return;
    const updatedGroups = manualGroups.map(g => {
      if (g.id === selectedGroup.id) {
        return { ...g, users: [...g.users, { ...newUser, id: Date.now().toString() }] };
      }
      return g;
    });
    saveGroups(updatedGroups);
    setSelectedGroup(updatedGroups.find(g => g.id === selectedGroup.id));
    setNewUser({ name: '', email: '' });
    toast.success('Kullanıcı eklendi.');
  };

  const removeUserFromGroup = (userId) => {
    const updatedGroups = manualGroups.map(g => {
      if (g.id === selectedGroup.id) {
        return { ...g, users: g.users.filter(u => u.id !== userId) };
      }
      return g;
    });
    saveGroups(updatedGroups);
    setSelectedGroup(updatedGroups.find(g => g.id === selectedGroup.id));
  };

  return (
    <div className="phishing-page" style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* ─── Premium Header ─── */}
      <div className="glass-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 16px 0', padding: '16px 24px', background: 'var(--bg-surface)', borderRadius: 20, border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
            <div className="icon-box-sm icon-red" style={{ width: 32, height: 32 }}>
                <ShieldAlert size={16} color="var(--red)" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
              Phishing Farkındalık Merkezi
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
             {[
               { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
               { id: 'scenarios', icon: ClipboardList, label: 'Senaryolar' },
               { id: 'reports', icon: ClipboardList, label: 'Raporlar' },
               { id: 'groups', icon: Users, label: 'Hedef Gruplar' },
               { id: 'settings', icon: SettingsIcon, label: 'Ayarlar' }
             ].map(t => (
               <button 
                 key={t.id} 
                 onClick={() => setActiveTab(t.id)}
                 style={{ 
                   display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', border: 'none', background: 'none', cursor: 'pointer',
                   fontSize: 12, fontWeight: activeTab === t.id ? 800 : 600, color: activeTab === t.id ? 'var(--blue-text)' : 'var(--text-3)',
                   borderBottom: `2px solid ${activeTab === t.id ? 'var(--blue-text)' : 'transparent'}`,
                   transition: 'all 0.2s'
                 }}
               >
                 <t.icon size={15} /> {t.label}
               </button>
             ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="icon-btn-glass" onClick={() => toast.success('Veriler güncellendi')} style={{ width: 40, height: 40, borderRadius: 12 }}>
             <RefreshCcw size={16} />
           </button>
           <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} style={{ height: 40, padding: '0 20px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
               <Plus size={18} strokeWidth={3} /> <span style={{ fontWeight: 800 }}>YENİ TEST BAŞLAT</span>
           </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scroll">
        
        {/* ─── Tab Content: Dashboard ─── */}
        {activeTab === 'dashboard' && (
          <div style={{ paddingRight: 4 }}>
            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
              {stats.map((s, i) => (
                <div key={i} className="glass-card" style={{ padding: '16px 20px', background: 'var(--bg-surface)', borderRadius: 20, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                   <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-1)' }}>{s.value}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 11, fontWeight: 700, color: 'var(--text-4)' }}>
                        <Activity size={12} /> Canlı Veri
                      </div>
                   </div>
                   <div className="icon-box-sm" style={{ background: `${s.color}10`, color: s.color }}>
                      <s.icon size={18} />
                   </div>
                </div>
              ))}
            </div>

            {/* Campaigns Table */}
            <div className="glass-card" style={{ background: 'var(--bg-surface)', borderRadius: 24, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Yönetilen Test Kampanyaları</h3>
                 <div style={{ color: 'var(--text-4)', fontSize: 12, fontWeight: 600 }}>{campaigns.length} Kampanya Kayıtlı</div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-inset)', fontSize: 11, color: 'var(--text-3)', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase' }}>
                      <th style={{ padding: '16px 24px' }}>Kampanya / Senaryo</th>
                      <th style={{ padding: '16px' }}>Hedef / Grup</th>
                      <th style={{ padding: '16px' }}>Durum</th>
                      <th style={{ padding: '16px' }}>Alıcı</th>
                      <th style={{ padding: '16px' }}>Tıklama</th>
                      <th style={{ padding: '16px 24px', textAlign: 'right' }}>İşlem</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: 13 }}>
                    {campaigns.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: 60, textAlign: 'center', color: 'var(--text-3)', fontWeight: 700 }}>
                           Gösterilecek kampanya bulunamadı. Lütfen yeni bir test başlatın.
                        </td>
                      </tr>
                    ) : campaigns.map((c) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }} className="table-row-hover">
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ fontWeight: 800, color: 'var(--text-1)' }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{c.template} • {c.date}</div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                            <Globe size={14} color="var(--blue-text)" /> {c.company}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.department || 'Genel'}</div>
                        </td>
                        <td style={{ padding: '16px' }}>
                           <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, background: 'var(--blue-light)', color: 'var(--blue-text)' }}>
                             {c.status}
                           </span>
                        </td>
                        <td style={{ padding: '16px', fontWeight: 800 }}>{c.sent}</td>
                        <td style={{ padding: '16px', fontWeight: 800, color: 'var(--amber)' }}>{c.clicked}</td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                           <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                              <button className="icon-btn-sm" onClick={() => deleteCampaign(c.id)} style={{ color: 'var(--red)' }}><Trash2 size={14} /></button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── Tab Content: Scenarios ─── */}
        {activeTab === 'scenarios' && (
          <div style={{ paddingRight: 4 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                   <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>Phishing Senaryo Yönetimi</h3>
                   <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>Hazır şablonları düzenleyin veya yenilerini ekleyin.</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-secondary" onClick={resetTemplates} style={{ borderRadius: 12, fontWeight: 700, padding: '0 16px', height: 36, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <RefreshCcw size={16} /> SIFIRLA
                  </button>
                  <button className="btn btn-secondary" onClick={() => openScenarioEditor()} style={{ borderRadius: 12, background: 'var(--blue-light)', color: 'var(--blue-text)', fontWeight: 800, padding: '0 16px', height: 36, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Plus size={18} /> YENİ SENARYO EKLE
                  </button>
                </div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {templates.map(t => (
                  <div key={t.id} className="glass-card" style={{ background: 'var(--bg-surface)', borderRadius: 24, border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                     <div style={{ position: 'relative', height: 140, background: 'linear-gradient(135deg, var(--bg-inset), var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <img src={t.image} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, zIndex: 1 }} onError={(e) => { e.target.style.opacity = '0'; }} /><Binary size={40} color="var(--blue-text)" style={{ opacity: 0.1 }} />
                        <div style={{ position: 'absolute', top: 12, right: 12, px: 8, py: 4, borderRadius: 6, background: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: 900, color: t.risk === 'Kritik' ? 'var(--red)' : 'var(--amber)' }}>
                           {t.risk} RİSK
                        </div>
                     </div>
                     <div style={{ padding: 20, flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--blue-text)', textTransform: 'uppercase', marginBottom: 4 }}>{t.category}</div>
                        <h4 style={{ fontSize: 16, fontWeight: 900, margin: '0 0 8px 0', color: 'var(--text-1)' }}>{t.name}</h4>
                        <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 16px 0', lineHeight: 1.4, height: 34, overflow: 'hidden' }}>{t.subject}</p>
                        
                        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                           <button className="btn btn-secondary" style={{ flex: 1, borderRadius: 10, fontSize: 11, height: 32 }} onClick={() => { setSelectedTemplateId(t.id); setShowPreviewModal(true); }}>
                              <Eye size={14} /> ÖNİZLE
                           </button>
                           <button className="btn btn-secondary" style={{ flex: 1, borderRadius: 10, fontSize: 11, height: 32 }} onClick={() => openScenarioEditor(t)}>
                              <Edit3 size={14} /> DÜZENLE
                           </button>
                           <button className="icon-btn-glass" style={{ width: 32, height: 32, borderRadius: 10, color: 'var(--red)' }} onClick={() => deleteScenario(t.id)}>
                              <Trash2 size={14} />
                           </button>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* ─── Tab Content: Reports ─── */}
        {activeTab === 'reports' && (
          <div style={{ paddingRight: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>Canlı İhlal Günlükleri</h3>
                <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>Simülasyonda linke tıklayan kullanıcıların gerçek zamanlı listesi.</p>
              </div>
              <button className="btn btn-secondary" onClick={handleExportCSV} style={{ borderRadius: 12, background: 'var(--blue-light)', color: 'var(--blue-text)', fontWeight: 800, padding: '0 16px', height: 36 }}>
                <ExternalLink size={16} /> CSV OLARAK DIŞA AKTAR
              </button>
            </div>

            <div className="glass-card" style={{ background: 'var(--bg-surface)', borderRadius: 24, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-inset)', fontSize: 11, color: 'var(--text-3)', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase' }}>
                    <th style={{ padding: '16px 24px' }}>Kullanıcı ID / İsim</th>
                    <th style={{ padding: '16px' }}>Tıklama Zamanı</th>
                    <th style={{ padding: '16px' }}>IP Adresi</th>
                    <th style={{ padding: '16px 24px' }}>Durum</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: 13 }}>
                  {historyLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: 60, textAlign: 'center', color: 'var(--text-3)', fontWeight: 700 }}>
                         <Activity size={48} style={{ margin: '0 auto', opacity: 0.2, marginBottom: 16 }} />
                         Henüz bir tıklama kaydı bulunamadı.
                      </td>
                    </tr>
                  ) : historyLogs.map((log, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }} className="table-row-hover">
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--blue-light)', color: 'var(--blue-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>
                            {log.userId.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ fontWeight: 800, color: 'var(--text-1)' }}>{log.userId}</div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-2)' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <code style={{ background: 'var(--bg-inset)', padding: '4px 8px', borderRadius: 6, fontSize: 11, color: 'var(--text-3)' }}>{log.ip}</code>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 900, background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
                          <ShieldAlert size={12} /> LİNKE TIKLANDI (İHLAL)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Tab Content: Groups ─── */}
        {activeTab === 'groups' && (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, height: 'calc(100% - 20px)' }}>
             {/* Group List */}
             <div className="glass-card" style={{ background: 'var(--bg-surface)', borderRadius: 24, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
                   <h3 style={{ fontSize: 15, fontWeight: 900, marginBottom: 12 }}>Manuel Hedef Grupları</h3>
                   <div style={{ display: 'flex', gap: 8 }}>
                      <input 
                        className="glass-input" placeholder="Grup adı..." 
                        value={newGroupInput} onChange={e => setNewGroupInput(e.target.value)}
                        style={{ flex: 1, height: 36, borderRadius: 10, padding: '0 12px', fontSize: 12 }}
                      />
                      <button className="icon-btn-glass icon-blue" onClick={addGroup} style={{ height: 36, width: 36 }}><Plus size={18} /></button>
                   </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: 12 }} className="custom-scroll">
                   {manualGroups.map(g => (
                     <div 
                       key={g.id} 
                       onClick={() => setSelectedGroup(g)}
                       style={{ 
                         padding: '12px 16px', borderRadius: 14, cursor: 'pointer', marginBottom: 4, transition: 'all 0.2s',
                         background: selectedGroup?.id === g.id ? 'var(--blue-light)' : 'transparent',
                         border: `1px solid ${selectedGroup?.id === g.id ? 'var(--blue-text)' : 'transparent'}`,
                         display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                       }}
                     >
                        <div>
                           <div style={{ fontSize: 13, fontWeight: 800, color: selectedGroup?.id === g.id ? 'var(--blue-text)' : 'var(--text-1)' }}>{g.name}</div>
                           <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{g.users.length} Kayıtlı Kişi</div>
                        </div>
                        <button 
                          className="icon-btn-plain" 
                          onClick={(e) => { e.stopPropagation(); deleteGroup(g.id); }}
                          style={{ color: 'var(--text-4)' }}
                        ><Trash2 size={14} /></button>
                     </div>
                   ))}
                </div>
             </div>

             {/* User List in Selected Group */}
             <div className="glass-card" style={{ background: 'var(--bg-surface)', borderRadius: 24, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {selectedGroup ? (
                  <>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div>
                          <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>{selectedGroup.name} - Kullanıcı Tanımlama</h3>
                          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>Bu gruptaki kişilere özel phishing mailleri gönderilecektir.</p>
                       </div>
                    </div>
                    
                    <div style={{ padding: '16px 24px', background: 'var(--bg-inset)', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                           <input 
                             className="glass-input" placeholder="Ad Soyad" 
                             value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})}
                             style={{ width: '100%', height: 40, borderRadius: 10, padding: '0 12px', fontSize: 12, fontWeight: 700 }}
                           />
                        </div>
                        <div style={{ flex: 1 }}>
                           <input 
                             className="glass-input" placeholder="E-posta adresi" 
                             value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
                             style={{ width: '100%', height: 40, borderRadius: 10, padding: '0 12px', fontSize: 12, fontWeight: 700 }}
                           />
                        </div>
                        <button className="btn btn-primary" onClick={addUserToGroup} style={{ padding: '0 20px', borderRadius: 10, height: 40, fontSize: 12 }}>
                           <UserPlus size={16} /> EKLE
                        </button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scroll">
                       <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead style={{ background: 'var(--bg-inset)', fontSize: 11, color: 'var(--text-3)', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase' }}>
                             <tr>
                                <th style={{ padding: '12px 24px' }}>Ad Soyad</th>
                                <th style={{ padding: '12px 24px' }}>E-Posta</th>
                                <th style={{ padding: '12px 24px', textAlign: 'right' }}>İşlem</th>
                             </tr>
                          </thead>
                          <tbody>
                             {selectedGroup.users.length === 0 ? (
                               <tr><td colSpan="3" style={{ padding: 40, textAlign: 'center', color: 'var(--text-4)', fontWeight: 700 }}>Bu grupta henüz kimse tanımlanmamış.</td></tr>
                             ) : selectedGroup.users.map(u => (
                               <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                  <td style={{ padding: '12px 24px', fontSize: 13, fontWeight: 800 }}>{u.name}</td>
                                  <td style={{ padding: '12px 24px', fontSize: 13, color: 'var(--text-2)' }}>{u.email}</td>
                                  <td style={{ padding: '12px 24px', textAlign: 'right' }}>
                                     <button className="icon-btn-plain" onClick={() => removeUserFromGroup(u.id)} style={{ color: 'var(--red)' }}><Trash2 size={14} /></button>
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                  </>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-4)' }}>
                     <Users size={64} style={{ opacity: 0.1, marginBottom: 16 }} />
                     <div style={{ fontWeight: 800 }}>Kullanıcıları görmek için soldan bir grup seçin</div>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* ─── Tab Content: Settings ─── */}
        {activeTab === 'settings' && (
          <div style={{ paddingRight: 4, maxWidth: 800 }}>
             <div className="glass-card" style={{ background: 'var(--bg-surface)', borderRadius: 24, border: '1px solid var(--border)', padding: 32, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                   <div className="icon-box-lg icon-blue"><Server size={28} color="var(--blue-text)" /></div>
                   <div>
                      <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Mail Sunucu (SMTP) Ayarları</h3>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)', fontWeight: 600 }}>Phishing maillerinin gönderileceği sunucu bilgilerini tanımlayın.</p>
                   </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                   <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>Sunucu Adresi (SMTP Host)</label>
                      <input 
                        className="glass-input" value={smtp.host} onChange={e => setSmtp({...smtp, host: e.target.value})}
                        placeholder="smtp.gmail.com" style={{ width: '100%', height: 48, borderRadius: 14, padding: '0 16px', fontWeight: 700 }}
                      />
                   </div>
                   <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>Port</label>
                      <input 
                        className="glass-input" value={smtp.port} onChange={e => { const p = e.target.value; setSmtp({...smtp, port: p, secure: p === '465' }); }}
                        placeholder="587" style={{ width: '100%', height: 48, borderRadius: 14, padding: '0 16px', fontWeight: 700 }}
                      />
                   </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                   <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>Kullanıcı (Gmail Adresi)</label>
                      <input 
                        className="glass-input" value={smtp.user} onChange={e => setSmtp({...smtp, user: e.target.value})}
                        placeholder="ornek@gmail.com" style={{ width: '100%', height: 48, borderRadius: 14, padding: '0 16px', fontWeight: 700 }}
                      />
                   </div>
                   <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>Åifre / Uygulama Åifresi</label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type="password" className="glass-input" value={smtp.password} onChange={e => setSmtp({...smtp, password: e.target.value})}
                          placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" style={{ width: '100%', height: 48, borderRadius: 14, padding: '0 40px 0 16px', fontWeight: 700 }}
                        />
                        <Key size={18} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
                      </div>
                   </div>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                   <button className="btn btn-secondary" onClick={testSmtpConnection} style={{ height: 44, padding: "0 20px", borderRadius: 12, fontWeight: 800 }}>BAĞLANTI TESTİ</button>
                   <button className="btn btn-primary" onClick={() => saveSmtp(smtp)} style={{ height: 44, padding: '0 24px', borderRadius: 12, background: 'var(--green)', color: '#fff', fontWeight: 800, display: 'flex', gap: 8 }}>
                      <Save size={18} /> KAYDET
                   </button>
                </div>
             </div>

             <div className="glass-card" style={{ background: 'var(--bg-surface)', borderRadius: 24, border: '1px solid var(--border)', padding: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                   <div className="icon-box-lg icon-blue"><Link2 size={28} color="var(--blue-text)" /></div>
                   <div>
                      <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Tıklama Takibi (Tracking) Ayarları</h3>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)', fontWeight: 600 }}>Kimlerin linke tıkladığını tespit etmek için takip URL'sini yapılandırın.</p>
                   </div>
                </div>

                <div>
                   <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>Takip Sunucusu URL</label>
                   <input 
                     className="glass-input" value={smtp.trackingUrl} onChange={e => setSmtp({...smtp, trackingUrl: e.target.value})}
                     placeholder="http://191.168.1.228:3001/track" style={{ width: '100%', height: 48, borderRadius: 14, padding: '0 16px', fontWeight: 700 }}
                   />
                   <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-4)', lineHeight: 1.5 }}>
                      <b>Nasıl çalışır?</b> E-posta içindeki linklere tıklandığında, sunucumuz (IP: 191.168.1.228) bu isteği yakalar ve ihlal olarak kaydeder. 
                   </p>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* ─── Scenario Editor Modal ─── */}
      {showScenarioEditor && selectedTemplateForEdit && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: 20 }}>
           <div className="modal-content fade-in" style={{ background: 'var(--bg-surface)', width: '100%', maxWidth: 1000, borderRadius: 28, border: '1px solid var(--border)', boxShadow: 'var(--shadow-2xl)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '90vh' }}>
              <div style={{ padding: '20px 32px', background: 'var(--bg-inset)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div>
                    <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Senaryo Düzenleyici</h2>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>{selectedTemplateForEdit.name}</p>
                 </div>
                 <button className="icon-btn-glass" onClick={() => setShowScenarioEditor(false)}><X size={18} /></button>
              </div>

              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>
                 {/* Fields Column */}
                 <div style={{ padding: 32, overflowY: 'auto', borderRight: '1px solid var(--border)' }} className="custom-scroll">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                       <div>
                          <label className="input-label">Senaryo Adı</label>
                          <input className="glass-input-sm" value={selectedTemplateForEdit.name} onChange={e => setSelectedTemplateForEdit({...selectedTemplateForEdit, name: e.target.value})} />
                       </div>
                       <div>
                          <label className="input-label">Kategori</label>
                          <select className="glass-select-sm" value={selectedTemplateForEdit.category} onChange={e => setSelectedTemplateForEdit({...selectedTemplateForEdit, category: e.target.value})}>
                             <option>Eğlence</option><option>Sistem</option><option>Kurumsal</option><option>Güvenlik</option><option>Banka</option>
                          </select>
                       </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                       <div>
                          <label className="input-label">Gönderen Adı</label>
                          <input className="glass-input-sm" value={selectedTemplateForEdit.senderName} onChange={e => setSelectedTemplateForEdit({...selectedTemplateForEdit, senderName: e.target.value})} />
                       </div>
                       <div>
                          <label className="input-label">Gönderen E-Posta</label>
                          <input className="glass-input-sm" value={selectedTemplateForEdit.senderEmail} onChange={e => setSelectedTemplateForEdit({...selectedTemplateForEdit, senderEmail: e.target.value})} />
                       </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                       <label className="input-label">E-Posta Konusu</label>
                       <input className="glass-input-sm" value={selectedTemplateForEdit.subject} onChange={e => setSelectedTemplateForEdit({...selectedTemplateForEdit, subject: e.target.value})} />
                    </div>

                    <div style={{ flex: 1 }}>
                       <label className="input-label">HTML İçerik <Code size={14} style={{ marginLeft: 6 }} /></label>
                       <textarea 
                         className="glass-textarea" 
                         value={selectedTemplateForEdit.content} 
                         onChange={e => setSelectedTemplateForEdit({...selectedTemplateForEdit, content: e.target.value})}
                         style={{ width: '100%', height: 350, fontFamily: 'monospace', fontSize: 12, padding: 16, borderRadius: 14, border: '1px solid var(--border)', background: '#0f172a', color: '#94a3b8' }}
                       />
                    </div>
                 </div>

                 {/* Preview Column */}
                 <div style={{ padding: 32, background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, color: 'var(--text-3)' }}>
                       <Eye size={18} /> <span style={{ fontWeight: 800, fontSize: 14 }}>Canlı Önizleme</span>
                    </div>
                    <div 
                      style={{ flex: 1, background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-lg)', padding: 0, overflow: 'auto' }}
                      dangerouslySetInnerHTML={{ __html: selectedTemplateForEdit.content }}
                    />
                 </div>
              </div>

              <div style={{ padding: '20px 32px', borderTop: '1px solid var(--border)', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 12, background: 'var(--bg-inset)' }}>
                 <button className="btn btn-secondary" onClick={() => setShowScenarioEditor(false)} style={{ borderRadius: 12, fontWeight: 800 }}>Vazgeç</button>
                 <button className="btn btn-primary" onClick={saveScenario} style={{ borderRadius: 12, background: 'var(--blue-text)', color: '#fff', fontWeight: 800, display: 'flex', gap: 8 }}>
                    <Save size={18} /> SENARYOYU KAYDET
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* ─── Create Campaign Modal (Wizard) ─── */}
      {showCreateModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div className="modal-content fade-in" style={{ background: 'var(--bg-surface)', width: '100%', maxWidth: 850, borderRadius: 28, border: '1px solid var(--border)', boxShadow: 'var(--shadow-2xl)', overflow: 'hidden', display: 'flex', maxHeight: '90vh' }}>
             
             {/* Left Column: Template Selection */}
             <div style={{ width: 320, background: 'var(--bg-inset)', borderRight: '1px solid var(--border)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 16 }}>1. Senaryo Seçimi</h3>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }} className="custom-scroll">
                   {templates.map(t => (
                     <div 
                       key={t.id} 
                       onClick={() => setSelectedTemplateId(t.id)}
                       style={{ 
                         padding: 12, borderRadius: 16, border: `2px solid ${selectedTemplateId === t.id ? 'var(--blue-text)' : 'transparent'}`,
                         background: selectedTemplateId === t.id ? '#fff' : 'transparent',
                         cursor: 'pointer', transition: 'all 0.2s', display: 'flex', gap: 12, alignItems: 'center', boxShadow: selectedTemplateId === t.id ? 'var(--shadow-md)' : 'none'
                       }}
                     >
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}><img src={t.image} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', zIndex: 1 }} onError={(e) => { e.target.style.opacity = '0'; }} /><Binary size={20} color="var(--blue-text)" style={{ opacity: 0.2 }} /></div>
                        <div style={{ flex: 1 }}>
                           <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-1)' }}>{t.name}</div>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, px: 6, py: 2, borderRadius: 4, background: t.risk === 'Kritik' ? '#fee2e2' : '#fef3c7', color: t.risk === 'Kritik' ? '#b91c1c' : '#b45309' }}>{t.risk}</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedTemplateId(t.id); setShowPreviewModal(true); }}
                                style={{ border: 'none', background: 'none', color: 'var(--blue-text)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                              >İncele</button>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             {/* Right Column: Config */}
             <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                   <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Kampanya Detayları</h2>
                   <button className="icon-btn-glass" onClick={() => setShowCreateModal(false)}><X size={18} /></button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scroll">
                   <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 6 }}>Kampanya Adı</label>
                      <input 
                        type="text" className="glass-input" placeholder="Örn: 2024 Nisan Güvenlik Denetimi"
                        value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                        style={{ width: '100%', height: 44, borderRadius: 12, padding: '0 16px', fontWeight: 700 }}
                      />
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 6 }}>Gönderen Adı</label>
                        <input 
                          type="text" className="glass-input" placeholder="Örn: Netflix Destek"
                          value={form.senderName} onChange={e => setForm({...form, senderName: e.target.value})}
                          style={{ width: '100%', height: 44, borderRadius: 12, padding: '0 16px', fontWeight: 700 }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 6 }}>Gönderen E-Posta</label>
                        <input 
                          type="email" className="glass-input" placeholder="destek@netflix-hizmet.com"
                          value={form.senderEmail} onChange={e => setForm({...form, senderEmail: e.target.value})}
                          style={{ width: '100%', height: 44, borderRadius: 12, padding: '0 16px', fontWeight: 700 }}
                        />
                      </div>
                   </div>

                   <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 6 }}>Hedef Grup Seçiniz</label>
                      <select className="glass-select" value={form.manualGroupId} onChange={e => setForm({...form, manualGroupId: e.target.value})} style={{ width: '100%', height: 44, borderRadius: 12, padding: '0 12px', fontWeight: 700 }}>
                         <option value="">Seçiniz...</option>
                         {manualGroups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.users.length} Kişi)</option>)}
                      </select>
                   </div>

                   <div style={{ background: 'var(--blue-light)', padding: 16, borderRadius: 16, border: '1px solid var(--blue-text)', display: 'flex', gap: 12 }}>
                      <Users size={20} color="var(--blue-text)" />
                      <div>
                         <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--blue-text)' }}>Tahmini Alıcı Sayısı</div>
                         <div style={{ fontSize: 12, color: 'var(--blue-text)', opacity: 0.8 }}>
                            Seçilen manuel gruba dahil toplam <b>{manualGroups.find(g => g.id === form.manualGroupId)?.users?.length || '0'}</b> çalışana test maili gönderilecektir.
                         </div>
                      </div>
                   </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
                   <button className="btn btn-secondary" style={{ flex: 1, height: 48, borderRadius: 14 }} onClick={() => setShowCreateModal(false)}>İptal</button>
                   <button className="btn btn-primary" style={{ flex: 1, height: 48, borderRadius: 14, background: 'var(--blue-text)', color: '#fff', fontWeight: 800 }} onClick={handleCreateCampaign} disabled={loading}>
                     {loading ? "HAZIRLANIYOR..." : "TESTİ ŞİMDİ BAŞLAT"}
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* ─── Scenario Preview Modal ─── */}
      {showPreviewModal && selectedTemplateId && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20 }}>
           <div className="modal-content fade-in" style={{ background: '#fff', width: '100%', maxWidth: 650, borderRadius: 24, boxShadow: 'var(--shadow-2xl)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <HelpCircle size={18} color="var(--blue-text)" />
                    <span style={{ fontWeight: 800 }}>Senaryo Önizleme</span>
                 </div>
                 <button className="icon-btn-glass" onClick={() => setShowPreviewModal(false)}><X size={18} /></button>
              </div>
              <div style={{ padding: 24 }}>
                 <div style={{ background: '#f1f5f9', padding: 12, borderRadius: 12, marginBottom: 20, fontSize: 13 }}>
                    <div><b>Kimden:</b> {templates.find(t => t.id === selectedTemplateId)?.senderName} &lt;{templates.find(t => t.id === selectedTemplateId)?.senderEmail}&gt;</div>
                    <div style={{ marginTop: 4 }}><b>Konu:</b> {templates.find(t => t.id === selectedTemplateId)?.subject}</div>
                 </div>
                 <div 
                   style={{ border: '2px dashed #e2e8f0', borderRadius: 12, minHeight: 300, padding: 20 }}
                   dangerouslySetInnerHTML={{ __html: templates.find(t => t.id === selectedTemplateId)?.content }}
                 />
              </div>
              <div style={{ padding: '16px 24px', textAlign: 'right', borderTop: '1px solid #e2e8f0' }}>
                 <button className="btn btn-primary" onClick={() => setShowPreviewModal(false)} style={{ borderRadius: 10 }}>Anladım</button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        .table-row-hover:hover { background: var(--bg-inset); }
        .icon-btn-sm { width: 32px; height: 32px; borderRadius: 8px; border: 1px solid var(--border); background: var(--bg-surface); display: flex; alignItems: center; justifyContent: center; color: var(--text-3); cursor: pointer; transition: all 0.2s; }
        .icon-btn-sm:hover { color: var(--blue-text); border-color: var(--blue-text); background: var(--blue-light); }
        .icon-btn-plain { background: none; border: none; cursor: pointer; display: flex; alignItems: center; justify-content: center; padding: 4px; border-radius: 6px; }
        .icon-btn-plain:hover { background: rgba(0,0,0,0.05); }
        
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
        
        .icon-red { background: #fef2f2; }
        .icon-box-sm { borderRadius: 10px; display: flex; alignItems: center; justifyContent: center; }
        .icon-box-lg { width: 56px; height: 56px; border-radius: 18px; display: flex; alignItems: center; justify-content: center; }
        .icon-blue { background: var(--blue-light); }

        .input-label { display: block; fontSize: 11px; fontWeight: 900; color: 'var(--text-3)'; textTransform: 'uppercase'; marginBottom: 6px; }
        .glass-input-sm { width: 100%; height: 36px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-surface); padding: 0 12px; font-weight: 700; font-size: 13px; }
        .glass-select-sm { width: 100%; height: 36px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-surface); padding: 0 8px; font-weight: 700; font-size: 13px; }
      `}</style>
    </div>
  );
}

