import { useState, useEffect, useRef } from 'react';
import { 
  getHelpRequests, submitHelpRequest, getHelpRequestReplies, 
  addHelpRequestReply, getTerminals 
} from '../api';
import { 
  Plus, Send, MessageSquare, Clock, CheckCircle2, 
  ChevronRight, LifeBuoy, AlertTriangle, Paperclip, 
  Search, X, Monitor, Wifi, ShieldCheck, Mail, User, Info,
  Sparkles, Zap, ArrowRight, CornerDownRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function HelpRequestPortal() {
  const [requests, setRequests] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('list'); // list, new
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [systemStatus, setSystemStatus] = useState('GÜVENLİ');

  // New Request Form State (Conversational)
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    senderName: '',
    senderEmail: '',
    subject: '',
    category: 'Donanım',
    priority: 'Orta',
    message: ''
  });

  const chatEndRef = useRef(null);
  const auth = JSON.parse(localStorage.getItem('auth') || '{}');
  const userEmail = auth?.user?.email || '';

  const loadData = async () => {
    try {
      const [reqs, terms] = await Promise.all([
        getHelpRequests(),
        getTerminals()
      ]);
      // Filter for current user
      const myReqs = reqs.filter(r => r.senderEmail === userEmail);
      setRequests(myReqs);
      setTerminals(terms);
      
      // Calculate system health
      const offline = terms.filter(t => t.status === 'Offline').length;
      if (offline > 5) setSystemStatus('DİKKAT');
      if (offline > 15) setSystemStatus('KRİTİK');
    } catch (e) {
      toast.error('Veriler senkronize edilemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const loadReplies = async (id) => {
    if (!id) return;
    try {
      const data = await getHelpRequestReplies(id);
      setReplies(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (selectedId) loadReplies(selectedId);
  }, [selectedId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies]);

  const handleCreateRequest = async () => {
    setSending(true);
    try {
      const fd = new FormData();
      Object.keys(form).forEach(k => fd.append(k, form[k]));
      await submitHelpRequest(fd);
      toast.success('Talebiniz başarıyla iletildi.');
      setMode('list');
      setStep(1);
      setForm({ ...form, subject: '', message: '' });
      loadData();
    } catch (e) { toast.error('Hata oluştu.'); }
    finally { setSending(false); }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('message', replyText);
      fd.append('isAdmin', 'false');
      await addHelpRequestReply(selectedId, fd);
      setReplyText('');
      loadReplies(selectedId);
    } catch (e) { toast.error('Yanıt gönderilemedi.'); }
    finally { setSending(false); }
  };

  const selectedReq = requests.find(r => r.id === selectedId);

  if (loading) return (
    <div className="modern-loader">
       <div className="pulse-loader"></div>
       <span>Quantum Yardım Kanalları Açılıyor...</span>
    </div>
  );

  return (
    <div className="support-portal">
      <style>{`
        .support-portal {
          height: calc(100vh - 120px);
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 24px;
          font-family: 'Inter', sans-serif;
        }

        /* Nav Sidebar */
        .portal-nav {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(15,23,42,0.05);
          border-radius: 32px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px rgba(0,0,0,0.03);
        }

        .portal-status {
          padding: 16px;
          border-radius: 20px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          margin-bottom: 24px;
          text-align: center;
        }
        .beacon {
          width: 8px; height: 8px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 8px;
          box-shadow: 0 0 10px currentColor;
        }
        .beacon.GÜVENLİ { background: #10b981; color: #10b981; }
        .beacon.DİKKAT { background: #f59e0b; color: #f59e0b; }
        .beacon.KRİTİK { background: #ef4444; color: #ef4444; }

        .ticket-item {
          padding: 14px 18px;
          border-radius: 16px;
          cursor: pointer;
          margin-bottom: 8px;
          transition: all 0.2s;
          border: 1px solid transparent;
        }
        .ticket-item:hover { background: rgba(245,158,11,0.05); }
        .ticket-item.active { background: #ffffff; border-color: #f59e0b; box-shadow: 0 10px 20px rgba(245,158,11,0.1); }

        /* Main Workspace */
        .portal-workspace {
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(40px);
          border: 1px solid rgba(15,23,42,0.03);
          border-radius: 32px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .workspace-header {
          padding: 24px 40px;
          background: #fff;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        /* Conversational Form */
        .step-container {
          padding: 60px 80px;
          max-width: 700px;
          margin: 0 auto;
        }
        .step-bubble {
          display: flex;
          gap: 16px;
          margin-bottom: 40px;
          animation: slideIn 0.5s ease-out;
        }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .ai-avatar { width: 44px; height: 44px; border-radius: 14px; background: #0f172a; color: #fff; display: flex; alignItems: center; justifyContent: center; }
        .ai-msg {
          background: #fff;
          padding: 20px 24px;
          border-radius: 0 24px 24px 24px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
          font-size: 15px;
          font-weight: 500;
          color: #1e293b;
          border: 1px solid #f1f5f9;
        }
        
        .step-input-wrap {
          margin-left: 60px;
          animation: fadeIn 0.4s ease-out 0.2s backwards;
        }
        .zen-input {
          width: 100%;
          border: none;
          background: #f8fafc;
          padding: 16px 24px;
          border-radius: 20px;
          font-size: 16px;
          font-weight: 600;
          outline: none;
          transition: all 0.2s;
          border: 2px solid transparent;
        }
        .zen-input:focus { border-color: #f59e0b; background: #fff; box-shadow: 0 0 0 4px rgba(245,158,11,0.1); }

        /* Chat View */
        .chat-body { flex: 1; overflow-y: auto; padding: 40px; }
        .chat-bubble { max-width: 75%; margin-bottom: 24px; position: relative; }
        .chat-bubble.user { align-self: flex-end; margin-left: auto; }
        .chat-bubble.admin { align-self: flex-start; }
        
        .bubble-inner {
          padding: 16px 20px;
          border-radius: 20px;
          font-size: 14px;
          line-height: 1.6;
        }
        .user .bubble-inner { background: #0f172a; color: #fff; border-bottom-right-radius: 4px; }
        .admin .bubble-inner { background: #fff; color: #1e293b; border-bottom-left-radius: 4px; border: 1px solid #e2e8f0; }
        
        .chat-footer { padding: 24px 40px; background: #fff; border-top: 1px solid #f1f5f9; }
        
        .btn-zen {
          padding: 12px 24px;
          border-radius: 16px;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          border: none;
        }
        .btn-zen-primary { background: #f59e0b; color: #fff; box-shadow: 0 10px 25px rgba(245,158,11,0.25); }
        .btn-zen-primary:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(245,158,11,0.3); }
        .btn-zen-secondary { background: #f1f5f9; color: #64748b; }

        .modern-loader { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 16px; color: #94a3b8; font-weight: 600; }
        .pulse-loader { width: 40px; height: 40px; border-radius: 50%; border: 4px solid #f59e0b; border-top-color: transparent; animation: spin 1s infinite linear; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Pane 1: Tickets List */}
      <aside className="portal-nav">
        <div className="portal-status">
           <div style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', letterSpacing: 1.5, marginBottom: 4 }}>SİSTEM DURUMU</div>
           <div style={{ fontSize: '14px', fontWeight: 950, color: systemStatus === 'GÜVENLİ' ? '#10b981' : '#f59e0b' }}>
              <span className={`beacon ${systemStatus}`} />
              {systemStatus}
           </div>
        </div>

        <button 
          className="btn-zen btn-zen-primary" style={{ width: '100%', marginBottom: '24px', justifyContent: 'center' }}
          onClick={() => { setMode('new'); setStep(1); setSelectedId(null); }}
        >
          <Plus size={18} /> YENİ TALEP OLUŞTUR
        </button>

        <div style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', letterSpacing: 2, marginBottom: 15 }}>TALEPLERİM</div>
        <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
          {requests.map(req => (
            <div 
              key={req.id} 
              className={`ticket-item ${selectedId === req.id ? 'active' : ''}`}
              onClick={() => { setSelectedId(req.id); setMode('chat'); }}
            >
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', marginBottom: 4 }}>#{req.id}</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{req.subject}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                 <span style={{ fontSize: '10px', color: req.status === 'Açık' ? '#f59e0b' : '#10b981', fontWeight: 900 }}>{req.status?.toUpperCase()}</span>
                 <span style={{ fontSize: '9px', color: '#94a3b8' }}>{new Date(req.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          {requests.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.3 }}>
               <LifeBuoy size={40} style={{ margin: '0 auto 8px' }} />
               <div style={{ fontSize: '12px', fontWeight: 600 }}>Henüz talep yok.</div>
            </div>
          )}
        </div>
      </aside>

      {/* Pane 2: Workspace */}
      <main className="portal-workspace">
        
        {mode === 'new' ? (
          <div className="step-container">
            <div className="step-bubble">
               <div className="ai-avatar"><Sparkles size={20} /></div>
               <div className="ai-msg">Selam! Ben Dijital Destek Asistanı. Size yardımcı olabilmem için sorununuzu birkaç adımda anlatır mısınız?</div>
            </div>

            {/* Step 1: Subject */}
            {step >= 1 && (
              <div className="step-bubble">
                <div className="ai-avatar" style={{ background: '#f59e0b' }}>1</div>
                <div className="ai-msg">Sorunu kısaca özetler misiniz? (Örn: &quot;VPN Bağlantı Hatası&quot;)</div>
              </div>
            )}
            {step === 1 && (
              <div className="step-input-wrap">
                <input 
                  autoFocus className="zen-input" placeholder="Konu başlığı..." 
                  value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
                  onKeyPress={e => e.key === 'Enter' && form.subject.length > 3 && setStep(2)}
                />
                <button className="btn-zen btn-zen-primary" style={{ marginTop: 15 }} onClick={() => setStep(2)} disabled={form.subject.length < 4}>DEVAM ET <ArrowRight size={14} /></button>
              </div>
            )}

            {/* Step 2: Category & Priority */}
            {step >= 2 && (
              <>
                <div className="step-bubble" style={{ marginLeft: 40, marginTop: -20, opacity: 0.6 }}>
                   <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}><CornerDownRight size={14} /> {form.subject}</div>
                </div>
                <div className="step-bubble">
                   <div className="ai-avatar" style={{ background: '#f59e0b' }}>2</div>
                   <div className="ai-msg">Anladım. Sorunun türü ve aciliyeti nedir?</div>
                </div>
              </>
            )}
            {step === 2 && (
              <div className="step-input-wrap" style={{ display: 'flex', gap: 12 }}>
                <select className="zen-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                   <option value="Donanım">Donanım</option>
                   <option value="Yazılım">Yazılım</option>
                   <option value="İnternet">İnternet</option>
                   <option value="ERP / SAP">ERP / SAP</option>
                </select>
                <select className="zen-input" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                   <option value="Düşük">Düşük</option>
                   <option value="Orta">Orta</option>
                   <option value="Yüksek">Yüksek</option>
                   <option value="Acil">Acil</option>
                </select>
                <button className="btn-zen btn-zen-primary" onClick={() => setStep(3)}><ArrowRight size={14} /></button>
              </div>
            )}

            {/* Step 3: Message */}
            {step >= 3 && (
              <div className="step-bubble">
                <div className="ai-avatar" style={{ background: '#f59e0b' }}>3</div>
                <div className="ai-msg">Son olarak, sorunu detaylandırır mısınız? Hatayı ne zaman alıyorsunuz?</div>
              </div>
            )}
            {step === 3 && (
              <div className="step-input-wrap">
                <textarea 
                  autoFocus className="zen-input" style={{ minHeight: 120 }} placeholder="Detaylar..." 
                  value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                />
                <div style={{ display: 'flex', gap: 12, marginTop: 15 }}>
                   <button className="btn-zen btn-zen-primary" onClick={handleCreateRequest} disabled={sending || form.message.length < 10}>
                     {sending ? 'GÖNDERİLİYOR...' : 'TALEBİ OLUŞTUR'}
                   </button>
                   <button className="btn-zen btn-zen-secondary" onClick={() => setStep(2)}>GERİ</button>
                </div>
              </div>
            )}
          </div>
        ) : selectedReq ? (
          <>
            <header className="workspace-header">
               <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                     <h2 style={{ fontSize: 18, fontWeight: 950, color: '#0f172a', margin: 0 }}>{selectedReq.subject}</h2>
                     <span style={{ fontSize: 10, fontWeight: 900, background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: 6 }}>{selectedReq.status?.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>Destek Ekibi ile Yazışma Alanı</div>
               </div>
               <button className="btn-zen btn-zen-secondary" onClick={() => loadReplies(selectedId)}>
                  <RefreshCw size={14} /> YENİLE
               </button>
            </header>

            <div className="chat-body custom-scrollbar" style={{ display: 'flex', flexDirection: 'column' }}>
               {/* Initial Request */}
               <div className="chat-bubble admin">
                  <div className="bubble-inner" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                     <div style={{ fontSize: 11, fontWeight: 900, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Talep Detayı</div>
                     {selectedReq.message}
                  </div>
               </div>

               {/* Replies */}
               {replies.map(reply => (
                 <div key={reply.id} className={`chat-bubble ${reply.isFromAdmin ? 'admin' : 'user'}`}>
                    <div className="bubble-inner">
                       {reply.message}
                    </div>
                    <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: 6, fontWeight: 700, textAlign: reply.isFromAdmin ? 'left' : 'right' }}>
                       {reply.isFromAdmin ? 'BT DESTEK' : 'BEN'} • {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                 </div>
               ))}
               <div ref={chatEndRef} />
            </div>

            <footer className="chat-footer">
               <div style={{ display: 'flex', gap: 16 }}>
                  <textarea 
                    className="zen-input" style={{ flex: 1, height: 50, padding: '12px 20px', borderRadius: 16 }}
                    placeholder="Yanıtınızı buraya yazın..."
                    value={replyText} onChange={e => setReplyText(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendReply())}
                  />
                  <button 
                    className="btn-zen btn-zen-primary" style={{ height: 50, padding: '0 24px' }}
                    onClick={handleSendReply} disabled={sending || !replyText.trim()}
                  >
                     {sending ? '...' : <Send size={18} />}
                  </button>
               </div>
            </footer>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
             <Zap size={80} style={{ marginBottom: 20 }} />
             <div style={{ fontSize: 16, fontWeight: 800 }}>Mühendislik ve Sistem Desteği için Talep Seçin</div>
          </div>
        )}

      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
}

const RefreshCw = ({ size }) => <Zap size={size} />; // Small shim for Icon compatibility if Lucide RefreshCw not in scope
