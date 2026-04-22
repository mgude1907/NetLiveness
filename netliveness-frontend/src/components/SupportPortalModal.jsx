import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  getHelpRequests, submitHelpRequest, getHelpRequestReplies, 
  addHelpRequestReply, getTerminals 
} from '../api';
import { 
  Plus, Send, Clock, 
  ChevronRight, LifeBuoy, AlertTriangle, 
  Search, X, Monitor, ShieldCheck, Mail, User, Info,
  Sparkles, Zap, ArrowRight, CornerDownRight, RefreshCw, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SupportPortalModal({ isOpen, onClose, initialMode = 'list', initialRequestId = null }) {
  const [requests, setRequests] = useState([]);
  // terminals state removed as it was unused in component logic
  const [selectedId, setSelectedId] = useState(initialRequestId);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(initialMode); // list, new, chat
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
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

  const loadData = useCallback(async () => {
    try {
      const [reqs, terms] = await Promise.all([
        getHelpRequests(),
        getTerminals()
      ]);
      const myReqs = reqs.filter(r => r.senderEmail === userEmail);
      setRequests(myReqs);
      
      const offline = terms.filter(t => t.status === 'Offline').length;
      if (offline > 5) setSystemStatus('DİKKAT');
      if (offline > 15) setSystemStatus('KRİTİK');
    } catch {
      toast.error('Veriler senkronize edilemedi.');
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setMode(initialMode);
      setSelectedId(initialRequestId);
      if (initialRequestId) setMode('chat');
    }
  }, [isOpen, initialMode, initialRequestId, loadData]);

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
      // Add missing fields from auth if not already there
      if (!form.senderEmail) fd.set('senderEmail', userEmail);
      if (!form.senderName) fd.set('senderName', auth?.user?.fullName || 'User');
      
      await submitHelpRequest(fd);
      toast.success('Talebiniz başarıyla iletildi.');
      setMode('list');
      setStep(1);
      setForm({ ...form, subject: '', message: '' });
      loadData();
    } catch { toast.error('Hata oluştu.'); }
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
    } catch { toast.error('Yanıt gönderilemedi.'); }
    finally { setSending(false); }
  };

  if (!isOpen) return null;

  const selectedReq = requests.find(r => r.id === selectedId);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', 
      backdropFilter: 'blur(12px)', zIndex: 10000, 
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }} onClick={onClose}>
      
      <div style={{
        width: '1100px', height: '85vh', background: 'rgba(255, 255, 255, 0.9)', 
        backdropFilter: 'blur(30px)', borderRadius: 32, border: '1px solid rgba(255,255,255,0.5)', 
        boxShadow: '0 30px 60px rgba(0,0,0,0.15)', display: 'grid', gridTemplateColumns: '320px 1fr', 
        overflow: 'hidden', position: 'relative'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: 20, right: 24, zIndex: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <X size={18} color="#64748b" />
        </button>

        {/* Sidebar */}
        <aside style={{ background: 'rgba(255, 255, 255, 0.5)', borderRight: '1px solid rgba(0,0,0,0.05)', padding: 32, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
             <div style={{ width: 40, height: 40, borderRadius: 12, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LifeBuoy size={22} color="#fff" />
             </div>
             <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>Destek Merkezi</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Yardım ve Çözüm kanalı</div>
             </div>
          </div>

          <button 
            onClick={() => { setMode('new'); setStep(1); setSelectedId(null); }}
            style={{ 
              width: '100%', padding: '14px', borderRadius: 18, background: '#f59e0b', color: '#fff', 
              border: 'none', fontWeight: 900, fontSize: 13, cursor: 'pointer', marginBottom: 32,
              boxShadow: '0 10px 20px rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
          >
            <Plus size={18} /> YENİ TALEP OLUŞTUR
          </button>

          <div style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8', letterSpacing: 2, marginBottom: 16 }}>TALEPLERİM</div>
          <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
             {loading ? (
                <div style={{ padding: 20, textAlign: 'center' }}><div className="spinner-sm" /></div>
             ) : requests.map(req => (
               <div 
                 key={req.id} 
                 onClick={() => { setSelectedId(req.id); setMode('chat'); }}
                 style={{ 
                   padding: '16px', borderRadius: 20, cursor: 'pointer', marginBottom: 8, transition: 'all 0.2s',
                   background: selectedId === req.id ? '#fff' : 'transparent',
                   border: selectedId === req.id ? '1px solid #f59e0b' : '1px solid transparent',
                   boxShadow: selectedId === req.id ? '0 10px 20px rgba(0,0,0,0.05)' : 'none'
                 }}
               >
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', marginBottom: 4 }}>#{req.id}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{req.subject}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <span style={{ fontSize: 10, fontWeight: 900, color: req.status === 'Açık' ? '#f59e0b' : '#10b981' }}>{req.status?.toUpperCase()}</span>
                     <span style={{ fontSize: 9, color: '#94a3b8' }}>{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
               </div>
             ))}
             {!loading && requests.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.3 }}>
                   <Zap size={40} style={{ margin: '0 auto 8px' }} />
                   <div style={{ fontSize: 12, fontWeight: 600 }}>Henüz aktif talep yok.</div>
                </div>
             )}
          </div>

          <div style={{ marginTop: 'auto', padding: 20, background: 'rgba(245,158,11,0.05)', borderRadius: 24, border: '1px solid rgba(245,158,11,0.1)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: systemStatus === 'GÜVENLİ' ? '#10b981' : '#f59e0b' }} />
                <span style={{ fontSize: 12, fontWeight: 900, color: '#0f172a' }}>SİSTEM DURUMU</span>
             </div>
             <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>{systemStatus === 'GÜVENLİ' ? 'Tüm kanallar açık ve operasyonel.' : 'Yoğunluk yaşanıyor, gecikme olabilir.'}</div>
          </div>
        </aside>

        {/* Content Area */}
        <main style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
           {mode === 'new' ? (
             <div style={{ padding: '60px 100px', flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'flex', gap: 16, marginBottom: 40 }}>
                   <div style={{ width: 44, height: 44, borderRadius: 14, background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={20} /></div>
                   <div style={{ background: '#fff', padding: 20, borderRadius: '0 24px 24px 24px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', fontSize: 15, fontWeight: 500, color: '#1e293b' }}>
                      Merhaba! Ben Dijital Destek Asistanı. Size yardımcı olabilmem için sorununuzu birkaç adımda özetler misiniz?
                   </div>
                </div>

                {/* Step 1: Subject */}
                {step >= 1 && (
                  <div style={{ display: 'flex', gap: 16, marginBottom: 40 }}>
                     <div style={{ width: 44, height: 44, borderRadius: 14, background: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>1</div>
                     <div style={{ background: '#fff', padding: 20, borderRadius: '0 24px 24px 24px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', fontSize: 15, fontWeight: 500, color: '#1e293b' }}>
                        Sorunu kısaca özetler misiniz? (Örn: &quot;VPN Erişim Sorunu&quot;)
                     </div>
                  </div>
                )}
                {step === 1 && (
                  <div style={{ marginLeft: 60, marginBottom: 40 }}>
                     <input 
                       autoFocus className="zen-input" style={{ width: '100%', marginBottom: 16 }}
                       placeholder="Konu başlığı..." 
                       value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
                       onKeyDown={e => e.key === 'Enter' && form.subject.length > 3 && setStep(2)}
                     />
                     <button 
                       onClick={() => setStep(2)} disabled={form.subject.length < 4}
                       style={{ padding: '12px 24px', borderRadius: 14, background: '#f59e0b', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                     >
                       DEVAM ET <ArrowRight size={16} />
                     </button>
                  </div>
                )}

                {/* Step 2: Details */}
                {step >= 2 && (
                   <>
                    <div style={{ marginLeft: 60, marginTop: -20, marginBottom: 40, opacity: 0.6, fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>
                       <CornerDownRight size={14} /> {form.subject}
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 40 }}>
                       <div style={{ width: 44, height: 44, borderRadius: 14, background: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>2</div>
                       <div style={{ background: '#fff', padding: 20, borderRadius: '0 24px 24px 24px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', fontSize: 15, fontWeight: 500, color: '#1e293b' }}>
                          Anladım. Sorun detaylarını yazar mısınız?
                       </div>
                    </div>
                   </>
                )}
                {step === 2 && (
                   <div style={{ marginLeft: 60 }}>
                      <textarea 
                        autoFocus className="zen-input" style={{ width: '100%', minHeight: 120, marginBottom: 16 }}
                        placeholder="Hata mesajı, ekran görüntüsü detayı vb..."
                        value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                      />
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button 
                          onClick={handleCreateRequest} disabled={sending || form.message.length < 10}
                          style={{ padding: '12px 32px', borderRadius: 14, background: '#f59e0b', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                        >
                          {sending ? 'GÖNDERİLİYOR...' : 'TALEBİ OLUŞTUR'}
                        </button>
                        <button onClick={() => setStep(1)} style={{ padding: '12px 24px', borderRadius: 14, background: '#f1f5f9', color: '#64748b', border: 'none', fontWeight: 800, cursor: 'pointer' }}>GERİ</button>
                      </div>
                   </div>
                )}
             </div>
           ) : mode === 'chat' && selectedReq ? (
             <>
               <header style={{ padding: '24px 40px', background: '#fff', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                       <h2 style={{ fontSize: 18, fontWeight: 950, color: '#0f172a', margin: 0 }}>{selectedReq.subject}</h2>
                       <span style={{ fontSize: 10, fontWeight: 900, background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: 6 }}>{selectedReq.status?.toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>Destek Ekibi ile Yazışma Alanı</div>
                  </div>
                  <button onClick={() => loadReplies(selectedId)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 12, padding: '8px 16px', fontSize: 11, fontWeight: 800, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                     <RefreshCw size={14} /> YENİLE
                  </button>
               </header>

               <div style={{ flex: 1, overflowY: 'auto', padding: 40, display: 'flex', flexDirection: 'column' }} className="custom-scrollbar">
                  {/* Subject Details */}
                  <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', padding: 20, borderRadius: 20, marginBottom: 32 }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#64748b', marginBottom: 10, textTransform: 'uppercase' }}>Orijinal Talep Detayı</div>
                    <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 500, lineHeight: 1.6 }}>{selectedReq.message}</div>
                  </div>

                  {/* Conversation Replies */}
                  {replies.map((reply, i) => (
                    <div key={i} style={{ 
                      maxWidth: '75%', marginBottom: 24, alignSelf: reply.isFromAdmin ? 'flex-start' : 'flex-end',
                      display: 'flex', flexDirection: 'column', alignItems: reply.isFromAdmin ? 'flex-start' : 'flex-end'
                    }}>
                       <div style={{ 
                         padding: '14px 20px', borderRadius: 20, fontSize: 14, lineHeight: 1.6,
                         background: reply.isFromAdmin ? '#fff' : '#0f172a', 
                         color: reply.isFromAdmin ? '#1e293b' : '#fff',
                         border: reply.isFromAdmin ? '1px solid #e2e8f0' : 'none',
                         borderBottomLeftRadius: reply.isFromAdmin ? 4 : 20,
                         borderBottomRightRadius: reply.isFromAdmin ? 20 : 4,
                         boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                       }}>
                          {reply.message}
                       </div>
                       <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 6, fontWeight: 700 }}>
                          {reply.isFromAdmin ? 'BT DESTEK EKİBİ' : 'BEN'} • {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
               </div>

               <footer style={{ padding: 24, background: '#fff', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                     <textarea 
                       className="zen-input" style={{ flex: 1, height: 60, padding: 16, borderRadius: 20 }}
                       placeholder="Yanıtınızı buraya yazın..."
                       value={replyText} onChange={e => setReplyText(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendReply())}
                     />
                     <button 
                       onClick={handleSendReply} disabled={sending || !replyText.trim()}
                       style={{ width: 60, height: 60, borderRadius: 20, background: '#f59e0b', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                     >
                       {sending ? <div className="spinner-sm" style={{borderColor: '#fff', borderTopColor: 'transparent'}} /> : <Send size={20} />}
                     </button>
                  </div>
               </footer>
             </>
           ) : (
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                <MessageSquare size={100} style={{ marginBottom: 20 }} />
                <div style={{ fontSize: 18, fontWeight: 800 }}>Mühendislik ve Sistem Desteği için Talep Seçin</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 10 }}>Veya sol panelden yeni bir talep oluşturun.</div>
             </div>
           )}
        </main>
      </div>

      <style>{`
        .zen-input { border: 2px solid #f1f5f9; background: #fff; border-radius: 12px; outline: none; transition: all 0.2s; font-size: 14px; font-weight: 600; }
        .zen-input:focus { border-color: #f59e0b; box-shadow: 0 0 0 4px rgba(245,158,11,0.1); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        .spinner-sm { width: 20px; height: 20px; border: 2px solid #f59e0b; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s infinite linear; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
