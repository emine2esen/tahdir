import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Catalog from './pages/Catalog';
import Quiz from './pages/Quiz';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminConcours from './pages/admin/AdminConcours';
import AdminProfils from './pages/admin/AdminProfils';
import AdminQcms from './pages/admin/AdminQcms';
import AdminQuestions from './pages/admin/AdminQuestions';
import AdminCodes from './pages/admin/AdminCodes';
import { getCandidateToken, getAdminToken } from './api';

function CandidateGuard({ children }) {
  if (!getCandidateToken()) return <Navigate to="/connexion" replace />;
  return children;
}

function AdminGuard({ children }) {
  if (!getAdminToken()) return <Navigate to="/admin" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/connexion" element={<Login />} />
        <Route
          path="/catalogue"
          element={
            <CandidateGuard>
              <Catalog />
            </CandidateGuard>
          }
        />
        <Route
          path="/qcm/:id"
          element={
            <CandidateGuard>
              <Quiz />
            </CandidateGuard>
          }
        />

        <Route path="/admin" element={<AdminLogin />} />
        <Route
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/concours" element={<AdminConcours />} />
          <Route path="/admin/profils" element={<AdminProfils />} />
          <Route path="/admin/qcms" element={<AdminQcms />} />
          <Route path="/admin/questions" element={<AdminQuestions />} />
          <Route path="/admin/codes" element={<AdminCodes />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
