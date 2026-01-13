import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import './Onboarding.css';
import { profanityFilter } from '../utils/profanity';

const GENRES = ["Action", "Sci-Fi", "Drama", "Comedy", "Horror", "Documentary", "Anime", "Romance", "Thriller"];
const SOURCES = ["Friend Recommendation", "Social Media", "Discovery Store", "Just Browsing"];
const BLACKLIST = ["Gore", "Erotic", "Political", "Religious", "Jump Scares"];

const Onboarding = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [step, setStep] = useState(1);

    // Form Data
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        age: '',
        apiKey: '',
        genres: [],
        isPremium: false,
        source: '',
        blacklist: []
    });

    const [verificationState, setVerificationState] = useState({
        isSent: false,
        isVerified: false,
        code: '',
        timer: 0,
        loading: false
    });

    useEffect(() => {
        let interval;
        if (verificationState.timer > 0) {
            interval = setInterval(() => {
                setVerificationState(prev => ({ ...prev, timer: prev.timer - 1 }));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [verificationState.timer]);

    const handleSendEmail = async () => {
        if (!formData.email.includes('@')) {
            alert("Please enter a valid email.");
            return;
        }
        setVerificationState(prev => ({ ...prev, loading: true }));
        try {
            await window.electronAPI.sendVerificationEmail(formData.email);
            setVerificationState(prev => ({ ...prev, isSent: true, timer: 30, loading: false }));
        } catch (error) {
            console.error(error);
            alert("Failed to send email.");
            setVerificationState(prev => ({ ...prev, loading: false }));
        }
    };

    const handleVerifyCode = async () => {
        setVerificationState(prev => ({ ...prev, loading: true }));
        try {
            const res = await window.electronAPI.verifyEmailCode({ email: formData.email, code: verificationState.code });
            if (res.success) {
                setVerificationState(prev => ({ ...prev, isVerified: true, loading: false }));
            } else {
                alert(res.error || "Invalid Code");
                setVerificationState(prev => ({ ...prev, loading: false }));
            }
        } catch (error) {
            console.error(error);
            setVerificationState(prev => ({ ...prev, loading: false }));
        }
    };

    const updateData = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const toggleArrayItem = (key, item) => {
        setFormData(prev => {
            const list = prev[key];
            if (list.includes(item)) {
                return { ...prev, [key]: list.filter(i => i !== item) };
            } else {
                return { ...prev, [key]: [...list, item] };
            }
        });
    };

    const isStepValid = () => {
        switch (step) {
            case 1:
                const isUsernameValid = formData.username.trim().length > 0 && !profanityFilter.isProfane(formData.username);
                const isEmailVerified = verificationState.isVerified;
                if (formData.username.trim().length > 0 && profanityFilter.isProfane(formData.username)) {
                    // Ideally show error message in UI, but button disable is basic check
                }
                return isUsernameValid && isEmailVerified;
            case 2: return formData.age && parseInt(formData.age) > 0; // Age required
            case 3: return true; // API Key Optional
            case 4: return formData.genres.length > 0; // At least 1 genre
            case 5: return true; // Defaults to false (No) if skipped, which is valid
            case 6: return !!formData.source; // Source required
            case 7: return true; // Blacklist Optional
            case 8: return true;
            default: return true;
        }
    };

    const nextStep = () => {
        if (isStepValid()) {
            if (step < 8) setStep(step + 1);
            else finishOnboarding();
        }
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const finishOnboarding = () => {
        // Save Everything
        localStorage.setItem('letswatch_profile_complete', 'true');
        localStorage.setItem('letswatch_username', formData.username);
        localStorage.setItem('letswatch_preferences', JSON.stringify(formData));

        // Navigate
        navigate('/dashboard');
    };

    const renderContent = () => {
        // ... (renderContent code remains mostly the same, but we don't need to change it here if we just wrap the button)
        // actually I need to replace the whole file or a large chunk to access renderContent if I was changing it, but I am not.
        // Wait, I need to make sure the Button uses isStepValid.
        return (
            <div className="onboarding-container fade-in">
                <div className="onboarding-card">
                    <div className="step-indicator">Step {step} of 8</div>

                    <div className="onboarding-content">
                        {renderContentBody()}
                    </div>

                    <div className="nav-buttons">
                        <button
                            className="btn-secondary"
                            onClick={prevStep}
                            style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
                        >
                            {t('onboarding.back')}
                        </button>
                        <button
                            className={`btn-primary ${!isStepValid() ? 'disabled' : ''}`}
                            onClick={nextStep}
                            disabled={!isStepValid()}
                        >
                            {step === 8 ? t('onboarding.start_watching') : t('onboarding.next')}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderContentBody = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <h1 className="onboarding-title">{t('onboarding.step1_title')}</h1>
                        <p className="onboarding-desc">{t('onboarding.step1_desc')}</p>
                        <div className="input-group">
                            <input
                                className="onboarding-input"
                                placeholder={t('onboarding.username_placeholder')}
                                value={formData.username}
                                onChange={e => updateData('username', e.target.value)}
                                autoFocus
                            />
                            {formData.username && profanityFilter.isProfane(formData.username) && (
                                <p style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '5px' }}>
                                    {t('onboarding.profanity_error')}
                                </p>
                            )}
                        </div>
                        <div className="input-group">
                            <input
                                className="onboarding-input"
                                placeholder={t('onboarding.email_placeholder')}
                                value={formData.email}
                                onChange={e => updateData('email', e.target.value)}
                                disabled={verificationState.isVerified}
                            />
                            {!verificationState.isVerified && (
                                <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                    {!verificationState.isSent ? (
                                        <button
                                            className="btn-secondary"
                                            onClick={handleSendEmail}
                                            disabled={!formData.email || verificationState.loading}
                                        >
                                            {verificationState.loading ? t('onboarding.sending') : t('onboarding.verify_email')}
                                        </button>
                                    ) : (
                                        <>
                                            <input
                                                className="onboarding-input"
                                                style={{ width: '100px', textAlign: 'center' }}
                                                placeholder="Code"
                                                value={verificationState.code}
                                                onChange={e => setVerificationState(prev => ({ ...prev, code: e.target.value }))}
                                            />
                                            <button
                                                className="btn-primary"
                                                onClick={handleVerifyCode}
                                                disabled={verificationState.loading}
                                            >
                                                {t('onboarding.submit')}
                                            </button>
                                            <button
                                                className="btn-secondary"
                                                onClick={handleSendEmail}
                                                disabled={verificationState.timer > 0 || verificationState.loading}
                                            >
                                                {verificationState.timer > 0 ? `${t('onboarding.resend')} (${verificationState.timer})` : t('onboarding.resend')}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                            {verificationState.isVerified && <p style={{ color: '#4ade80', marginTop: '5px' }}>{t('onboarding.verified')}</p>}
                        </div>
                    </>
                );
            case 2:
                return (
                    <>
                        <h1 className="onboarding-title">{t('onboarding.step2_title')}</h1>
                        <p className="onboarding-desc">{t('onboarding.step2_desc')}</p>
                        <div className="input-group">
                            <input
                                type="number"
                                className="onboarding-input"
                                placeholder={t('onboarding.age_placeholder')}
                                value={formData.age}
                                onChange={e => updateData('age', e.target.value)}
                                autoFocus
                            />
                        </div>
                    </>
                );
            case 3:
                return (
                    <>
                        <h1 className="onboarding-title">{t('onboarding.step3_title')}</h1>
                        <p className="onboarding-desc">{t('onboarding.step3_desc')}</p>
                        <div className="input-group">
                            <input
                                className="onboarding-input"
                                placeholder={t('onboarding.apikey_placeholder')}
                                value={formData.apiKey}
                                onChange={e => updateData('apiKey', e.target.value)}
                            />
                        </div>
                    </>
                );
            case 4:
                return (
                    <>
                        <h1 className="onboarding-title">{t('onboarding.step4_title')}</h1>
                        <p className="onboarding-desc">{t('onboarding.step4_desc')}</p>
                        <div className="genre-grid">
                            {GENRES.map(g => (
                                <div
                                    key={g}
                                    className={`genre-tag ${formData.genres.includes(g) ? 'selected' : ''}`}
                                    onClick={() => toggleArrayItem('genres', g)}
                                >
                                    {g}
                                </div>
                            ))}
                        </div>
                    </>
                );
            case 5:
                return (
                    <>
                        <h1 className="onboarding-title">{t('onboarding.step5_title')}</h1>
                        <p className="onboarding-desc">{t('onboarding.step5_desc')}</p>
                        <div className="input-group" style={{ textAlign: 'center' }}>
                            <button
                                className={`btn-primary ${formData.isPremium ? '' : 'btn-secondary'}`}
                                style={{ width: '100%', marginBottom: '10px' }}
                                onClick={() => updateData('isPremium', true)}
                            >
                                {t('onboarding.premium_yes')}
                            </button>
                            <button
                                className={`btn-secondary`}
                                onClick={() => updateData('isPremium', false)}
                            >
                                {t('onboarding.premium_no')}
                            </button>
                        </div>
                    </>
                );
            case 6:
                return (
                    <>
                        <h1 className="onboarding-title">{t('onboarding.step6_title')}</h1>
                        <p className="onboarding-desc">{t('onboarding.step6_desc')}</p>
                        <div className="genre-grid">
                            {SOURCES.map(s => (
                                <div
                                    key={s}
                                    className={`genre-tag ${formData.source === s ? 'selected' : ''}`}
                                    onClick={() => updateData('source', s)}
                                >
                                    {s}
                                </div>
                            ))}
                        </div>
                    </>
                );
            case 7:
                return (
                    <>
                        <h1 className="onboarding-title">{t('onboarding.step7_title')}</h1>
                        <p className="onboarding-desc">{t('onboarding.step7_desc')}</p>
                        <div className="genre-grid">
                            {BLACKLIST.map(b => (
                                <div
                                    key={b}
                                    className={`genre-tag ${formData.blacklist.includes(b) ? 'selected' : ''}`}
                                    onClick={() => toggleArrayItem('blacklist', b)}
                                >
                                    {b}
                                </div>
                            ))}
                        </div>
                    </>
                );
            case 8:
                return (
                    <>
                        <h1 className="onboarding-title">{t('onboarding.step8_title')}</h1>
                        <p className="onboarding-desc">
                            <Trans i18nKey="onboarding.step8_desc" values={{ username: formData.username }}>
                                Welcome to the club, <span style={{ color: '#FF8E53' }}>{formData.username}</span>.<br /><br />
                                We've saved your preferences. You can always change them later in settings.
                            </Trans>
                        </p>
                    </>
                );
            default: return null;
        }
    };

    return renderContent();
};

export default Onboarding;
