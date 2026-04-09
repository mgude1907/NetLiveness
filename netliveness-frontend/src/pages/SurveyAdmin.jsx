import React, { useState, useEffect } from 'react';
import { getAdminSurveys, createSurvey, updateSurvey, deleteSurvey, getSurveyQuestions, addSurveyQuestion, updateSurveyQuestion, deleteSurveyQuestion, getSurveyResults } from '../api';
import { ClipboardList, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, CircleCheck, CircleAlert, X, List, BarChart2, Save, MoreVertical, Trash } from 'lucide-react';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

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
        } catch (e) {
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
                toast.success('Anket oluşturuldu.');
            }
            setShowModal(false);
            setEditItem(null);
            setForm({ title: '', description: '', isActive: true });
            loadSurveys();
        } catch (e) {
            toast.error('İşlem başarısız oldu.');
        }
    };

    const handleToggle = async (survey) => {
        try {
            await updateSurvey(survey.id, { ...survey, isActive: !survey.isActive });
            toast.success(survey.isActive ? 'Anket yayından kaldırıldı.' : 'Anket yayına alındı.');
            loadSurveys();
        } catch (e) {
            toast.error('Durum güncellenemedi.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu anketi silmek istediğinize emin misiniz?')) return;
        try {
            await deleteSurvey(id);
            toast.success('Anket silindi.');
            loadSurveys();
        } catch (e) {
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
        } catch (e) {
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
        } catch (e) {
            toast.error('Soru eklenemedi.');
        }
    };

    const handleDeleteQuestion = async (qid) => {
        try {
            await deleteSurveyQuestion(qid);
            setQuestions(questions.filter(q => q.id !== qid));
            toast.success('Soru silindi.');
        } catch (e) {
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
        } catch (e) {
            toast.error('Sonuçlar yüklenemedi.');
        }
    };

    const renderChart = (question, results) => {
        if (question.type === 'text') return <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Metin soruları için grafik gösterilemez. Cevapları aşağıda görebilirsiniz.</p>;
        
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
            <div style={{ height: '200px', marginTop: '10px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '10px' }} />
                        <Tooltip 
                            contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                        />
                        <Bar dataKey="value" fill="var(--accent-blue)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    };

    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

    return (
        <div className="page-container animate-fade-in">
            <style>{`
                .premium-modal {
                    background: var(--bg-card);
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--border-color);
                    border-radius: 24px;
                    box-shadow: 0 40px 100px rgba(0,0,0,0.5);
                }
                .premium-input {
                    background: var(--bg-input) !important;
                    border: 1px solid var(--border-color) !important;
                    border-radius: 12px !important;
                    padding: 12px 16px !important;
                    color: var(--text-primary) !important;
                    transition: all 0.3s ease;
                }
                .premium-input:focus {
                    border-color: var(--accent-green) !important;
                    box-shadow: 0 0 10px var(--accent-green-dim) !important;
                }
                .survey-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 20px;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }
                .survey-card:hover {
                    transform: translateY(-5px);
                    border-color: var(--accent-green);
                    box-shadow: 0 12px 30px rgba(0,0,0,0.2);
                }
                .survey-card-header {
                    background: var(--bg-secondary);
                    padding: 24px;
                    border-bottom: 1px solid var(--border-color);
                }
            `}</style>

            <div className="page-header" style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="header-icon" style={{ background: 'var(--accent-green-dim)', color: 'var(--accent-green)' }}>
                        <ClipboardList size={28} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '26px', fontWeight: '900', color: 'var(--text-primary)' }}>İç Anket Merkezi</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Kurumsal geri bildirim döngüsünü buradan yönetin.</p>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm({ title: '', description: '', isActive: true }); setShowModal(true); }}>
                    <Plus size={20} /> Yeni Anket Oluştur
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
                {surveys.map(s => (
                    <div key={s.id} className="survey-card animate-scale-in">
                        <div className="survey-card-header">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div className={`status-badge ${s.isActive ? 'success' : 'neutral'}`} style={{ fontSize: '10px', fontWeight: '800' }}>
                                    {s.isActive ? '• YAYINDA AKTİF' : '• TASLAK PASİF'}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="icon-btn" onClick={() => openEdit(s)}><Edit2 size={16} /></button>
                                    <button className="icon-btn danger" onClick={() => handleDelete(s.id)}><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, lineHeight: '1.3' }}>{s.title}</h3>
                        </div>
                        
                        <div style={{ padding: '24px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>ANKET AÇIKLAMASI</div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px 0', minHeight: '44px' }}>
                                {s.description || 'Bu anket için detaylı bir açıklama belirtilmedi.'}
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <button className="btn btn-ghost" onClick={() => openQuestions(s)} style={{ fontSize: '13px' }}>
                                    <List size={18} /> Sorular
                                </button>
                                <button className="btn btn-ghost" onClick={() => openResults(s)} style={{ fontSize: '13px', color: 'var(--accent-blue)', borderColor: 'var(--accent-blue-dim)' }}>
                                    <BarChart2 size={18} /> Analiz
                                </button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                    {new Date(s.createdAt).toLocaleDateString()}
                                </div>
                                <button 
                                    onClick={() => handleToggle(s)}
                                    style={{
                                        background: 'transparent', border: 'none', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px',
                                        color: s.isActive ? 'var(--accent-green)' : 'var(--text-muted)'
                                    }}
                                >
                                    {s.isActive ? <><ToggleRight size={22} /> Yayında</> : <><ToggleLeft size={22} /> Yayına Al</>}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* General Settings Modal */}
            {showModal && (
                <div className="modal-overlay" style={{ backdropFilter: 'blur(10px)' }}>
                    <div className="modal-content premium-modal" style={{ maxWidth: '600px', padding: '40px' }}>
                        <div className="modal-header" style={{ marginBottom: '30px' }}>
                            <div>
                                <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', margin: 0 }}>{editItem ? 'Anketi Güncelle' : 'Anket Oluştur'}</h2>
                                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>Lütfen anketin temel bilgilerini doldurun.</p>
                            </div>
                            <button className="icon-btn" onClick={() => setShowModal(false)} style={{ background: 'var(--bg-secondary)' }}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label style={{ color: 'var(--accent-green)', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '10px', display: 'block' }}>ANKET BAŞLIĞI</label>
                                <input type="text" className="form-input premium-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="Anket ismini girin..." />
                            </div>
                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label style={{ color: 'var(--accent-green)', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '10px', display: 'block' }}>AÇIKLAMA (ÇALIŞANLAR İÇİN)</label>
                                <textarea className="form-input premium-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Anketin amacını açıklayın." style={{ minHeight: '120px' }} />
                            </div>
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                                <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} id="isActive" style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                                <label htmlFor="isActive" style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-secondary)', cursor: 'pointer' }}>Bu anketi hemen tüm çalışanlara aç</label>
                            </div>
                            <div className="modal-footer" style={{ marginTop: '40px', display: 'flex', gap: '12px' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>İptal</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '14px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold' }}>
                                    {editItem ? 'Değişiklikleri Kaydet' : 'Anketi Başlat'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Questions Management Modal */}
            {showQuestions && (
                <div className="modal-overlay" style={{ backdropFilter: 'blur(10px)' }}>
                    <div className="modal-content premium-modal" style={{ maxWidth: '1000px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '40px' }}>
                        <div className="modal-header" style={{ marginBottom: '30px' }}>
                            <div>
                                <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', margin: 0 }}>Soru Yönetim Merkezi</h2>
                                <p style={{ margin: '4px 0 0 0', color: 'var(--accent-green)', fontSize: '14px', fontWeight: 'bold' }}>ANKET: {activeSurvey?.title}</p>
                            </div>
                            <button className="icon-btn" onClick={() => setShowQuestions(false)} style={{ background: 'var(--bg-secondary)' }}><X size={24} /></button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '40px' }}>
                            {/* Add Question Column */}
                            <div>
                                <h4 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: '900', color: 'var(--text-primary)' }}>Yeni Soru Oluştur</h4>
                                <form onSubmit={handleAddQuestion} className="glass-card" style={{ padding: '24px', background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>SORU METNİ</label>
                                        <input type="text" className="form-input premium-input" value={newQuestion.text} onChange={e => setNewQuestion({...newQuestion, text: e.target.value})} required placeholder="Soru cümlesini girin..." />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>YANIT TİPİ</label>
                                        <select className="form-input premium-input" value={newQuestion.type} onChange={e => setNewQuestion({...newQuestion, type: e.target.value})} style={{ width: '100%' }}>
                                            <option value="text">Kısa Cevap (Serbest Metin)</option>
                                            <option value="radio">Tek Seçenekli (Radio)</option>
                                            <option value="checkbox">Çoklu Seçenekli (Checkbox)</option>
                                        </select>
                                    </div>
                                    {(newQuestion.type === 'radio' || newQuestion.type === 'checkbox') && (
                                        <div className="form-group">
                                            <label style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>SEÇENEKLER (VİRGÜLLE AYIRIN)</label>
                                            <textarea className="form-input premium-input" value={newQuestion.options} onChange={e => setNewQuestion({...newQuestion, options: e.target.value})} placeholder="Örn: Katılıyorum, Katılmıyorum" style={{ minHeight: '80px' }} />
                                        </div>
                                    )}
                                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '30px', padding: '14px', borderRadius: '12px', fontWeight: 'bold' }}>
                                        <Plus size={18} /> Soru Listesine Ekle
                                    </button>
                                </form>
                            </div>

                            {/* Questions List Column */}
                            <div>
                                <h4 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: '900', color: 'var(--text-primary)' }}>Mevcut Soru Akışı ({questions.length})</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {questions.map((q, i) => (
                                        <div key={i} className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--accent-green-dim)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '16px' }}>{i+1}</div>
                                                <div>
                                                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{q.text}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '1px' }}>{q.type}</div>
                                                </div>
                                            </div>
                                            <button className="icon-btn danger" onClick={() => handleDeleteQuestion(q.id)} style={{ background: 'var(--accent-red-dim)' }}><Trash size={16} /></button>
                                        </div>
                                    ))}
                                    {questions.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '60px', background: 'var(--bg-input)', borderRadius: '24px', border: '1px dashed var(--border-color)' }}>
                                            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Henüz bir soru eklemediniz.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Analysis & Results Modal */}
            {showResults && (
                <div className="modal-overlay" style={{ backdropFilter: 'blur(10px)' }}>
                    <div className="modal-content premium-modal" style={{ maxWidth: '1000px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '40px' }}>
                        <div className="modal-header" style={{ marginBottom: '30px' }}>
                            <div>
                                <h2 style={{ fontSize: '26px', fontWeight: '900', color: 'var(--text-primary)', margin: 0 }}>Anket Veri Analizi</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                                    <div style={{ background: 'var(--accent-blue)', color: '#fff', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '900' }}>{results?.totalResponses} KATILIM</div>
                                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>{activeSurvey?.title}</p>
                                </div>
                            </div>
                            <button className="icon-btn" onClick={() => setShowResults(false)} style={{ background: 'var(--bg-secondary)' }}><X size={24} /></button>
                        </div>

                        {results?.totalResponses === 0 ? (
                            <div style={{ textAlign: 'center', padding: '100px', background: 'var(--bg-input)', borderRadius: '32px' }}>
                                <CircleAlert size={64} color="var(--text-muted)" style={{ marginBottom: '20px' }} />
                                <p style={{ fontSize: '18px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Henüz veri toplanmamış.</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px', opacity: 0.5 }}>Anket katılımları başladığında grafikler burada oluşacaktır.</p>
                            </div>
                        ) : (
                            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                {results?.questions.map(q => (
                                    <div key={q.id} className="glass-card" style={{ padding: '32px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
                                            <div style={{ background: 'var(--accent-blue)', color: '#fff', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>SORU</div>
                                            <h4 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', flex: 1 }}>{q.text}</h4>
                                        </div>
                                        
                                        <div style={{ background: 'var(--bg-input)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                                            {renderChart(q, results)}
                                        </div>
                                        
                                        <div style={{ marginTop: '30px' }}>
                                            <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--accent-green)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>HAM YANIT LİSTESİ</div>
                                            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '10px' }}>
                                                {results.answers.filter(a => a.questionId === q.id).map((a, i) => (
                                                    <div key={i} style={{ padding: '12px 16px', background: 'var(--bg-input)', borderRadius: '12px', fontSize: '14px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
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
