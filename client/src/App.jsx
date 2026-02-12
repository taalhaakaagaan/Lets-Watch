import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateRoom from './pages/CreateRoom';
import Onboarding from './pages/Onboarding';
import Intro from './pages/Intro';
import Profile from './pages/Profile';
import Room from './pages/Room';
import ExtensionLanding from './pages/ExtensionLanding';

// Route Guard for Onboarding
const RootRoute = () => {
  const introShown = sessionStorage.getItem('letswatch_intro_shown') === 'true';
  const isProfileComplete = localStorage.getItem('letswatch_profile_complete') === 'true';

  // Ensure Stable Peer ID exists
  if (isProfileComplete && !localStorage.getItem('letswatch_peer_id')) {
    const username = localStorage.getItem('letswatch_username') || 'Guest';
    // Sanitize username
    const safeName = username.replace(/[^a-zA-Z0-9]/g, '');
    const randomStr = Math.random().toString(36).substr(2, 4);
    const stableId = `${safeName}-${randomStr}`;
    localStorage.setItem('letswatch_peer_id', stableId);
  }

  if (!introShown) {
    return <Navigate to="/intro" />;
  }

  return isProfileComplete ? <Navigate to="/dashboard" /> : <Navigate to="/onboarding" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/intro" element={<Intro />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-room" element={<CreateRoom />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/extension" element={<ExtensionLanding />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
