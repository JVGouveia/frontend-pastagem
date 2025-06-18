import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import { ProdutorDashboard } from './components/ProdutorDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Cargo } from './contexts/AuthContext';
import NDVICreateMap from './components/NDVICreateMap';
import { ThemeProviderCustom } from './contexts/ThemeContext';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          user ? (
            user.cargo === Cargo.ADMIN ? (
              <AdminDashboard />
            ) : (
              <ProdutorDashboard />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/propriedade/:id/novo-mapa"
        element={user ? <NDVICreateMap /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProviderCustom>
          <AppRoutes />
        </ThemeProviderCustom>
      </AuthProvider>
    </Router>
  );
}
