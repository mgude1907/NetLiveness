import React, { useState, useEffect, useRef } from 'react';
import { MessageCircleMore, X, Send, User, ChevronUp } from 'lucide-react';
import * as signalR from '@microsoft/signalr';
import api, { STATIC_URL } from '../api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ChatWidget({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connection, setConnection] = useState(null);
  const [channelId, setChannelId] = useState(1); // Varsayılan genel kanal
  const [channels, setChannels] = useState([]);
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  // Kanalları yükle
  useEffect(() => {
    if (!user) return;
    const fetchChannels = async () => {
      try {
        const res = await api.get('/chat/channels');
        setChannels(res.data);
        if (res.data.length > 0) {
            setChannelId(res.data[0].id); // Varsayılan ilk kanal
        }
      } catch (err) { console.error("Kanallar çekilemedi", err); }
    };
    fetchChannels();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      try {
        const res = await api.get(`/Chat/history/${channelId}`);
        setMessages(res.data || []);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      } catch (err) { console.error("Geçmiş mesajlar çekilemedi", err); }
    };

    fetchHistory();

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${STATIC_URL}/chathub`)
      .withAutomaticReconnect()
      .build();

    // Setup event handlers BEFORE starting
    newConnection.on("ReceiveMessage", (message) => {
      setMessages(prev => [...prev, message]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    newConnection.on("IncomingCall", () => {
      toast('📞 Görüntülü arama geliyor! Sohbet Odasına yönlendiriliyorsunuz...');
      navigate('/chat');
    });

    // Start connection
    newConnection.start()
      .then(() => {
        if (user?.id) {
          newConnection.invoke("RegisterPresence", user.id, user.fullName || user.username);
          newConnection.invoke("JoinChannel", channelId.toString());
        }
      })
      .catch(e => console.error('SignalR Init Failed: ', e));

    setConnection(newConnection);

    return () => { 
      if (newConnection) {
        newConnection.stop(); 
      }
    };
  }, [user, channelId, navigate]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !connection || !user) return;
    try {
      await connection.invoke("SendMessage", channelId, user.id, user.fullName || user.username, input);
      setInput('');
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) return null; // Giriş yapmayanlara widget gözükmez

  return (
    <>
      {/* ─── Premium Floating Button ─── */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`chat-fab ${isOpen ? 'open' : ''}`}
        style={{
          position: 'fixed', bottom: '32px', right: '32px',
          width: '64px', height: '64px', borderRadius: '24px',
          background: 'var(--blue-text)', color: 'white',
          border: 'none', boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 9999, transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        <div className="fab-glow" />
        {isOpen ? <X size={28} strokeWidth={2.5} /> : <MessageCircleMore size={28} strokeWidth={2.5} />}
        
        {/* Pulse Effect when closed */}
        {!isOpen && <div className="fab-pulse" />}
      </button>

      {/* ─── Modern Chat Window ─── */}
      <div className={`chat-mini-window ${isOpen ? 'active' : ''}`} style={{
        position: 'fixed', bottom: '110px', right: '32px',
        width: '380px', height: '540px', backgroundColor: 'var(--bg-card)',
        borderRadius: '28px', boxShadow: 'var(--shadow-2xl)',
        display: 'flex', flexDirection: 'column', zIndex: 10000,
        pointerEvents: isOpen ? 'auto' : 'none',
        border: '1px solid var(--border)', overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)'
      }}>
        {/* Window Header */}
        <div style={{
          padding: '20px 24px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
             <div className="icon-box-sm icon-blue">
                <MessageCircleMore size={16} color="var(--blue-text)" />
             </div>
             <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: 'var(--text-1)' }}>Genel Sohbet</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-3)', fontWeight: 700 }}>
                   <div className="status-dot success" /> Çevrimiçi
                </div>
             </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {channels.length > 0 && (
                <select 
                  value={channelId} 
                  onChange={(e) => setChannelId(Number(e.target.value))}
                  style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: '10px', color: 'var(--text-1)', fontSize: 11, fontWeight: 800, outline: 'none' }}
                >
                    {channels.map(ch => (
                        <option key={ch.id} value={ch.id}>{ch.name}</option>
                    ))}
                </select>
            )}
            <button onClick={() => setIsOpen(false)} style={{ background: 'var(--bg-inset)', border: 'none', width: 32, height: 32, borderRadius: 10, color: 'var(--text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages Layout */}
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px' }}>Henüz mesaj yok.</div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.userId === user.id;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  {!isMe && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', marginLeft: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={10} /> {msg.senderName}
                    </span>
                  )}
                  <div style={{
                    maxWidth: '80%', padding: '10px 14px', borderRadius: '14px',
                    background: isMe ? 'var(--accent-blue)' : 'var(--bg-input)',
                    color: isMe ? 'white' : 'var(--text-primary)',
                    borderBottomRightRadius: isMe ? '4px' : '14px',
                    borderBottomLeftRadius: isMe ? '14px' : '4px'
                  }}>
                    {msg.content}
                  </div>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', marginRight: isMe ? '4px' : '0' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={sendMessage} style={{ padding: '20px', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Mesajınızı yazın..."
              style={{
                width: '100%', padding: '12px 48px 12px 20px', borderRadius: '16px', border: '1px solid var(--border)',
                background: 'var(--bg-inset)', color: 'var(--text-1)', fontWeight: 600, outline: 'none', fontSize: 13, transition: 'all 0.2s'
              }}
              className="chat-mini-input"
            />
          </div>
          <button type="submit" disabled={!input.trim() || !connection} style={{
            background: 'var(--blue-text)', color: 'white', border: 'none', borderRadius: '14px',
            width: '46px', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', transition: 'all 0.2s'
          }} className="chat-send-btn">
            <Send size={18} strokeWidth={2.5} />
          </button>
        </form>
      </div>

      <style>{`
        .chat-fab:hover { transform: scale(1.05) translateY(-2px); }
        .chat-fab:active { transform: scale(0.95); }
        .chat-fab.open { transform: rotate(90deg); background: var(--bg-surface) !important; color: var(--text-2) !important; border: 1px solid var(--border); box-shadow: var(--shadow-lg); }
        
        .fab-pulse { position: absolute; inset: -4px; border-radius: 28px; border: 2px solid var(--blue-text); animation: pulseFab 2s infinite; opacity: 0; }
        @keyframes pulseFab { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.3); opacity: 0; } }
        
        .chat-mini-window { transform: translateY(30px) scale(0.9); opacity: 0; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .chat-mini-window.active { transform: translateY(0) scale(1); opacity: 1; }
        
        .chat-mini-input:focus { border-color: var(--blue-text); background: var(--bg-surface); }
        .chat-send-btn:hover:not(:disabled) { transform: scale(1.05); background: var(--blue-dark); }
        .chat-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </>
  );
}
