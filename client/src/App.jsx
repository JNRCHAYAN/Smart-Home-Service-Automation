import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout.jsx';
import { useAuth } from './store/authStore.js';

import Landing from './pages/customer/Landing.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import NewRequest from './pages/customer/NewRequest.jsx';
import MatchResults from './pages/customer/MatchResults.jsx';
import TrackRequest from './pages/customer/TrackRequest.jsx';
import MyRequests from './pages/customer/MyRequests.jsx';
import ProviderDashboard from './pages/provider/ProviderDashboard.jsx';
import ProviderSchedule from './pages/provider/ProviderSchedule.jsx';

function Guard({ role, children }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/new-request"
          element={
            <Guard>
              <NewRequest />
            </Guard>
          }
        />
        <Route
          path="/request/:id/matches"
          element={
            <Guard>
              <MatchResults />
            </Guard>
          }
        />
        <Route
          path="/request/:id/track"
          element={
            <Guard>
              <TrackRequest />
            </Guard>
          }
        />
        <Route
          path="/my-requests"
          element={
            <Guard>
              <MyRequests />
            </Guard>
          }
        />

        <Route
          path="/provider"
          element={
            <Guard role="provider">
              <ProviderDashboard />
            </Guard>
          }
        />
        <Route
          path="/provider/schedule"
          element={
            <Guard role="provider">
              <ProviderSchedule />
            </Guard>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
