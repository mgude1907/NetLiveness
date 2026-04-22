import React, { useState, useEffect } from 'react';
import { getAdminSurveys, createSurvey, updateSurvey, deleteSurvey, getSurveyQuestions, addSurveyQuestion, deleteSurveyQuestion, getSurveyResults } from '../api';
import { ClipboardList, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, CircleCheck, CircleAlert, X, List, BarChart2, Save, MoreVertical, Trash, AlignLeft, Type, CheckCircle2, ChevronRight, Activity, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function SurveyAdmin() {
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ title: '', description: '', isActive: true });

    // Question management
    const [showQuestions, setShowQuestions] = useState(false);
    const [activeSurvey, setActiveSurvey] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [newQuestion, setNewQuestion] = useState({ text: '', type: 'text', options: '', order: 0 });

    // Results management
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState(null);

    const loadSurveys = async () => {
        try {
            const data = await getAdminSurveys();
            setSurveys(data);
        } catch {
            toast.error('Anketler yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadSurveys(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editItem) {
                await updateSurvey(editItem.id, { ...editItem, ...form });
                toast.success('Anket güncellendi.');
            } else {
                await createSurvey(form);
                toast.success('Anket başarıyla oluşturuldu.');
            }
            setShowModal(false);
            setEditItem(null);
            setForm({ title: '', description: '', isActive: true });
            loadSurveys();
        } catch {
            toast.error('İşlem başarısız oldu.');
        }
    };

    const handleToggle = async (survey) => {
        try {
            await updateSurvey(survey.id, { ...survey, isActive: !survey.isActive });
            toast.success(survey.isActive ? 'Anket taslağa çekildi.' : 'Anket canlıya alındı.');
            loadSurveys();
        } catch {
            toast.error('Durum güncellenemedi.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu anketi silmek istediğinize emin misiniz?')) return;
        try {
            await deleteSurvey(id);
            toast.success('Anket silindi.');
            loadSurveys();
        } catch {
            toast.error('Silme işlemi başarısız.');
        }
    };

    const openEdit = (s) => {
        setEditItem(s);
        setForm({ title: s.title, description: s.description, isActive: s.isActive });
        setShowModal(true);
    };

    // ── Question Methods ──
    const openQuestions = async (s) => {
        setActiveSurvey(s);
        try {
            const qs = await getSurveyQuestions(s.id);
            setQuestions(qs);
            setShowQuestions(true);
        } catch {
            toast.error('Sorular yüklenemedi.');
        }
    };

    const handleAddQuestion = async (e) => {
        e.preventDefault();
        try {
            await addSurveyQuestion(activeSurvey.id, newQuestion);
            toast.success('Soru eklendi.');
            setNewQuestion({ text: '', type: 'text', options: '', order: questions.length + 1 });
            const qs = await getSurveyQuestions(activeSurvey.id);
            setQuestions(qs);
        } catch {
            toast.error('Soru eklenemedi.');
        }
    };

    const handleDeleteQuestion = async (qid) => {
        try {
            await deleteSurveyQuestion(qid);
            setQuestions(questions.filter(q => q.id !== qid));
            toast.success('Soru silindi.');
        } catch {
            toast.error('Soru silinemedi.');
        }
    };

    // ── Results Methods ──
    const openResults = async (s) => {
        setActiveSurvey(s);
        try {
            const data = await getSurveyResults(s.id);
            setResults(data);
            setShowResults(true);
        } catch {
            toast.error('Sonuçlar yüklenemedi.');
        }
    };

    const renderChart = (question, results) => {
        if (question.type === 'text') return <p style={{ fontSize: '12px', color: '#94a3b8' }}>Serbest metin yanıtları grafiklenemez, ancak aşağıda incelenebilir.</p>;
        
        const qAnswers = results.answers.filter(a => a.questionId === question.id);
        const counts = {};
        qAnswers.forEach(a => {
            if (question.type === 'checkbox') {
                try {
                    const vals = JSON.parse(a.value);
                    vals.forEach(v => counts[v] = (counts[v] || 0) + 1);
                } catch { counts[a.value] = (counts[a.value] || 0) + 1; }
            } else {
                counts[a.value] = (counts[a.value] || 0) + 1;
            }
        });

        const data = Object.keys(counts).map(name => ({ name, value: counts[name] }));

        return (
            <div style={{ height: '220px', marginTop: '10px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={120} style={{ fontSize: '11px', fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip 
                            contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="value" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    };

    if (loading) return (
        <div className="loading-screen">
            <div className="spinner" />
            <span style={{ fontWeight: 600 }}>Anket Sistemi Hazırlanıyor…</span>
        </div>
    );

    return (
        <div className="page-container animate-fade-in" style={{ padding: '40px' }}>
            <style>{`
                .premium-modal {
                    background: rgba(30, 41, 59, 0.7) !important;
                    backdrop-filter: blur(40px) saturate(180%) !important;
                    border: 1px solid rgba(245, 158, 11, 0.2) !important;
                    border-radius: 32px !important;
                    box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.5) !important;
                    animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes modalSlideUp { from { opacity: 0; transform: translateY(40px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
                
                .premium-label { color: #f59e0b; font-size: 11px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; display: flex; alignItems: center; gap: 8px; }
                .premium-input-wrap { position: relative; width: 100%; }
                .premium-input-icon { position: absolute; left: 16px; top: 14px; color: #64748b; }
                .premium-input {
                    width: 100%;
                    background: rgba(0, 0, 0, 0.2) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    border-radius: 16px !important;
                    padding: 14px 16px 14px 48px !important;
                    color: #fff !important;
                    font-size: 15px !important;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .premium-input:focus {
                    border-color: #f59e0b !important;
                    background: rgba(0, 0, 0, 0.4) !important;
                    box-shadow: 0 0 20px rgba(245, 158, 11, 0.15) !important;
                    outline: none;
                }
                .survey-card {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.4);
                    border-radius: 28px;
                    overflow: hidden;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 10px 40px rgba(0,0,0,0.03);
                }
                .survey-card:hover { transform: translateY(-8px); border-color: rgba(245, 158, 11, 0.3); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1); }
                .digital-btn {
                    padding: 16px 28px;
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: #fff;
                    border: none;
                    border-radius: 16px;
                    font-weight: 950;
                    font-size: 15px;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .digital-btn:hover { transform: scale(1.02); box-shadow: 0 12px 35px rgba(245, 158, 11, 0.5); }
                .header-glow { font-size: 52px; font-weight: 950; line-height: 1; letter-spacing: -2px; color: #0f172a; margin: 0; position: relative; }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
                <div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(245,158,11,0.2)' }}>
                            <ClipboardList size={24} color="#fff" />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 900, color: '#f59e0b', letterSpacing: 3 }}>INTERNAL SURVEY CENTER</span>
                    </div>
                    <h1 className="header-glow">Anket Yönetimi</h1>
                    <p style={{ color: '#64748b', fontSize: '16px', fontWeight: 600, marginTop: 8 }}>Kurumsal geri bildirimlerin dijital kumanda merkezi.</p>
                </div>
                <button className="digital-btn" style={{ background: '#0f172a', padding: '14px 24px' }} onClick={() => { setEditItem(null); setForm({ title: '', description: '', isActive: true }); setShowModal(true); }}>
                    <Plus size={20} color="#f59e0b" strokeWidth={3} /> YENİ ANKET OLUŞTUR
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '32px' }}>
                {surveys.map(s => (
                    <div key={s.id} className="survey-card animate-scale-in">
                        <div style={{ padding: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.isActive ? '#10b981' : '#cbd5e1', boxShadow: s.isActive ? '0 0 10px #10b981' : 'none' }} />
                                    <span style={{ fontSize: '11px', fontWeight: '900', color: s.isActive ? '#059669' : '#94a3b8', letterSpacing: 1 }}>{s.isActive ? 'AKTİF YAYINDA' : 'TASLAK MODU'}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="icon-btn" style={{ background: '#f8fafc' }} onClick={() => openEdit(s)}><Edit2 size={16} /></button>
                                    <button className="icon-btn danger" style={{ background: '#fef2f2' }} onClick={() => handleDelete(s.id)}><Trash2 size={16} /></button>
                                </div>
                            </div>
                            
                            <h3 style={{ fontSize: '24px', fontWeight: '950', color: '#0f172a', letterSpacing: -0.5, marginBottom: '12px' }}>{s.title}</h3>
                            <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px', minHeight: '48px' }}>
                                {s.description || 'Bu anket için henüz bir açıklama girilmedi.'}
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                <button className="btn" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '12px', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={() => openQuestions(s)}>
                                    <List size={18} color="#f59e0b" /> Soruları Düzenle
                                </button>
                                <button className="btn" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '12px', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={() => openResults(s)}>
                                    <Activity size={18} color="#3b82f6" /> Veri Analizi
                                </button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: '12px', fontWeight: 700 }}>
                                    <Calendar size={14} /> {new Date(s.createdAt).toLocaleDateString('tr-TR')}
                                </div>
                                <button 
                                    onClick={() => handleToggle(s)}
                                    style={{
                                        background: s.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)', 
                                        padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 900,
                                        color: s.isActive ? '#059669' : '#64748b', transition: 'all 0.2s'
                                    }}
                                >
                                    {s.isActive ? <><CheckCircle2 size={16} /> YAYINDA</> : <><CircleAlert size={16} /> YAYINA AL</>}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* General Settings Modal - REDESIGNED */}
            {showModal && (
                <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="modal-content premium-modal" style={{ width: '580px', padding: '0', overflow: 'hidden' }}>
                        
                        {/* Modal Header */}
                        <div style={{ padding: '40px 48px 30px', position: 'relative' }}>
                             <button 
                                onClick={() => setShowModal(false)}
                                style={{ position: 'absolute', top: 32, right: 32, background: 'rgba(255,255,255,0.05)', border: 'none', width: 44, height: 44, borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <X size={24} color="#fff" />
                            </button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 15px #f59e0b' }} />
                                <span style={{ color: '#f59e0b', fontSize: 11, fontWeight: 900, letterSpacing: 2 }}>SURVEY CONFIGURATION</span>
                            </div>
                            <h2 style={{ fontSize: '32px', fontWeight: '950', color: '#fff', margin: 0, letterSpacing: -1 }}>
                                {editItem ? 'Anketi Güncelle' : 'Yeni Anket Oluştur'}
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', marginTop: 8, fontWeight: 500 }}>Operasyonel parametreleri belirleyin.</p>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} style={{ padding: '0 48px 48px' }}>
                            <div style={{ marginBottom: '28px' }}>
                                <label className="premium-label"><Type size={14} /> ANKET BAŞLIĞI</label>
                                <div className="premium-input-wrap">
                                    <ChevronRight className="premium-input-icon" size={20} />
                                    <input type="text" className="premium-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="Örn: 2024 Memnuniyet Anketi" />
                                </div>
                            </div>

                            <div style={{ marginBottom: '28px' }}>
                                <label className="premium-label"><AlignLeft size={14} /> ÖZET VE AÇIKLAMA</label>
                                <div className="premium-input-wrap">
                                    <AlignLeft className="premium-input-icon" size={20} style={{ top: 16 }} />
                                    <textarea className="premium-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Çalışanlara gösterilecek açıklama..." style={{ minHeight: '130px', paddingLeft: '48px', paddingTop: '16px', lineHeight: '1.5' }} />
                                </div>
                            </div>

                            <div 
                                style={{ 
                                    background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '24px',
                                    display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', transition: 'all 0.2s',
                                    borderColor: form.isActive ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255,255,255,0.08)'
                                }}
                                onClick={() => setForm({...form, isActive: !form.isActive})}
                            >
                                <div style={{ width: 44, height: 44, borderRadius: 14, background: form.isActive ? '#f59e0b' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: form.isActive ? '#fff' : 'rgba(255,255,255,0.2)' }}>
                                    <Activity size={22} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>Hemen Yayına Al</div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Kaydettiğiniz an tüm çalışanlara görünecek.</div>
                                </div>
                                <div style={{ width: 24, height: 24, borderRadius: 8, border: '2px solid', borderColor: form.isActive ? '#f59e0b' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {form.isActive && <div style={{ width: 12, height: 12, borderRadius: 3, background: '#f59e0b' }} />}
                                </div>
                            </div>

                            <div style={{ marginTop: '48px', display: 'flex', gap: '16px' }}>
                                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '16px', borderRadius: '18px', color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.05)', border: 'none', fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>İPTAL</button>
                                <button type="submit" className="digital-btn" style={{ flex: 2 }}>
                                    {editItem ? 'DEĞİŞİKLİKLERİ KAYDET' : 'ANKETİ BAŞLAT'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Questions Management Modal - Also Upgraded */}
            {showQuestions && (
                <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="modal-content premium-modal" style={{ maxWidth: '1100px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '0' }}>
                        <div style={{ padding: '48px' }}>
                            <div className="modal-header" style={{ marginBottom: '40px' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                                        <span style={{ color: '#f59e0b', fontSize: 11, fontWeight: 900, letterSpacing: 2 }}>QUESTION DESIGNER</span>
                                    </div>
                                    <h2 style={{ fontSize: '32px', fontWeight: '950', color: '#fff', margin: 0 }}>Soru Yönetim Merkezi</h2>
                                    <p style={{ margin: '8px 0 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '16px', fontWeight: 600 }}>ANKET: {activeSurvey?.title}</p>
                                </div>
                                <button className="icon-btn" onClick={() => setShowQuestions(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}><X size={24} /></button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '440px 1fr', gap: '48px' }}>
                                {/* Add Question Column */}
                                <div>
                                    <h4 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: '900', color: '#fff' }}>Yeni Soru Tasarla</h4>
                                    <form onSubmit={handleAddQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        <div>
                                            <label className="premium-label">SORU METNİ</label>
                                            <div className="premium-input-wrap">
                                                <ChevronRight className="premium-input-icon" size={20} />
                                                <input type="text" className="premium-input" value={newQuestion.text} onChange={e => setNewQuestion({...newQuestion, text: e.target.value})} required placeholder="Soru cümlesini girin..." />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="premium-label">YANIT TİPİ</label>
                                            <div className="premium-input-wrap">
                                                <List className="premium-input-icon" size={20} />
                                                <select className="premium-input" value={newQuestion.type} onChange={e => setNewQuestion({...newQuestion, type: e.target.value})} style={{ width: '100%' }}>
                                                    <option value="text">Kısa Cevap (Serbest Metin)</option>
                                                    <option value="radio">Tek Seçenekli (Radio)</option>
                                                    <option value="checkbox">Çoklu Seçenekli (Checkbox)</option>
                                                </select>
                                            </div>
                                        </div>
                                        {(newQuestion.type === 'radio' || newQuestion.type === 'checkbox') && (
                                            <div>
                                                <label className="premium-label">SEÇENEKLER (VİRGÜLLE AYIRIN)</label>
                                                <div className="premium-input-wrap">
                                                    <AlignLeft className="premium-input-icon" size={20} style={{ top: 16 }} />
                                                    <textarea className="premium-input" value={newQuestion.options} onChange={e => setNewQuestion({...newQuestion, options: e.target.value})} placeholder="Örn: Katılıyorum, Katılmıyorum" style={{ minHeight: '100px', paddingTop: '16px' }} />
                                                </div>
                                            </div>
                                        )}
                                        <button type="submit" className="digital-btn" style={{ width: '100%', marginTop: '10px' }}>
                                            <Plus size={20} strokeWidth={3} /> SORUYU EKLE
                                        </button>
                                    </form>
                                </div>

                                {/* Questions List Column */}
                                <div>
                                    <h4 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: '900', color: '#fff' }}>Soru Akışı ({questions.length})</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {questions.map((q, i) => (
                                            <div key={i} style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '950', fontSize: '18px' }}>{i+1}</div>
                                                    <div>
                                                        <div style={{ fontSize: '17px', fontWeight: '700', color: '#fff' }}>{q.text}</div>
                                                        <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '900', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '1px' }}>{q.type}</div>
                                                    </div>
                                                </div>
                                                <button className="icon-btn danger" onClick={() => handleDeleteQuestion(q.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444' }}><Trash size={18} /></button>
                                            </div>
                                        ))}
                                        {questions.length === 0 && (
                                            <div style={{ textAlign: 'center', padding: '80px', background: 'rgba(255,255,255,0.02)', borderRadius: '32px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                                                <p style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Henüz bir soru tasarlanmadı.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Analysis & Results Modal - Upgraded */}
            {showResults && (
                <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="modal-content premium-modal" style={{ maxWidth: '1100px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '48px' }}>
                        <div className="modal-header" style={{ marginBottom: '40px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 10px #3b82f6' }} />
                                    <span style={{ color: '#3b82f6', fontSize: 11, fontWeight: 900, letterSpacing: 2 }}>DATA ANALYTICS</span>
                                </div>
                                <h2 style={{ fontSize: '36px', fontWeight: '950', color: '#fff', margin: 0, letterSpacing: -1 }}>Anket Veri Analizi</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
                                    <div style={{ background: '#3b82f6', color: '#fff', padding: '4px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: '900' }}>{results?.totalResponses} KATILIM</div>
                                    <p style={{ margin: 0, fontSize: '16px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{activeSurvey?.title}</p>
                                </div>
                            </div>
                            <button className="icon-btn" onClick={() => setShowResults(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}><X size={24} /></button>
                        </div>

                        {results?.totalResponses === 0 ? (
                            <div style={{ textAlign: 'center', padding: '120px', background: 'rgba(0,0,0,0.2)', borderRadius: '40px' }}>
                                <CircleAlert size={64} color="rgba(255,255,255,0.1)" style={{ marginBottom: '24px' }} />
                                <p style={{ fontSize: '20px', color: '#94a3b8', fontWeight: '800' }}>Analiz için yeterli veri yok.</p>
                                <p style={{ color: '#64748b', fontSize: '15px', marginTop: '8px' }}>Katılımlar başladığında istatistiksel raporlar burada oluşacaktır.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                                {results?.questions.map(q => (
                                    <div key={q.id} style={{ padding: '40px', background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '32px' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '32px' }}>
                                            <div style={{ background: '#3b82f6', color: '#fff', padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '950' }}>SORU</div>
                                            <h4 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#fff', flex: 1 }}>{q.text}</h4>
                                        </div>
                                        
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '32px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                            {renderChart(q, results)}
                                        </div>
                                        
                                        <div style={{ marginTop: '40px' }}>
                                            <div style={{ fontSize: '11px', fontWeight: '900', color: '#10b981', marginBottom: '16px', letterSpacing: 2 }}>KATILIMCI YANITLARI AKTARIMI</div>
                                            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '12px' }}>
                                                {results.answers.filter(a => a.questionId === q.id).map((a, i) => (
                                                    <div key={i} style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', fontSize: '14px', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.03)' }}>
                                                        {a.value}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
