import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import AuthLayout from '../layouts/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import passwordRecoveryService from '../services/passwordRecoveryService';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  
  const [cargando, setCargando] = useState(false);
  const [verificandoToken, setVerificandoToken] = useState(true);
  const [tokenInfo, setTokenInfo] = useState(null);

  const password = watch('password');

  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!token) {
        setVerificandoToken(false);
        return;
      }
      try {
        const info = await passwordRecoveryService.getTokenInfo(token);
        setTokenInfo(info);
      } catch (error) {
        // En caso de error de red u otro, asumimos inválido para prevenir errores en UI
        setTokenInfo({ status: 'invalid' });
      } finally {
        setVerificandoToken(false);
      }
    };

    fetchTokenInfo();
  }, [token]);

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Token inválido o ausente.');
      return;
    }

    setCargando(true);
    try {
      await passwordRecoveryService.resetPassword(token, data.password, data.confirmPassword);
      toast.success('¡Contraseña restablecida con éxito!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      // El backend ahora envía 410 si expiró durante el envío
      toast.error(error);
    } finally {
      setCargando(false);
    }
  };

  if (verificandoToken) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <div className="w-12 h-12 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
          <p className="text-on-surface-variant animate-pulse font-body-md">Verificando enlace seguro...</p>
        </div>
      </AuthLayout>
    );
  }

  if (!token || !tokenInfo || tokenInfo.status === 'invalid' || tokenInfo.status === 'used') {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center text-center gap-stack-md py-8">
          <span className="material-symbols-outlined text-error text-[48px]">error</span>
          <h1 className="font-display-md text-display-md text-on-surface">Enlace inválido o utilizado</h1>
          <p className="font-body-md text-on-surface-variant">
            Este enlace de recuperación no es válido, ha expirado o ya fue utilizado para cambiar tu contraseña.
          </p>
          <Link to="/forgot-password" title="Solicitar nuevo enlace">
            <Button variant="secondary">Solicitar nuevo enlace</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (tokenInfo.status === 'expired') {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center text-center gap-stack-md py-8">
          <span className="material-symbols-outlined text-warning text-[48px]">timer_off</span>
          <h1 className="font-display-md text-display-md text-on-surface">Enlace expirado</h1>
          <p className="font-body-md text-on-surface-variant">
            Tu enlace para cambiar la contraseña ha expirado por razones de seguridad (validez de 5 minutos).
            {tokenInfo.nombre && `\nHola ${tokenInfo.nombre}, solicita uno nuevo para continuar.`}
          </p>
          <Link to="/forgot-password" title="Reenviar enlace">
            <Button variant="primary">Reenviar enlace de recuperación</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // Si llegamos aquí, status === 'valid'
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
        
        {tokenInfo.nombre && tokenInfo.email ? (
          <div className="bg-primary-fixed-dim/20 rounded-lg p-4 mt-2 mb-4 border border-primary-container/20 w-full text-left">
            <p className="font-body-md text-on-surface mb-2">
              Hola, <span className="font-bold">{tokenInfo.nombre}</span>
            </p>
            <p className="font-body-sm text-on-surface-variant mb-2">
              Hemos verificado su solicitud de recuperación de contraseña para:<br/>
              <span className="font-medium text-primary-container">{tokenInfo.email}</span>
            </p>
            <p className="font-body-sm text-on-surface mt-3">
              Ingrese una nueva contraseña para continuar.
            </p>
          </div>
        ) : (
          <p className="font-body-md text-body-md text-on-surface-variant mb-4">
            Establezca aquí su nueva contraseña de acceso
          </p>
        )}
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-stack-md w-full">
        <div>
          <Input
            id="password"
            type="password"
            label="Nueva contraseña"
            icon="lock"
            placeholder="••••••••"
            {...register('password', { 
              required: 'La contraseña es obligatoria',
              minLength: {
                value: 8,
                message: 'La contraseña debe tener al menos 8 caracteres'
              },
              validate: {
                hasUppercase: v => /[A-Z]/.test(v) || 'Debe contener al menos una mayúscula',
                hasNumber: v => /[0-9]/.test(v) || 'Debe contener al menos un número',
                hasSymbol: v => /[!@#$%^&*(),.?":{}|<>*\-_+=\[\]\\]/.test(v) || 'Debe contener al menos un símbolo especial'
              }
            })}
          />
          {errors.password && <span className="text-error text-xs mt-1 block font-medium">{errors.password.message}</span>}
        </div>

        <div>
          <Input
            id="confirmPassword"
            type="password"
            label="Confirmar contraseña"
            icon="lock_reset"
            placeholder="••••••••"
            {...register('confirmPassword', { 
              required: 'Debes confirmar la contraseña',
              validate: value => value === password || 'Las contraseñas no coinciden'
            })}
          />
          {errors.confirmPassword && <span className="text-error text-xs mt-1 block font-medium">{errors.confirmPassword.message}</span>}
        </div>

        <Button type="submit" disabled={cargando}>
          {cargando ? 'Restableciendo...' : 'Cambiar contraseña'}
          {!cargando && <span className="material-symbols-outlined text-[18px]">save</span>}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
