import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import './Onboarding.css';
import { profanityFilter } from '../utils/profanity';
import { EUROPE_DATA } from '../utils/europeData';
import { GeminiService } from '../services/GeminiService';

const GENRES = ["Action", "Sci-Fi", "Drama", "Comedy", "Horror", "Romance", "Thriller", "Anime"];
const BLACKLIST = ["Gore", "Erotic", "Political", "Religious", "Jump Scares"];

const Onboarding = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [step, setStep] = useState(1);

    // Complex state for branching logic
    const [flowType, setFlowType] = useState('STANDARD'); // STANDARD, DATE_MODE

    // Form Data
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        country: '',
        city: '',
        purpose: '',
        apiKey: '',
        gender: '',
        socialHandle: '',
        genres: [],
        blacklist: [],
        bio: '',
        photo: null, // Just a placeholder for now
        wantAiPartner: false
    });

    const [verificationState, setVerificationState] = useState({
        isSent: false,
        isVerified: false,
        code: '',
        timer: 0,
        loading: false
    });

    const [apiValidation, setApiValidation] = useState({
        isValidating: false,
        isValid: false,
        error: null
    });

    const [isGeneratingAi, setIsGeneratingAi] = useState(false);

    // ... (Timer, handlers like before)



    // Verification Timer
    useEffect(() => {
        let interval;
        if (verificationState.timer > 0) {
            interval = setInterval(() => {
                setVerificationState(prev => ({ ...prev, timer: prev.timer - 1 }));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [verificationState.timer]);

    // Handlers
    const handleSendEmail = async () => {
        if (!formData.email.includes('@')) {
            alert("Please enter a valid email.");
            return;
        }
        setVerificationState(prev => ({ ...prev, loading: true }));

        try {
            if (window.electronAPI) {
                const res = await window.electronAPI.sendVerificationEmail(formData.email);
                if (res.success) {
                    setVerificationState(prev => ({ ...prev, isSent: true, timer: 30, loading: false })); // Timeout set to 30s
                } else {
                    alert("Failed to send email: " + (res.error || "Unknown error"));
                    setVerificationState(prev => ({ ...prev, loading: false }));
                }
            } else {
                // Browser Dev Fallback
                console.log("Mock Email Sent (Browser Mode)");
                setTimeout(() => {
                    setVerificationState(prev => ({ ...prev, isSent: true, timer: 30, loading: false }));
                }, 1000);
            }
        } catch (e) {
            console.error(e);
            alert("Error sending email.");
            setVerificationState(prev => ({ ...prev, loading: false }));
        }
    };

    const handleVerifyCode = async () => {
        setVerificationState(prev => ({ ...prev, loading: true }));

        try {
            if (window.electronAPI) {
                const res = await window.electronAPI.verifyEmailCode({ email: formData.email, code: verificationState.code });
                if (res.success) {
                    setVerificationState(prev => ({ ...prev, isVerified: true, loading: false }));
                } else {
                    alert(res.error || "Invalid Code");
                    setVerificationState(prev => ({ ...prev, loading: false }));
                }
            } else {
                // Browser Dev Fallback
                if (verificationState.code === '123456') {
                    setVerificationState(prev => ({ ...prev, isVerified: true, loading: false }));
                } else {
                    alert("Invalid Code (Try 123456)");
                    setVerificationState(prev => ({ ...prev, loading: false }));
                }
            }
        } catch (e) {
            console.error(e);
            setVerificationState(prev => ({ ...prev, loading: false }));
        }
    };

    const validateApiKey = async (key) => {
        if (!key) return;
        setApiValidation({ isValidating: true, isValid: false, error: null });
        // Simulate Gemini API Validation
        setTimeout(() => {
            if (key.startsWith('AIza')) {
                setApiValidation({ isValidating: false, isValid: true, error: null });
            } else {
                setApiValidation({ isValidating: false, isValid: false, error: 'Invalid Key Format' });
            }
        }, 1500);
    };

    const updateData = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const toggleArrayItem = (key, item) => {
        setFormData(prev => {
            const list = prev[key];
            return list.includes(item) ? { ...prev, [key]: list.filter(i => i !== item) } : { ...prev, [key]: [...list, item] };
        });
    };

    // Flow Logic
    const calculateNextStep = () => {
        // Step 1: Language -> 2
        if (step === 1) return 2;
        // Step 2: Identity -> 3
        if (step === 2) return 3;
        // Step 3: Purpose -> 4 (API Key) - Common for all
        if (step === 3) {
            return 4;
        }
        // Step 4: API Key -> Branching
        if (step === 4) {
            if (formData.purpose === t('onboarding.purpose_a')) {
                return 5; // Date flow
            } else if (formData.purpose === t('onboarding.purpose_b')) {
                return 12; // Group flow (Group Size)
            } else if (formData.purpose === t('onboarding.purpose_c')) {
                return 13; // Stream flow (Vibe)
            }
            return 100;
        }

        // DATE MODE STEPS (5-11)
        if (step === 5) return 6; // Gender -> Social
        if (step === 6) return 7; // Social -> Genres
        if (step === 9) return 10; // Bio -> Photo
        if (step === 10) return 11; // Photo -> AI Partner
        if (step === 11) return 100; // Finish

        // Helper to determine next step after blacklist based on purpose
        const getNextFromBlacklist = () => {
            if (formData.purpose === t('onboarding.purpose_a')) return 9; // Bio for Date flow

            // For B and C, we now go to AI Partner (Step 11) instead of finish
            // But we need to skip Bio/Photo (9,10)
            return 11;
        };

        // Shared steps
        if (step === 12) return 7; // Group Size -> Genres
        if (step === 13) return 7; // Stream Vibe -> Genres

        if (step === 7) return 8; // Genres -> Blacklist (Always)
        if (step === 8) return getNextFromBlacklist(); // Blacklist -> Branch

        // Date Flow: 8 -> 9 -> 10 -> 11
        if (step === 9) return 10; // Bio -> Photo
        if (step === 10) return 11; // Photo -> AI Partner

        // AI Partner Logic (Step 11)
        if (step === 11) {
            // If YES to AI, check API Key
            if (formData.wantAiPartner) {
                if (!formData.apiKey || formData.apiKey.length < 5) {
                    alert("You need a Gemini API Key for the AI Partner!");
                    return 4; // Redirect to API Key Step
                }
            }
            return 100; // Finish
        }

        return 100;
    };

    const nextStep = () => {
        const next = calculateNextStep();
        if (next === 100) finishOnboarding();
        else setStep(next);
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1); // Logic could be better for branching but simple -1 works if sequential
    };

    const finishOnboarding = async () => {
        if (formData.wantAiPartner && formData.apiKey) {
            setIsGeneratingAi(true);
            try {
                const service = new GeminiService(formData.apiKey);
                const persona = await service.generatePersona(formData.gender, formData.country, i18n.language, formData.purpose.includes("Date") ? "Date" : "Friend");
                localStorage.setItem('letswatch_ai_persona', JSON.stringify(persona));
            } catch (e) {
                console.error("AI Gen Error", e);
            }
        }

        localStorage.setItem('letswatch_profile_complete', 'true');
        localStorage.setItem('letswatch_username', formData.username);
        const preferences = {
            ...formData,
            location: { country: formData.country, city: formData.city }
        };
        localStorage.setItem('letswatch_preferences', JSON.stringify(preferences));

        // CRITICAL FIX: Save avatar separately for Profile to find it
        if (formData.photo) {
            try {
                localStorage.setItem('letswatch_avatar', formData.photo);
            } catch (e) {
                console.error("Avatar save failed quota", e);
            }
        }

        setIsGeneratingAi(false);
        navigate('/dashboard');
    };

    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
        setStep(2);
    };

    // Render Steps
    const renderStep1 = () => (
        <div className="step-container fade-in">
            <h1 className="onboarding-title">{t('onboarding.step1_title')}</h1>
            <div className="language-grid">
                <button onClick={() => changeLanguage('en')} className="lang-btn">🇺🇸 English</button>
                <button onClick={() => changeLanguage('tr')} className="lang-btn">🇹🇷 Türkçe</button>
                <button onClick={() => changeLanguage('de')} className="lang-btn">🇩🇪 Deutsch</button>
                <button onClick={() => changeLanguage('fr')} className="lang-btn">🇫🇷 Français</button>
                <button onClick={() => changeLanguage('es')} className="lang-btn">🇪🇸 Español</button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="step-container fade-in">
            <h1 className="onboarding-title">{t('onboarding.step2_title')}</h1>
            <p className="onboarding-desc-why">{t('onboarding.step2_desc')}</p>
            <input className="onboarding-input" placeholder={t('onboarding.username_placeholder')} value={formData.username} onChange={e => updateData('username', e.target.value)} />
            <div className="input-group email-group" style={{ marginTop: '15px' }}>
                <input className="onboarding-input" placeholder={t('onboarding.email_placeholder')} value={formData.email} onChange={e => updateData('email', e.target.value)} disabled={verificationState.isVerified} />
                {!verificationState.isVerified && <button className="verify-btn" onClick={handleSendEmail} disabled={!formData.email}>{verificationState.loading ? t('onboarding.sending') : t('onboarding.verify_email')}</button>}
            </div>
            {verificationState.isSent && !verificationState.isVerified && (
                <div className="input-group verify-code-group">
                    <input className="onboarding-input" placeholder="123456" value={verificationState.code} onChange={e => setVerificationState(prev => ({ ...prev, code: e.target.value }))} />
                    <button className="verify-btn primary" onClick={handleVerifyCode}>{t('onboarding.submit')}</button>
                </div>
            )}
            <div className="input-row" style={{ marginTop: '15px' }}>
                <select className="onboarding-select" value={formData.country} onChange={e => updateData('country', e.target.value)}>
                    <option value="">{t('onboarding.country_placeholder')}</option>
                    {Object.keys(EUROPE_DATA).sort().map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="onboarding-select" value={formData.city} onChange={e => updateData('city', e.target.value)} disabled={!formData.country}>
                    <option value="">{t('onboarding.city_placeholder')}</option>
                    {formData.country && EUROPE_DATA[formData.country].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="step-container fade-in">
            <h1 className="onboarding-title">{t('onboarding.step3_title')}</h1>
            <p className="onboarding-desc-why">{t('onboarding.step3_desc')}</p>
            <div className="purpose-grid">
                {[
                    { id: 'A', title: t('onboarding.purpose_a'), desc: t('onboarding.purpose_a_desc'), icon: '❤️' },
                    { id: 'B', title: t('onboarding.purpose_b'), desc: t('onboarding.purpose_b_desc'), icon: '🍿' },
                    { id: 'C', title: t('onboarding.purpose_c'), desc: t('onboarding.purpose_c_desc'), icon: '📡' }
                ].map(item => (
                    <div key={item.id} className={`purpose-card ${formData.purpose === item.title ? 'selected' : ''}`} onClick={() => updateData('purpose', item.title)}>
                        <div className="purpose-icon">{item.icon}</div>
                        <h3>{item.title}</h3>
                        <p>{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="step-container fade-in">
            <h1 className="onboarding-title">{t('onboarding.step4_api_title')}</h1>
            <p className="onboarding-desc-why">{t('onboarding.step4_api_desc')}</p>
            <input
                className={`onboarding-input ${apiValidation.isValid ? 'valid' : ''} ${apiValidation.error ? 'invalid' : ''}`}
                placeholder={t('onboarding.apikey_placeholder')}
                value={formData.apiKey}
                onChange={e => {
                    updateData('apiKey', e.target.value);
                    if (e.target.value.length > 20) validateApiKey(e.target.value);
                }}
            />
            <p className="gemini-decoration" style={{ fontSize: '0.8rem', marginTop: '10px' }}>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#FF8E53', textDecoration: 'underline' }}>
                    Get your Free Gemini API Key here
                </a>
            </p>
            {apiValidation.isValidating && <p className="status-text">{t('onboarding.validating')}</p>}
            {apiValidation.isValid && <p className="status-text success">{t('onboarding.key_valid')} ✓</p>}
            {apiValidation.error && <p className="status-text error">{t('onboarding.key_invalid')}</p>}
        </div>
    );

    // DATE MODE STEPS
    const renderStep5 = () => ( // Gender
        <div className="step-container fade-in">
            <h1 className="onboarding-title">{t('onboarding.gender_title')}</h1>
            <p className="onboarding-desc-why">{t('onboarding.gender_desc')}</p>
            <div className="config-grid">
                {['male', 'female'].map(g => (
                    <div key={g} className={`config-card ${formData.gender === g ? 'selected' : ''}`} onClick={() => updateData('gender', g)}>
                        {t(`onboarding.${g}`)}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderStep6 = () => ( // Social
        <div className="step-container fade-in">
            <h1 className="onboarding-title">{t('onboarding.social_title')}</h1>
            <p className="onboarding-desc-why">{t('onboarding.social_desc')}</p>
            <input className="onboarding-input" placeholder={t('onboarding.social_placeholder')} value={formData.socialHandle} onChange={e => updateData('socialHandle', e.target.value)} />
        </div>
    );

    const renderStep7 = () => ( // Genres
        <div className="step-container fade-in">
            <h1 className="onboarding-title">{t('onboarding.genres_title')}</h1>
            <div className="genre-grid">
                {GENRES.map(g => (
                    <div key={g} className={`genre-tag ${formData.genres.includes(g) ? 'selected' : ''}`} onClick={() => toggleArrayItem('genres', g)}>{g}</div>
                ))}
            </div>
        </div>
    );

    const renderStep8 = () => ( // Blacklist
        <div className="step-container fade-in">
            <h1 className="onboarding-title">{t('onboarding.blacklist_title')}</h1>
            <div className="genre-grid">
                {BLACKLIST.map(b => (
                    <div key={b} className={`genre-tag ${formData.blacklist.includes(b) ? 'selected' : ''}`} onClick={() => toggleArrayItem('blacklist', b)}>{b}</div>
                ))}
            </div>
        </div>
    );

    const renderStep9 = () => ( // Bio
        <div className="step-container fade-in">
            <h1 className="onboarding-title">{t('onboarding.bio_title')}</h1>
            <textarea className="onboarding-input textarea" placeholder={t('onboarding.bio_placeholder')} value={formData.bio} onChange={e => updateData('bio', e.target.value)} />
        </div>
    );

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateData('photo', reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const renderStep10 = () => ( // Photo
        <div className="step-container fade-in">
            <h1 className="onboarding-title">{t('onboarding.photo_title')}</h1>
            <p className="onboarding-desc-why">{t('onboarding.photo_desc')}</p>

            <div className="photo-upload-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <div className="photo-preview" style={{
                    width: '120px', height: '120px', borderRadius: '50%',
                    background: formData.photo ? `url(${formData.photo}) center/cover` : 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    {!formData.photo && <span style={{ fontSize: '2rem' }}>📷</span>}
                </div>

                <label className="nav-btn primary" style={{ cursor: 'pointer', display: 'inline-block', textAlign: 'center', paddingTop: '10px' }}>
                    {formData.photo ? 'Change Photo' : t('onboarding.photo_btn')}
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </label>
            </div>
        </div>
    );

    const renderStep11 = () => ( // AI Partner
        <div className="step-container fade-in">
            <h1 className="onboarding-title">{t('onboarding.ai_partner_title')}</h1>
            <p className="onboarding-desc-why">{t('onboarding.ai_partner_desc')}</p>
            <div className="config-grid">
                <div className={`config-card ${formData.wantAiPartner === true ? 'selected' : ''}`} onClick={() => updateData('wantAiPartner', true)}>{t('onboarding.ai_yes')}</div>
                <div className={`config-card ${formData.wantAiPartner === false ? 'selected' : ''}`} onClick={() => updateData('wantAiPartner', false)}>{t('onboarding.ai_no')}</div>
            </div>
        </div>
    );

    const renderStep12 = () => ( // Group Size
        <div className="step-container fade-in">
            <h1 className="onboarding-title">{t('onboarding.group_size_title')}</h1>
            <p className="onboarding-desc-why">{t('onboarding.group_size_desc')}</p>
            <div className="config-grid">
                <div className={`config-card ${formData.groupSize === 'small' ? 'selected' : ''}`} onClick={() => updateData('groupSize', 'small')}>{t('onboarding.group_small')}</div>
                <div className={`config-card ${formData.groupSize === 'large' ? 'selected' : ''}`} onClick={() => updateData('groupSize', 'large')}>{t('onboarding.group_large')}</div>
            </div>
        </div>
    );

    const renderStep13 = () => ( // Stream Vibe
        <div className="step-container fade-in">
            <h1 className="onboarding-title">{t('onboarding.stream_vibe_title')}</h1>
            <p className="onboarding-desc-why">{t('onboarding.stream_vibe_desc')}</p>
            <div className="config-grid">
                <div className={`config-card ${formData.streamVibe === 'chill' ? 'selected' : ''}`} onClick={() => updateData('streamVibe', 'chill')}>{t('onboarding.stream_chill')}</div>
                <div className={`config-card ${formData.streamVibe === 'hype' ? 'selected' : ''}`} onClick={() => updateData('streamVibe', 'hype')}>{t('onboarding.stream_hype')}</div>
            </div>
        </div>
    );

    const isNextEnabled = () => {
        if (step === 2) return formData.username && verificationState.isVerified && formData.country && formData.city;
        if (step === 3) return !!formData.purpose;
        if (step === 5) return !!formData.gender;
        if (step === 12) return !!formData.groupSize;
        if (step === 13) return !!formData.streamVibe;
        return true;
    };

    return (
        <div className="onboarding-container">
            {isGeneratingAi && (
                <div className="loading-overlay" style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.9)', zIndex: 100, display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center', color: 'white'
                }}>
                    <div className="decoration-blob blob-1" style={{ width: 200, height: 200, animationDuration: '2s' }}></div>
                    <h2 style={{ zIndex: 2 }}>Crafting your perfect Partner... 🤖❤️</h2>
                    <p style={{ zIndex: 2, color: '#aaa' }}>Asking Gemini to bring them to life...</p>
                </div>
            )}
            <div className="decoration-blob blob-1"></div>
            <div className="decoration-blob blob-2"></div>
            <div className="onboarding-card glass">
                {step > 1 && <div className="step-indicator">Step {step}</div>}
                <div className="content-area">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderStep4()}
                    {/* Date Branch */}
                    {step === 5 && renderStep5()}
                    {step === 6 && renderStep6()}
                    {step === 7 && renderStep7()}
                    {step === 8 && renderStep8()}
                    {step === 9 && renderStep9()}
                    {step === 10 && renderStep10()}
                    {step === 11 && renderStep11()}
                    {/* Group/Stream Branch */}
                    {step === 12 && renderStep12()}
                    {step === 13 && renderStep13()}
                </div>
                <div className="nav-buttons">
                    {step > 1 && <button className="nav-btn secondary" onClick={prevStep}>{t('onboarding.back')}</button>}
                    {step > 1 && <button className={`nav-btn primary ${!isNextEnabled() ? 'disabled' : ''}`} onClick={nextStep} disabled={!isNextEnabled()}>{isGeneratingAi ? '...' : t('onboarding.next')}</button>}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
