import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import api from '../../services/api';
import { toast } from 'react-toastify';

const EditarPerfil = ({ isOpen, onClose, onProfileUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [perfilActual, setPerfilActual] = useState(null);
  const [editableFields, setEditableFields] = useState({
    nombre: false,
    apellido: false,
    email: false
  });

  const toggleEdit = (field) => {
    setEditableFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const { register, handleSubmit, reset, watch, resetField, formState: { errors } } = useForm({
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const newPasswordValue = watch("newPassword");
  const emailValue = watch("email");

  useEffect(() => {
    if (isOpen) {
      try {
        const perfilStr = localStorage.getItem('user_profile') || '{}';
        const perfil = JSON.parse(perfilStr);
        setPerfilActual(perfil);
        reset({
          nombre: perfil.nombre || '',
          apellido: perfil.apellido || '',
          email: perfil.email || '',
          confirmEmail: perfil.email || '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordSection(false);
        setEditableFields({
          nombre: false,
          apellido: false,
          email: false
        });
      } catch (e) {
        console.error("Error leyendo perfil:", e);
      }
    }
  }, [isOpen, reset]);

  const handleFormSubmit = async (data) => {
    if (!perfilActual || !perfilActual.id) return;
    setLoading(true);

    try {
      // 1. Actualizar datos básicos si cambiaron
      const hasBasicChanges = 
        data.nombre !== perfilActual.nombre || 
        data.apellido !== perfilActual.apellido || 
        data.email !== perfilActual.email;

      if (hasBasicChanges) {
        const updateResp = await api.patch(`/usuarios/editarusuario/${perfilActual.id}`, {
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email
        });
        
        // Actualizar almacenamiento local
        const nuevoPerfil = { ...perfilActual, ...updateResp.data };
        localStorage.setItem('user_profile', JSON.stringify(nuevoPerfil));
      }

      // 2. Actualizar contraseña si se solicitó
      if (showPasswordSection && data.newPassword) {
        await api.patch(`/usuarios/cambiarpassword/${perfilActual.id}`, {
          password: data.newPassword
        });
      }

      toast.success("Perfil actualizado correctamente");
      if (onProfileUpdated) onProfileUpdated();
      onClose();
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      toast.error(error.response?.data?.detail || "Error al actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Mi Perfil" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Input 
              label="Nombre" 
              id="perfil_nombre"
              disabled={!editableFields.nombre}
              rightElement={
                <button type="button" onClick={() => toggleEdit('nombre')} className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-1.5 rounded-full hover:bg-surface-variant/50" title={editableFields.nombre ? "Bloquear" : "Editar"}>
                  <span className="material-symbols-outlined text-[18px]">{editableFields.nombre ? 'close' : 'edit'}</span>
                </button>
              }
              {...register('nombre', { required: 'El nombre es obligatorio' })}
            />
            {errors.nombre && <span className="text-error text-xs mt-1 block">{errors.nombre.message}</span>}
          </div>
          <div>
            <Input 
              label="Apellido" 
              id="perfil_apellido"
              disabled={!editableFields.apellido}
              rightElement={
                <button type="button" onClick={() => toggleEdit('apellido')} className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-1.5 rounded-full hover:bg-surface-variant/50" title={editableFields.apellido ? "Bloquear" : "Editar"}>
                  <span className="material-symbols-outlined text-[18px]">{editableFields.apellido ? 'close' : 'edit'}</span>
                </button>
              }
              {...register('apellido', { required: 'El apellido es obligatorio' })}
            />
            {errors.apellido && <span className="text-error text-xs mt-1 block">{errors.apellido.message}</span>}
          </div>
        </div>

        <div className={`grid ${editableFields.email ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
          <div>
            <Input 
              label="Email" 
              id="perfil_email"
              type="email"
              disabled={!editableFields.email}
              rightElement={
                <button type="button" onClick={() => {
                  toggleEdit('email');
                  if (!editableFields.email) {
                    resetField('confirmEmail', { defaultValue: emailValue });
                  }
                }} className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-1.5 rounded-full hover:bg-surface-variant/50" title={editableFields.email ? "Bloquear" : "Editar"}>
                  <span className="material-symbols-outlined text-[18px]">{editableFields.email ? 'close' : 'edit'}</span>
                </button>
              }
              {...register('email', { 
                required: 'El email es obligatorio',
                pattern: { value: /^\S+@\S+$/i, message: 'Formato de email inválido' }
              })}
            />
            {errors.email && <span className="text-error text-xs mt-1 block">{errors.email.message}</span>}
          </div>

          {editableFields.email && (
            <div>
              <Input 
                label="Confirmar Email" 
                id="perfil_confirm_email"
                type="email"
                {...register('confirmEmail', { 
                  required: 'Confirma tu email',
                  validate: (value) => 
                    value === emailValue || 'Los correos no coinciden'
                })}
              />
              {errors.confirmEmail && <span className="text-error text-xs mt-1 block">{errors.confirmEmail.message}</span>}
            </div>
          )}
        </div>

        {/* Sección de Seguridad / Contraseña */}
        <div className="mt-6 pt-4 border-t border-surface-variant">
          {!showPasswordSection ? (
            <button
              type="button"
              onClick={() => setShowPasswordSection(true)}
              className="flex items-center gap-2 text-primary hover:text-primary-container transition-colors font-body-sm text-body-sm font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">lock_open</span>
              Cambiar contraseña (Opcional)
            </button>
          ) : (
            <div className="space-y-4 bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/50">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-title-sm text-title-sm flex items-center gap-2 text-on-surface">
                  <span className="material-symbols-outlined text-[18px] text-primary">lock</span>
                  Seguridad
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordSection(false);
                    reset((formValues) => ({
                      ...formValues,
                      newPassword: '',
                      confirmPassword: ''
                    }));
                  }}
                  className="text-on-surface-variant hover:text-error transition-colors font-body-sm text-body-sm flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                  Cancelar cambio
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Input 
                    label="Nueva Contraseña" 
                    id="perfil_new_password"
                    type="password"
                    {...register('newPassword', { 
                      required: showPasswordSection ? 'Debes ingresar una nueva contraseña' : false,
                      validate: {
                        length: (v) => !showPasswordSection || v.length >= 8 || 'Mínimo 8 caracteres',
                        hasUpper: (v) => !showPasswordSection || /[A-Z]/.test(v) || 'Debe tener una mayúscula',
                        hasNumber: (v) => !showPasswordSection || /[0-9]/.test(v) || 'Debe tener un número',
                        hasSymbol: (v) => !showPasswordSection || /[!@#$%^&*(),.?":{}|<>*\-_+=\[\]\\]/.test(v) || 'Debe tener un símbolo'
                      }
                    })}
                  />
                  {errors.newPassword && <span className="text-error text-xs mt-1 block">{errors.newPassword.message}</span>}
                </div>

                <div>
                  <Input 
                    label="Confirmar Nueva Contraseña" 
                    id="perfil_confirm_password"
                    type="password"
                    {...register('confirmPassword', { 
                      required: showPasswordSection ? 'Debes confirmar la contraseña' : false,
                      validate: (value) => 
                        !showPasswordSection || value === newPasswordValue || 'Las contraseñas no coinciden'
                    })}
                  />
                  {errors.confirmPassword && <span className="text-error text-xs mt-1 block">{errors.confirmPassword.message}</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 flex justify-end gap-3 mt-4 border-t border-surface-variant pt-5">
          <Button 
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="w-auto"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="w-auto">
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditarPerfil;
