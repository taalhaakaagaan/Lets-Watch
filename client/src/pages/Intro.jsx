import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Intro.css';

const Intro = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const videoRef = useRef(null);
    const [videoError, setVideoError] = useState(false);



    const finishIntro = () => {
        sessionStorage.setItem('letswatch_intro_shown', 'true');

        // Decide where to go next
        const isProfileComplete = localStorage.getItem('letswatch_profile_complete') === 'true';
        if (isProfileComplete) {
            navigate('/dashboard');
        } else {
            navigate('/onboarding');
        }
    };

    useEffect(() => {
        // Auto-finish after 5 seconds if no video or error
        if (videoError) {
            const timer = setTimeout(finishIntro, 5000);
            return () => clearTimeout(timer);
        }
    }, [videoError]);

    return (
        <div className="intro-container">
            {!videoError ? (
                <video
                    ref={videoRef}
                    className="intro-video"
                    autoPlay
                    muted
                    playsInline
                    onEnded={finishIntro}
                    onError={() => setVideoError(true)}
                >
                    <source src="./assets/intro.mp4" type="video/mp4" />
                    {/* Fallback if src fails locally or relative path issue */}
                </video>
            ) : (
                <div className="placeholder-animation">
                    <h1 className="logo-glow">LET'S WATCH</h1>
                    <p className="loading-text">{t('intro.loading')}</p>
                </div>
            )}

            <button className="skip-button" onClick={finishIntro}>
                {t('intro.skip')}
            </button>
        </div>
    );
};

export default Intro;
