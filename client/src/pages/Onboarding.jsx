import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Onboarding.css';

const GENRES = ["Action", "Sci-Fi", "Drama", "Comedy", "Horror", "Documentary", "Anime", "Romance", "Thriller"];
const SOURCES = ["Friend Recommendation", "Social Media", "Discovery Store", "Just Browsing"];
const BLACKLIST = ["Gore", "Erotic", "Political", "Religious", "Jump Scares"];

const Onboarding = () => {
    const navigate = useNavigate();
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
            case 1: return formData.username.trim().length > 0; // Username required
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
                            Back
                        </button>
                        <button
                            className={`btn-primary ${!isStepValid() ? 'disabled' : ''}`}
                            onClick={nextStep}
                            disabled={!isStepValid()}
                        >
                            {step === 8 ? "Start Watching" : "Next"}
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
                        <h1 className="onboarding-title">Hello, Stranger! 👋</h1>
                        <p className="onboarding-desc">Let's get to know each other. What should we call you?</p>
                        <div className="input-group">
                            <input
                                className="onboarding-input"
                                placeholder="Username (e.g. CaptainAwesome)"
                                value={formData.username}
                                onChange={e => updateData('username', e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="input-group">
                            <input
                                className="onboarding-input"
                                placeholder="Email Address (Optional)"
                                value={formData.email}
                                onChange={e => updateData('email', e.target.value)}
                            />
                        </div>
                    </>
                );
            case 2:
                return (
                    <>
                        <h1 className="onboarding-title">Just checking... 🎂</h1>
                        <p className="onboarding-desc">How old are you? We curate content based on age appropriateness.</p>
                        <div className="input-group">
                            <input
                                type="number"
                                className="onboarding-input"
                                placeholder="Age"
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
                        <h1 className="onboarding-title">Unlock AI Magic 🤖</h1>
                        <p className="onboarding-desc">If you have a Gemini API Key, enter it here to enable AI subtitles and recommendations. You can skip this!</p>
                        <div className="input-group">
                            <input
                                className="onboarding-input"
                                placeholder="Gemini API Key (starts with AIza...)"
                                value={formData.apiKey}
                                onChange={e => updateData('apiKey', e.target.value)}
                            />
                        </div>
                    </>
                );
            case 4:
                return (
                    <>
                        <h1 className="onboarding-title">Pick your Vibe 🍿</h1>
                        <p className="onboarding-desc">Select the genres you love. We'll prioritize these.</p>
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
                        <h1 className="onboarding-title">Go Premium? 💎</h1>
                        <p className="onboarding-desc">Support us and get 4K streaming and zero ads.</p>
                        <div className="input-group" style={{ textAlign: 'center' }}>
                            <button
                                className={`btn-primary ${formData.isPremium ? '' : 'btn-secondary'}`}
                                style={{ width: '100%', marginBottom: '10px' }}
                                onClick={() => updateData('isPremium', true)}
                            >
                                Yes! Take my money! ($0.00 today)
                            </button>
                            <button
                                className={`btn-secondary`}
                                onClick={() => updateData('isPremium', false)}
                            >
                                No thanks, I'm broke.
                            </button>
                        </div>
                    </>
                );
            case 6:
                return (
                    <>
                        <h1 className="onboarding-title">Small world! 🌍</h1>
                        <p className="onboarding-desc">How did you stumble upon our little cinema?</p>
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
                        <h1 className="onboarding-title">Red Lines 🚫</h1>
                        <p className="onboarding-desc">Select content types you absolutely NEVER want to see.</p>
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
                        <h1 className="onboarding-title">You're All Set! 🎉</h1>
                        <p className="onboarding-desc">
                            Welcome to the club, <span style={{ color: '#FF8E53' }}>{formData.username}</span>.
                            <br /><br />
                            We've saved your preferences. You can always change them later in settings.
                        </p>
                    </>
                );
            default: return null;
        }
    };

    return renderContent();
};

export default Onboarding;
