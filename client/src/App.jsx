import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import NavBar from './components/NavBar.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import TripsList from './pages/TripsList.jsx';
import TripDashboard from './pages/TripDashboard.jsx';
import Join from './pages/Join.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/trips" element={<ProtectedRoute><TripsList /></ProtectedRoute>} />
          <Route path="/join/:inviteCode" element={<ProtectedRoute><Join /></ProtectedRoute>} />
          <Route path="/trips/:tripId" element={<ProtectedRoute><TripDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
