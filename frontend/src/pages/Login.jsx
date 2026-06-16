import React from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import LoginForm from '../components/auth/LoginForm';

const Login = () => {
  return (
    <AuthLayout>
      {/* Header / Brand */}
      <header className="flex flex-col items-center text-center gap-stack-sm mb-base">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="material-symbols-outlined text-primary-container text-[36px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            description
          </span>
          <h1 className="font-display-lg text-display-lg text-primary-container tracking-tighter leading-none">
            VMDocs
          </h1>
        </div>
      </header>


      {/* Login Form Component */}
      <LoginForm />

      {/* Footer / Links */}
      <footer className="flex justify-center mt-stack-sm pt-stack-md border-t border-surface-variant w-full">
        <Link
          to="/forgot-password"
          className="font-body-sm text-body-sm text-primary-container font-medium hover:underline opacity-90 hover:opacity-100 transition-opacity"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </footer>
    </AuthLayout>
  );
};

export default Login;
