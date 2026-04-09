import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Monitor, Users, Package, Shield,
  Activity, Settings, Network, FileText, LifeBuoy, History,
  DollarSign, LogOut, ClipboardList, UserPlus, Database,
  Lock, Key, Globe, TriangleAlert, BookOpen, Layers,
  MessageSquare, FilePenLine, RefreshCw, ShieldAlert,
  MessageCircle, CircleHelp, Radio, ChevronDown, ChevronRight,
  Server, Wifi
} from 'lucide-react';
import { getSettings } from '../api';
import ChatWidget from './ChatWidget';

const SafeIcon = ({ icon: Icon, size = 15, color }) => {
  try { return <Icon size={size} color={color} />; }
  catch { return <CircleHelp size={size} />; }
};

const NAV = [
  {
    label: 'Monitör',
    items: [
      { to: '/',               icon: LayoutDashboard, text: 'Dashboard',        color: '#b45309', bg: 'icon-amber', module: '' },
      { to: '/global-monitoring', icon: Radio,        text: 'Global İzleme',   color: '#1e40af', bg: 'icon-blue', module: '' },
      { to: '/user-monitoring', icon: Monitor,        text: 'İzleme Merkezi',  color: '#134e4a', bg: 'icon-teal', module: 'UserMonitoring' },
      { to: '/terminals',       icon: Network,         text: 'Ağ Aygıtları',   color: '#065f46', bg: 'icon-green', module: 'Terminals' },
      { to: '/ssl',             icon: Shield,          text: 'SSL Takibi',     color: '#5b21b6', bg: 'icon-violet', module: 'Ssl' },
    ],
  },
  {
    label: 'İnsan Kaynakları',
    items: [
      { to: '/personnel',       icon: Users,           text: 'Personel',       color: '#1e40af', bg: 'icon-blue', module: 'Personnel' },
      { to: '/onboarding',      icon: UserPlus,        text: 'Onboarding',     color: '#065f46', bg: 'icon-green', module: 'Onboarding' },
      { to: '/personnel-feedbacks', icon: MessageCircle, text: 'Geri Bildirim', color: '#5b21b6', bg: 'icon-violet', module: 'Personnel' },
      { to: '/surveys',         icon: ClipboardList,   text: 'Anket Yönetimi', color: '#b45309', bg: 'icon-amber', module: 'Directory' },
      { to: '/directory-admin', icon: Globe,            text: 'Rehber',         color: '#134e4a', bg: 'icon-teal', module: 'Directory' },
    ],
  },
  {
    label: 'Operasyon',
    items: [
      { to: '/stock',           icon: Package,         text: 'Stok & Envanter', color: '#065f46', bg: 'icon-green', module: 'Stock' },
      { to: '/signature',       icon: FilePenLine,     text: 'İmza Oluşturucu', color: '#334155', bg: 'icon-slate', module: 'Stock' },
      { to: '/budget',          icon: DollarSign,      text: 'Bütçe Takibi',    color: '#b45309', bg: 'icon-amber', module: 'Reports' },
      { to: '/reports',         icon: FileText,        text: 'Raporlar',        color: '#1e40af', bg: 'icon-blue', module: 'Reports' },
      { to: '/cards',           icon: Layers,          text: 'Kart Dönüştürücü',color: '#5b21b6', bg: 'icon-violet', module: 'Cards' },
    ],
  },
  {
    label: 'Uyumluluk',
    items: [
      { to: '/iso',             icon: Shield,          text: 'ISO 27001',       color: '#065f46', bg: 'icon-green', module: 'Compliance' },
      { to: '/iso9001',         icon: BookOpen,        text: 'ISO 9001',        color: '#1e40af', bg: 'icon-blue', module: 'Compliance' },
      { to: '/nist',            icon: Lock,            text: 'NIST 800-171',    color: '#5b21b6', bg: 'icon-violet', module: 'Compliance' },
      { to: '/facility',        icon: Shield,          text: 'Tesis Güvenliği', color: '#b45309', bg: 'icon-amber', module: 'Compliance' },
      { to: '/file-alerts',     icon: TriangleAlert,   text: 'Dosya İzleme',    color: '#991b1b', bg: 'icon-red', module: 'Terminals' },
      { to: '/access-logs',     icon: Key,             text: 'Erişim Kayıtları',color: '#334155', bg: 'icon-slate', module: 'Logs' },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { to: '/help-admin',      icon: LifeBuoy,        text: 'Yardım Masası',   color: '#065f46', bg: 'icon-green', module: 'Settings' },
      { to: '/users',           icon: Users,           text: 'Kullanıcılar',    color: '#1e40af', bg: 'icon-blue', module: 'Users' },
      { to: '/matrix',          icon: Key,             text: 'Erişim Yetkisi',  color: '#5b21b6', bg: 'icon-violet', module: 'Matrix' },
      { to: '/chat-admin',      icon: ShieldAlert,     text: 'Chat Yönetimi',   color: '#991b1b', bg: 'icon-red', module: 'Users' },
      { to: '/logs',            icon: History,         text: 'Sistem Logları',  color: '#334155', bg: 'icon-slate', module: 'Logs' },
      { to: '/backups',         icon: Database,        text: 'Yedekleme',       color: '#b45309', bg: 'icon-amber', module: 'Settings' },
      { to: '/updates',         icon: RefreshCw,       text: 'Güncellemeler',   color: '#134e4a', bg: 'icon-teal', module: 'Updates' },
      { to: '/settings',        icon: Settings,        text: 'Ayarlar',         color: '#334155', bg: 'icon-slate', module: 'Settings' },
    ],
  },
];

