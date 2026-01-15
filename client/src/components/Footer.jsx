import React from 'react';
import { useTranslation } from 'react-i18next';
import './Footer.css';

const Footer = () => {
    const { t } = useTranslation();
    return (
        <footer className="app-footer">
            <div className="footer-content">
                <div className="footer-brand">Let's Watch 🎬</div>
                <div className="footer-links">
                    <a href="#">{t('footer.privacy', 'Privacy')}</a>
                    <a href="#">{t('footer.terms', 'Terms')}</a>
                    <a href="https://github.com/taalhaakaagaan" target="_blank" rel="noreferrer">GitHub</a>
                </div>
                <div className="footer-copyright">
                    &copy; 2026 Let's Watch P2P. Made with ❤️ by Gemini.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
