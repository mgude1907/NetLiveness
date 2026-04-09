import { useState, useEffect, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { TriangleAlert } from 'lucide-react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Terminals from './pages/Terminals';
// Computers import removed
import Personnel from './pages/Personnel';
import StockInventory from './pages/StockInventory';
import SslTracking from './pages/SslTracking';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import CardConverter from './pages/CardConverter';
import AccessMatrix from './pages/AccessMatrix';
import NistCompliance from './pages/NistCompliance';
import IsoCompliance from './pages/IsoCompliance';
import FacilityCompliance from './pages/FacilityCompliance';
import Iso9001Compliance from './pages/Iso9001Compliance';
import UserMonitoring from './pages/UserMonitoring';
import Reports from './pages/Reports';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Users from './pages/Users';
import ChatAdmin from './pages/ChatAdmin';
import ChatApp from './pages/ChatApp';
import DirectoryPublic from './pages/DirectoryPublic';
import DirectoryAdmin from './pages/DirectoryAdmin';
import Updates from './pages/Updates';
import Feedbacks from './pages/Feedbacks';
import GlobalMonitoringDashboard from './pages/GlobalMonitoringDashboard';
import ItBudgetDashboard from './pages/ItBudgetDashboard';
import SurveyAdmin from './pages/SurveyAdmin';
import BackupManagement from './pages/BackupManagement';
import SurveyParticipant from './pages/SurveyParticipant';
import SurveysPublic from './pages/SurveysPublic';
import HelpRequestPublic from './pages/HelpRequestPublic';
import HelpRequestAdmin from './pages/HelpRequestAdmin';
import FileAlerts from './pages/FileAlerts';
import SignatureGenerator from './pages/SignatureGenerator';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("Boundary Catch:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '60px', textAlign: 'center', background: '#f8fafc', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <TriangleAlert size={48} color="#ef4444" style={{ marginBottom: '20px' }} />
          <h2 style={{ color: '#0f172a', fontWeight: 800 }}>Bir şeyler ters gitti</h2>
          <p style={{ color: '#64748b', marginTop: '12px', maxWidth: '500px' }}>
            Uygulama yüklenirken bir çalışma zamanı hatası oluştu. Lütfen sayfayı yenilemeyi deneyin.
          </p>
          <div style={{ marginTop: '24px', padding: '16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '12px', fontSize: '13px', textAlign: 'left', maxWidth: '600px', overflowX: 'auto', fontBox: 'border-box' }}>
            <code style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</code>
          </div>
          <button className="btn btn-primary" style={{ marginTop: '32px' }} onClick={() => window.location.reload()}>Sayfayı Yenile</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProtectedRoute = ({ auth, requiredModule, children }) => {
  if (!auth) return <Navigate to="/login" replace />;
  if (auth.user?.isAdmin) return children;
  
  if (requiredModule) {
    const perms = auth.user?.permissions || "";
    if (!perms.includes(requiredModule)) {
      return (
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--accent-red)' }}>Yetkisiz Erişim</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', marginBottom: '16px' }}>Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.</p>
          <button className="btn btn-primary" onClick={() => window.location.href='/'}>Ana Sayfaya Dön</button>
        </div>
      );
    }
  }
  return children;
};

export default function App() {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth');
      if (stored) setAuth(JSON.parse(stored));
    } catch (e) { console.error('Token pass failed', e); }
    finally { setLoading(false); }
  }, []);

  if (loading) return null;

  return (
    <BrowserRouter>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#ffffff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } }
        }} 
      />
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<Login setAuth={setAuth} />} />
          
          {/* PUBLIC ROUTES (Can also be accessed via Sidebar) */}
          <Route path="/rehber" element={<DirectoryPublic />} />
          <Route path="/anketler" element={<SurveysPublic />} />
          <Route path="/anket/:id" element={<SurveyParticipant />} />
          <Route path="/yardim" element={<HelpRequestPublic />} />
          
          {/* FULL SCREEN CHAT APP */}
          <Route path="/chat" element={<ProtectedRoute auth={auth} requiredModule="Chat"><ChatApp user={auth?.user} setAuth={setAuth} /></ProtectedRoute>} />
  
          <Route element={<ProtectedRoute auth={auth}><Layout auth={auth} setAuth={setAuth} /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/global-monitoring" element={<GlobalMonitoringDashboard />} />
            <Route path="/budget" element={<ProtectedRoute auth={auth} requiredModule="Reports"><ItBudgetDashboard /></ProtectedRoute>} />
            <Route path="/terminals" element={<ProtectedRoute auth={auth} requiredModule="Terminals"><Terminals /></ProtectedRoute>} />
            <Route path="/user-monitoring" element={<ProtectedRoute auth={auth} requiredModule="UserMonitoring"><UserMonitoring /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute auth={auth} requiredModule="Reports"><Reports /></ProtectedRoute>} />
            <Route path="/onboarding" element={<ProtectedRoute auth={auth} requiredModule="Onboarding"><Onboarding /></ProtectedRoute>} />
            <Route path="/directory-admin" element={<ProtectedRoute auth={auth} requiredModule="Directory"><DirectoryAdmin /></ProtectedRoute>} />
            <Route path="/personnel" element={<ProtectedRoute auth={auth} requiredModule="Personnel"><Personnel /></ProtectedRoute>} />
            <Route path="/personnel-feedbacks" element={<ProtectedRoute auth={auth} requiredModule="Personnel"><Feedbacks /></ProtectedRoute>} />
            <Route path="/stock" element={<ProtectedRoute auth={auth} requiredModule="Stock"><StockInventory /></ProtectedRoute>} />
            <Route path="/ssl" element={<ProtectedRoute auth={auth} requiredModule="Ssl"><SslTracking /></ProtectedRoute>} />
            <Route path="/matrix" element={<ProtectedRoute auth={auth} requiredModule="Matrix"><AccessMatrix /></ProtectedRoute>} />
            <Route path="/logs" element={<ProtectedRoute auth={auth} requiredModule="Logs"><Logs /></ProtectedRoute>} />
            <Route path="/filealerts" element={<ProtectedRoute auth={auth} requiredModule="Logs"><FileAlerts /></ProtectedRoute>} />
            <Route path="/updates" element={<ProtectedRoute auth={auth} requiredModule="Updates"><Updates /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute auth={auth} requiredModule="Users"><Users /></ProtectedRoute>} />
            <Route path="/chat-admin" element={<ProtectedRoute auth={auth} requiredModule="Users"><ChatAdmin /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute auth={auth} requiredModule="Settings"><Settings /></ProtectedRoute>} />
            <Route path="/help-admin" element={<ProtectedRoute auth={auth} requiredModule="Settings"><HelpRequestAdmin /></ProtectedRoute>} />
            <Route path="/cards" element={<ProtectedRoute auth={auth} requiredModule="Cards"><CardConverter /></ProtectedRoute>} />
            <Route path="/surveys" element={<ProtectedRoute auth={auth} requiredModule="Directory"><SurveyAdmin /></ProtectedRoute>} />
            <Route path="/backups" element={<ProtectedRoute auth={auth} requiredModule="Settings"><BackupManagement /></ProtectedRoute>} />
            <Route path="/nist" element={<ProtectedRoute auth={auth} requiredModule="Compliance"><NistCompliance /></ProtectedRoute>} />
            <Route path="/iso" element={<ProtectedRoute auth={auth} requiredModule="Compliance"><IsoCompliance /></ProtectedRoute>} />
            <Route path="/facility" element={<ProtectedRoute auth={auth} requiredModule="Compliance"><FacilityCompliance /></ProtectedRoute>} />
            <Route path="/iso9001" element={<ProtectedRoute auth={auth} requiredModule="Compliance"><Iso9001Compliance /></ProtectedRoute>} />
            <Route path="/file-alerts" element={<ProtectedRoute auth={auth} requiredModule="Terminals"><FileAlerts /></ProtectedRoute>} />
            <Route path="/signature" element={<ProtectedRoute auth={auth} requiredModule="Stock"><SignatureGenerator /></ProtectedRoute>} />
            
            {/* Also include public pages in layout for sidebar access */}
            <Route path="/layout/rehber" element={<DirectoryPublic />} />
            <Route path="/layout/anketler" element={<SurveysPublic />} />
            <Route path="/layout/yardim" element={<HelpRequestPublic />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