export default function Layout({ auth, setAuth }) {
  const [settings, setSettings] = useState(null);
  const [openSections, setOpenSections] = useState({
    'Monitör': true, 'İnsan Kaynakları': true, 'Operasyon': true, 'Sistem': true
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    getSettings().then(setSettings).catch(() => {});
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth');
    setAuth(null);
    navigate('/login');
  };

  const toggle = (label) =>
    setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));

  const isAdmin = auth?.user?.isAdmin;
  const perms   = auth?.user?.permissions || '';
  const canSee  = (mod) => isAdmin || !mod || perms.includes(mod);
  const appName = settings?.appTitle || 'NetLiveness';

  const currentItem = NAV.flatMap(s => s.items).find(i =>
    i.to === '/' ? location.pathname === '/' : location.pathname.startsWith(i.to)
  );

  const initials = auth?.user?.fullName
    ? auth.user.fullName.split(' ').map(w => w[0]).slice(0, 2).join('')
    : 'U';

  return (
    <div className="app-layout">

      {/* ─── Sidebar ─── */}
      <aside className="sidebar">

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Activity size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="sidebar-logo-name">{appName}</span>
            <span className="sidebar-logo-sub">Operasyon Merkezi</span>
          </div>
        </div>

        {/* User card */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-user-name">{auth?.user?.fullName ?? 'Kullanıcı'}</div>
            <div className="sidebar-status">
              <span className="status-dot success pulse" style={{ width: 6, height: 6 }} />
              {isAdmin ? 'Yönetici' : 'Üye'}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV.map(section => {
            const visible = section.items.filter(i => canSee(i.module));
            if (!visible.length) return null;
            const isOpen = openSections[section.label] !== false;

            return (
              <div key={section.label}>
                <div className="nav-section-label" onClick={() => toggle(section.label)}>
                  <span>{section.label}</span>
                  {isOpen
                    ? <ChevronDown size={11} />
                    : <ChevronRight size={11} />}
                </div>

                {isOpen && visible.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  >
                    <div className={`nav-icon-wrap ${item.bg}`} style={{ width: 28, height: 28, borderRadius: 6 }}>
                      <SafeIcon icon={item.icon} size={14} color={item.color} />
                    </div>
                    {item.text}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={14} /> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <div className="main-content">

        {/* Topbar */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {currentItem && (
              <div className={`icon-box-sm ${currentItem.bg || 'icon-amber'}`}>
                <SafeIcon icon={currentItem.icon} size={15} color={currentItem.color} />
              </div>
            )}
            <span className="topbar-title">{currentItem?.text ?? 'Dashboard'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#f0fdf4', border: '1px solid #a7f3d0',
              borderRadius: 'var(--r-full)', padding: '5px 12px',
              fontSize: 12, fontWeight: 700, color: '#065f46',
            }}>
              <Wifi size={13} color="#10b981" />
              Sistem Aktif
            </div>

            <NavLink
              to="/chat"
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '7px 14px', background: 'var(--bg-surface)',
                border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)',
                color: 'var(--text-2)', fontSize: 13, fontWeight: 600,
                textDecoration: 'none', boxShadow: 'var(--shadow-xs)',
                transition: 'all 0.15s',
              }}
            >
              <MessageSquare size={14} color="#3b82f6" />
              Chat
            </NavLink>
          </div>
        </header>

        {/* Page */}
        <div className="page-body fade-in">
          <Outlet />
        </div>
      </div>

      {auth?.user && <ChatWidget user={auth.user} />}
    </div>
  );
}
