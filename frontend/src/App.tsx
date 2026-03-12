import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard.tsx';
import NetworkMap from './pages/NetworkMap.tsx';
import CascadeAnalysis from './pages/CascadeAnalysis.tsx';
import ScenarioSimulator from './pages/ScenarioSimulator.tsx';
import AIInsights from './pages/AIInsights.tsx';
import InfrastructureManager from './pages/InfrastructureManager.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import EmergencyResponse from './pages/EmergencyResponse.tsx';
import CitizenDashboard from './pages/CitizenDashboard.tsx';
import ResilienceHeatmap from './pages/ResilienceHeatmap.tsx';
import PredictiveAnalytics from './pages/PredictiveAnalytics.tsx';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-950 text-gray-400">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function OfficialRoute({ children }: { children: React.ReactNode }) {
  const { isOfficial, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-950 text-gray-400">Loading...</div>;
  if (!isOfficial) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="network" element={<NetworkMap />} />
          <Route path="cascade" element={<CascadeAnalysis />} />
          <Route path="simulator" element={<ScenarioSimulator />} />
          <Route path="ai" element={<AIInsights />} />
          <Route path="emergency" element={<EmergencyResponse />} />
          <Route path="citizen" element={<CitizenDashboard />} />
          <Route path="heatmap" element={<ResilienceHeatmap />} />
          <Route path="predictive" element={<OfficialRoute><PredictiveAnalytics /></OfficialRoute>} />
          <Route path="manage" element={<OfficialRoute><InfrastructureManager /></OfficialRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
