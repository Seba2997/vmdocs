import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Casos = lazy(() => import('./pages/Casos'));
const CasoDetalle = lazy(() => import('./pages/CasoDetalle'));
const Clientes = lazy(() => import('./pages/Clientes'));
const ClienteDetalle = lazy(() => import('./pages/ClienteDetalle'));
const Usuarios = lazy(() => import('./pages/Usuarios'));
const Documentos = lazy(() => import('./pages/Documentos'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
import PrivateRoute from './components/auth/PrivateRoute';
import DashboardLayout from './layouts/DashboardLayout';

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-surface-container-lowest">
    <span className="material-symbols-outlined animate-spin text-[40px] text-primary-container">progress_activity</span>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="bottom-center" autoClose={1000} theme="light" />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<PrivateRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/casos" element={<Casos />} />
              <Route path="/casos/:id" element={<CasoDetalle />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/clientes/:id" element={<ClienteDetalle />} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/documentos" element={<Documentos />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;