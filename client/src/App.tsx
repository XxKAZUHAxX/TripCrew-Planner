import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import NavBar from './components/NavBar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import TripsList from './pages/TripsList';
import TripDashboard from './pages/TripDashboard';
import Join from './pages/Join';
import VotePage from './pages/VotePage';
import AvailabilityPage from './pages/AvailabilityPage';
import WheelPage from './pages/WheelPage';
import PlaybookPage from './pages/PlaybookPage';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <NavBar />
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/trips"
                        element={
                            <ProtectedRoute>
                                <TripsList />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/join/:inviteCode"
                        element={
                            <ProtectedRoute>
                                <Join />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/trips/:tripId"
                        element={
                            <ProtectedRoute>
                                <TripDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/trips/:tripId/vote"
                        element={
                            <ProtectedRoute>
                                <VotePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/trips/:tripId/availability"
                        element={
                            <ProtectedRoute>
                                <AvailabilityPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/trips/:tripId/wheel"
                        element={
                            <ProtectedRoute>
                                <WheelPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/trips/:tripId/playbook"
                        element={
                            <ProtectedRoute>
                                <PlaybookPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
