import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateRoom from './pages/CreateRoom';
import Onboarding from './pages/Onboarding';
import Intro from './pages/Intro';
import Room from './pages/Room';

// Route Guard for Onboarding
const RootRoute = () => {
  const introShown = sessionStorage.getItem('letswatch_intro_shown') === 'true';
  const isProfileComplete = localStorage.getItem('letswatch_profile_complete') === 'true';

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
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
