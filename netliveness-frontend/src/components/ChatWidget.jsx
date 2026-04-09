import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User } from 'lucide-react';
import * as signalR from '@microsoft/signalr';
import api from '../api';
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
        setMessages(res.data);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      } catch (err) { console.error("Geçmiş mesajlar çekilemedi", err); }
    };

    fetchHistory();

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5006/chathub")
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
    return () => { newConnection.stop(); };
  }, [user, channelId]);

  useEffect(() => {
    if (!connection) return;

    // EVENTLERI ÖNCE KAYDET
    connection.on("ReceiveMessage", (message) => {
      setMessages(prev => [...prev, message]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    connection.on("IncomingCall", () => {
       toast('📞 Görüntülü arama geliyor! Sohbet Odasına yönlendiriliyorsunuz...');
       navigate('/chat');
    });

    // BAĞLAN VE PRESENCE KAYDINI YAP
    connection.start()
      .then(() => {
        connection.invoke("RegisterPresence", user.id, user.fullName || user.username);
        connection.invoke("JoinChannel", channelId.toString());
      })
      .catch(e => console.log('Connection failed: ', e));

  }, [connection, channelId]);

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
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', bottom: '24px', right: '24px',
          width: '60px', height: '60px', borderRadius: '30px',
          background: 'var(--accent-blue)', color: 'white',
          border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 9999, transition: 'transform 0.2s',
          transform: isOpen ? 'scale(0)' : 'scale(1)'
        }}
      >
        <MessageSquare size={28} />
      </button>

      {/* Chat Window */}
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px',
        width: '350px', height: '500px', backgroundColor: 'var(--bg-card)',
        borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column', zIndex: 10000,
        transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
        opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none',
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        border: '1px solid var(--border-color)', overflow: 'hidden'
      }}>
        <div style={{
          padding: '12px 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          {channels.length > 0 ? (
              <select 
                value={channelId} 
                onChange={(e) => setChannelId(Number(e.target.value))}
                style={{ background: 'transparent', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '6px', color: 'var(--text-primary)', fontWeight: 600, outline: 'none' }}
              >
                  {channels.map(ch => (
                      <option key={ch.id} value={ch.id}>{ch.name}</option>
                  ))}
              </select>
          ) : (
            <h3 style={{ margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <MessageSquare size={16} color="var(--accent-blue)" /> Sohbet
            </h3>
          )}
          <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
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
        <form onSubmit={sendMessage} style={{ padding: '12px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-card)', display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Mesaj yazın..."
            style={{
              flex: 1, padding: '10px 16px', borderRadius: '20px', border: '1px solid var(--border-color)',
              background: 'var(--bg-input)', color: 'white', outline: 'none'
            }}
          />
          <button type="submit" disabled={!input.trim() || !connection} style={{
            background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: '50%',
            width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <Send size={18} style={{ marginLeft: '2px' }} />
          </button>
        </form>
      </div>
    </>
  );
}
