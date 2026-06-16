import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import Input from '../ui/Input';
import Button from '../ui/Button';

const LoginForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { iniciarSesion, cargando, error: authError } = useAuth();

  const onSubmit = async (data) => {
    const exito = await iniciarSesion(data.email, data.password);
    if (exito) {
      toast.success('¡Bienvenido a VMDocs!');
    }
  };

  // Effect to show errors from useAuth
  React.useEffect(() => {
    if (authError) {
      toast.error(authError);
    }
  }, [authError]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-stack-md w-full" noValidate>
      <div>
        <Input
          id="email"
          type="email"
          label="email"
          icon="mail"
          placeholder="ejemplo@empresa.com"
          {...register('email', { 
            required: 'El correo es obligatorio',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Ingresa un correo electrónico válido (ej: nombre@dominio.com)'
            }
          })}
        />
        {errors.email && <span className="text-error text-xs mt-1 block font-medium">{errors.email.message}</span>}
      </div>

      <div>
        <Input
          id="password"
          type="password"
          label="contraseña"
          icon="lock"
          placeholder="••••••••"
          className="mt-base"
          {...register('password', { 
            required: 'La contraseña es obligatoria',
            minLength: {
              value: 8,
              message: 'La contraseña debe tener al menos 8 caracteres'
            }
          })}
        />
        {errors.password && <span className="text-error text-xs mt-1 block font-medium">{errors.password.message}</span>}
      </div>

      <Button type="submit" disabled={cargando} className={cargando ? 'opacity-70 cursor-not-allowed' : ''}>
        {cargando ? 'Iniciando...' : 'Iniciar sesión'}
        {!cargando && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
      </Button>
    </form>
  );
};

export default LoginForm;
