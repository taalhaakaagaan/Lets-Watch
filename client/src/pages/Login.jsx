import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!username.trim()) return;

        // Mock Auth: Store username and redirect
        localStorage.setItem('letswatch_username', username);
        navigate('/dashboard');
    };

    return (
        <div className="login-container">
            <div className="login-card fade-in">
                <h1 className="logo">Let's Watch</h1>
                <p className="subtitle">
                    {isRegister ? "Create your account" : "Welcome back"}
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="login-input"
                            autoFocus
                        />
                    </div>

                    <button type="submit" className="login-button">
                        {isRegister ? "Register" : "Login"}
                    </button>
                </form>

                <p className="switch-mode" onClick={() => setIsRegister(!isRegister)}>
                    {isRegister
                        ? "Already have an account? Login"
                        : "New here? Register"}
                </p>
            </div>
        </div>
    );
};

export default Login;
