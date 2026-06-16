import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import AuthLayout from '../layouts/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import passwordRecoveryService from '../services/passwordRecoveryService';

const ForgotPassword = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const onSubmit = async (data) => {
    setCargando(true);
    try {
      await passwordRecoveryService.forgotPassword(data.email);
      setEnviado(true);
      toast.success('Si el correo está registrado, recibirás un enlace en breve.');
    } catch (error) {
      toast.error(error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <AuthLayout>
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
        <p className="font-body-md text-body-md text-on-surface-variant">
          Ingrese su correo electrónico para recibir un enlace de recuperación
        </p>
      </header>

      {!enviado ? (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-stack-md w-full">
          <div>
            <Input
              id="email"
              type="email"
              label="Correo electrónico"
              icon="mail"
              placeholder="ejemplo@empresa.com"
              {...register('email', { 
                required: 'El correo es obligatorio',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Ingresa un correo electrónico válido'
                }
              })}
            />
            {errors.email && <span className="text-error text-xs mt-1 block font-medium">{errors.email.message}</span>}
          </div>

          <Button type="submit" disabled={cargando}>
            {cargando ? 'Enviando...' : 'Enviar enlace'}
            {!cargando && <span className="material-symbols-outlined text-[18px]">send</span>}
          </Button>
        </form>
      ) : (
        <div className="flex flex-col items-center text-center gap-stack-md py-4">
          <div className="w-16 h-16 bg-primary-fixed-dim/20 rounded-full flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-primary-container text-[32px]">check_circle</span>
          </div>
          <p className="font-body-md text-on-surface">
            Hemos enviado las instrucciones a tu correo electrónico. Por favor, revisa tu bandeja de entrada.
          </p>
        </div>
      )}

      <footer className="flex justify-center mt-stack-sm pt-stack-md border-t border-surface-variant w-full">
        <Link
          to="/login"
          className="flex items-center gap-1 font-body-sm text-body-sm text-primary-container font-medium hover:underline transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Volver al inicio de sesión
        </Link>
      </footer>
    </AuthLayout>
  );
};

export default ForgotPassword;
