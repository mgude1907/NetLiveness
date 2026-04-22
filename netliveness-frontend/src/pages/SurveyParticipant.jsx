import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSurveyFull, submitSurvey } from '../api';
import { ClipboardList, Send, CircleCheck, TriangleAlert, ArrowLeft, ChevronRight, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SurveyParticipant() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [answers, setAnswers] = useState({});
    const [participantName, setParticipantName] = useState('');

    const load = useCallback(async () => {
        try {
            const res = await getSurveyFull(id);
            const survey = res.survey || res.Survey;
            const questions = res.questions || res.Questions;
            
            setData({ survey, questions });
            
            // Initialize answers
            const initial = {};
            questions.forEach(q => {
                if (q.type === 'checkbox') initial[q.id] = [];
                else initial[q.id] = '';
            });
            setAnswers(initial);
        } catch {
            toast.error('Anket yüklenemedi.');
            navigate('/rehber');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => { load(); }, [load]);

    const handleAnswer = (qid, val, type) => {
        if (type === 'checkbox') {
            const current = answers[qid] || [];
            if (current.includes(val)) {
                setAnswers({ ...answers, [qid]: current.filter(v => v !== val) });
            } else {
                setAnswers({ ...answers, [qid]: [...current, val] });
            }
        } else {
            setAnswers({ ...answers, [qid]: val });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic validation: ensure all questions are answered
        const missing = data.questions.some(q => {
            const ans = answers[q.id];
            return !ans || (Array.isArray(ans) && ans.length === 0);
        });

        if (missing) {
            toast.error('Lütfen tüm soruları yanıtlayın.');
            return;
        }

        setSubmitting(true);
        try {
            const formattedAnswers = Object.keys(answers).map(qid => ({
                questionId: parseInt(qid),
                value: Array.isArray(answers[qid]) ? JSON.stringify(answers[qid]) : answers[qid]
            }));

            await submitSurvey(id, {
                participantName: participantName || 'Anonim',
                answers: formattedAnswers
            });

            setSubmitted(true);
            toast.success('Anket başarıyla gönderildi.');
        } catch {
            toast.error('Gönderim sırasında bir hata oluştu.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '20px', color: '#EAB308', letterSpacing: '2px', fontSize: '12px' }}>ANKET YÜKLENİYOR...</p>
        </div>
    );

    if (submitted) return (
        <div style={{ 
            minHeight: '100vh', 
            background: '#000', 
            backgroundImage: 'url(/bg-login-2.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1 }}></div>
            <div className="glass-card animate-fade-in" style={{ 
                maxWidth: '500px', 
                width: '100%', 
                padding: '40px', 
                textAlign: 'center',
                position: 'relative',
                zIndex: 2,
                borderRadius: '32px'
            }}>
                <div style={{ 
                    width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981',
                    margin: '0 auto 24px'
                }}>
                    <CircleCheck size={48} />
                </div>
                <h2 style={{ fontSize: '28px', color: '#fff', marginBottom: '12px' }}>Teşekkür Ederiz!</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '32px', lineHeight: '1.6' }}>
                    Katılımınız bizim için çok değerli. Görüşleriniz sistemlerimizi iyileştirmek için kullanılacaktır.
                </p>
                <button 
                    onClick={() => navigate('/rehber')}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '14px', borderRadius: '16px' }}
                >
                    Rehbere Geri Dön
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: 'var(--bg-app)', 
            backgroundImage: 'url(/bg-login-2.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            padding: '60px 20px',
            fontFamily: 'Inter, sans-serif',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 100%)', zIndex: 1 }}></div>
            
            <div style={{ maxWidth: '800px', width: '100%', position: 'relative', zIndex: 2 }}>
                
                {/* Survey Header */}
                <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button 
                        onClick={() => navigate('/anketler')}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600' }}
                    >
                        <ArrowLeft size={16} /> Vazgeç
                    </button>
                    <div style={{ color: '#EAB308', fontWeight: 'bold', letterSpacing: '2px', fontSize: '11px', textTransform: 'uppercase' }}>KURUMSAL GERİ BİLDİRİM</div>
                </div>

                <div className="glass-card" style={{ padding: '0', borderRadius: '32px', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-card)', backdropFilter: 'blur(30px)', boxShadow: '0 30px 100px rgba(0,0,0,0.5)' }}>
                    {/* Progress visual */}
                    <div style={{ height: '6px', width: '100%', background: 'var(--border-color)' }}>
                        <div style={{ height: '100%', width: '100%', background: 'var(--accent-green)', transition: 'width 0.5s' }}></div>
                    </div>

                    <div style={{ padding: '48px' }}>
                        <div style={{ marginBottom: '48px' }}>
                            <div style={{ display: 'inline-flex', padding: '14px', background: 'var(--accent-green-dim)', borderRadius: '16px', color: 'var(--accent-green)', marginBottom: '24px' }}>
                                <ClipboardList size={36} />
                            </div>
                            <h1 style={{ fontSize: '36px', fontWeight: '900', color: 'var(--text-primary)', margin: '0 0 16px 0', lineHeight: '1.2' }}>{data?.survey?.title}</h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '17px', lineHeight: '1.6', margin: 0 }}>{data?.survey?.description}</p>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                            
                            {/* Optional Name */}
                            <div className="survey-question-block">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>
                                    <User size={20} style={{ color: 'var(--accent-green)' }} /> Adınız Soyadınız (Opsiyonel)
                                </label>
                                <input 
                                    type="text" 
                                    className="form-input premium-input" 
                                    value={participantName} 
                                    onChange={e => setParticipantName(e.target.value)}
                                    placeholder="Gizli kalmasını isterseniz boş bırakabilirsiniz."
                                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '18px', color: 'var(--text-primary)', fontSize: '16px' }}
                                />
                            </div>

                            {/* Questions */}
                            {data?.questions?.map((q, idx) => (
                                <div key={q.id} className="survey-question-block" style={{ paddingTop: '40px', borderTop: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
                                        <div style={{ minWidth: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-green-dim)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '16px' }}>{idx + 1}</div>
                                        <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, lineHeight: '1.4' }}>{q.text}</h3>
                                    </div>

                                    {/* Text Type */}
                                    {q.type === 'text' && (
                                        <textarea 
                                            className="form-input premium-input" 
                                            value={answers[q.id] || ''} 
                                            onChange={e => handleAnswer(q.id, e.target.value, 'text')}
                                            required
                                            placeholder="Görüşünüzü detaylandırın..."
                                            style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '18px', minHeight: '120px', color: 'var(--text-primary)', fontSize: '16px' }}
                                        />
                                    )}

                                    {/* Radio/Checkbox Types */}
                                    {(q.type === 'radio' || q.type === 'checkbox') && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                            {q.options.split(',').map((opt, i) => {
                                                const val = opt.trim();
                                                const isSelected = q.type === 'checkbox' ? (answers[q.id] || []).includes(val) : answers[q.id] === val;
                                                return (
                                                    <div 
                                                        key={i} 
                                                        onClick={() => handleAnswer(q.id, val, q.type)}
                                                        style={{ 
                                                            padding: '20px 24px', 
                                                            background: isSelected ? 'var(--accent-green-dim)' : 'var(--bg-input)',
                                                            border: '2px solid',
                                                            borderColor: isSelected ? 'var(--accent-green)' : 'var(--border-color)',
                                                            borderRadius: '16px',
                                                            color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '16px',
                                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            fontWeight: isSelected ? '700' : '500'
                                                        }}
                                                        onMouseOver={e => !isSelected && (e.currentTarget.style.borderColor = 'var(--accent-green-dim)')}
                                                        onMouseOut={e => !isSelected && (e.currentTarget.style.borderColor = 'var(--border-color)')}
                                                    >
                                                        <div style={{ 
                                                            width: '24px', height: '24px', 
                                                            borderRadius: q.type === 'checkbox' ? '6px' : '50%', 
                                                            border: '2px solid',
                                                            borderColor: isSelected ? 'var(--accent-green)' : 'var(--text-muted)',
                                                            padding: '4px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            background: isSelected ? 'var(--accent-green)' : 'transparent',
                                                            transition: 'all 0.2s'
                                                        }}>
                                                            {isSelected && <div style={{ width: '100%', height: '100%', background: '#fff', borderRadius: q.type === 'checkbox' ? '2px' : '50%' }}></div>}
                                                        </div>
                                                        {val}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}

                            <button 
                                type="submit" 
                                disabled={submitting}
                                className="btn btn-primary"
                                style={{ 
                                    marginTop: '20px', padding: '20px', fontSize: '20px', fontWeight: '900',
                                    borderRadius: '24px', width: '100%', boxShadow: '0 15px 40px var(--accent-green-dim)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
                                }}
                            >
                                {submitting ? 'Gönderiliyor...' : <><Send size={24} /> Anketi Tamamla</>}
                            </button>

                        </form>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '60px', color: 'rgba(255,255,255,0.4)', fontSize: '13px', letterSpacing: '2px', fontWeight: 'bold' }}>
                    REPKON DİJİTAL SİSTEMLER — KURUMSAL GERİ BİLDİRİM AĞI
                </div>
            </div>
        </div>
    );
}
