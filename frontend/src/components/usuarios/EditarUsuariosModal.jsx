import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

const EditarUsuariosModal = ({ isOpen, onClose, usuario, onSubmit }) => {
  const isEditing = !!usuario;
  
  const { register, handleSubmit, reset, watch, resetField, formState: { errors } } = useForm({
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      confirmEmail: '',
      password: '',
      confirmPassword: '',
      rol: 'USER'
    }
  });

  const passwordValue = watch("password");

  const [editableFields, setEditableFields] = useState({
    nombre: true,
    apellido: true,
    email: true,
    rol: true
  });

  const toggleEdit = (field) => {
    setEditableFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const emailValue = watch("email");

  useEffect(() => {
    if (isOpen) {
      if (usuario) {
        reset({
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          confirmEmail: usuario.email,
          rol: usuario.rol,
          // password no se incluye en edición según las instrucciones
        });
        setEditableFields({ nombre: false, apellido: false, email: false, rol: false });
      } else {
        reset({
          nombre: '',
          apellido: '',
          email: '',
          confirmEmail: '',
          password: '',
          rol: 'USER'
        });
        setEditableFields({ nombre: true, apellido: true, email: true, rol: true });
        reset({
          nombre: '',
          apellido: '',
          email: '',
          confirmEmail: '',
          password: '',
          confirmPassword: '',
          rol: 'USER'
        });
      }
    }
  }, [isOpen, usuario, reset]);

  const handleFormSubmit = (data) => {
    onSubmit(data, isEditing);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditing ? "Editar Usuario" : "Crear Usuario"}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Input 
              label="Nombre" 
              id="nombre"
              disabled={!editableFields.nombre}
              rightElement={isEditing && (
                <button type="button" onClick={() => toggleEdit('nombre')} className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-1.5 rounded-full hover:bg-surface-variant/50" title={editableFields.nombre ? "Bloquear" : "Editar"}>
                  <span className="material-symbols-outlined text-[18px]">{editableFields.nombre ? 'close' : 'edit'}</span>
                </button>
              )}
              {...register('nombre', { required: 'El nombre es obligatorio' })}
            />
            {errors.nombre && <span className="text-error text-xs">{errors.nombre.message}</span>}
          </div>
          <div>
            <Input 
              label="Apellido" 
              id="apellido"
              disabled={!editableFields.apellido}
              rightElement={isEditing && (
                <button type="button" onClick={() => toggleEdit('apellido')} className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-1.5 rounded-full hover:bg-surface-variant/50" title={editableFields.apellido ? "Bloquear" : "Editar"}>
                  <span className="material-symbols-outlined text-[18px]">{editableFields.apellido ? 'close' : 'edit'}</span>
                </button>
              )}
              {...register('apellido', { required: 'El apellido es obligatorio' })}
            />
            {errors.apellido && <span className="text-error text-xs">{errors.apellido.message}</span>}
          </div>
        </div>

        <div className={`grid ${editableFields.email ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
          <div>
            <Input 
              label="Email" 
              id="email"
              type="email"
              disabled={!editableFields.email}
              rightElement={isEditing && (
                <button type="button" onClick={() => {
                  toggleEdit('email');
                  if (!editableFields.email) {
                    resetField('confirmEmail', { defaultValue: emailValue });
                  }
                }} className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-1.5 rounded-full hover:bg-surface-variant/50" title={editableFields.email ? "Bloquear" : "Editar"}>
                  <span className="material-symbols-outlined text-[18px]">{editableFields.email ? 'close' : 'edit'}</span>
                </button>
              )}
              {...register('email', { 
                required: 'El email es obligatorio',
                pattern: { value: /^\S+@\S+$/i, message: 'Formato inválido' }
              })}
            />
            {errors.email && <span className="text-error text-xs">{errors.email.message}</span>}
          </div>

          {editableFields.email && (
            <div>
              <Input 
                label="Confirmar Email" 
                id="confirm_email"
                type="email"
                {...register('confirmEmail', { 
                  required: 'Confirma el email',
                  validate: (value) => 
                    value === emailValue || 'Los correos no coinciden'
                })}
              />
              {errors.confirmEmail && <span className="text-error text-xs">{errors.confirmEmail.message}</span>}
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Input 
                label="Contraseña" 
                id="password"
                type="password"
                {...register('password', { 
                  required: 'La contraseña es obligatoria',
                  validate: {
                    length: (v) => v.length >= 8 || 'Mínimo 8 caracteres',
                    hasUpper: (v) => /[A-Z]/.test(v) || 'Debe tener una mayúscula',
                    hasNumber: (v) => /[0-9]/.test(v) || 'Debe tener un número',
                    hasSymbol: (v) => /[!@#$%^&*(),.?":{}|<>*\-_+=\[\]\\]/.test(v) || 'Debe tener un símbolo'
                  }
                })}
              />
              {errors.password && <span className="text-error text-xs">{errors.password.message}</span>}
            </div>
            <div>
              <Input 
                label="Confirmar Contraseña" 
                id="confirm_password"
                type="password"
                {...register('confirmPassword', { 
                  required: 'Confirma la contraseña',
                  validate: (value) => 
                    value === passwordValue || 'Las contraseñas no coinciden'
                })}
              />
              {errors.confirmPassword && <span className="text-error text-xs">{errors.confirmPassword.message}</span>}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-stack-sm">
          <label className="font-body-sm text-body-sm text-on-surface font-medium" htmlFor="rol">
            Rol
          </label>
          <div className="flex items-center gap-2">
            <select 
              id="rol"
              disabled={!editableFields.rol}
              className="w-full px-3 py-2 bg-surface-container-lowest border border-surface-variant rounded font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim transition-all disabled:opacity-70 disabled:bg-surface-variant/30 disabled:cursor-not-allowed"
              {...register('rol', { required: 'El rol es obligatorio' })}
            >
              <option value="USER">Usuario</option>
              <option value="ADMIN">Administrador</option>
            </select>
            {isEditing && (
              <button type="button" onClick={() => toggleEdit('rol')} className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-1.5 rounded-full hover:bg-surface-variant/50 flex-shrink-0" title={editableFields.rol ? "Bloquear" : "Editar"}>
                <span className="material-symbols-outlined text-[18px]">{editableFields.rol ? 'close' : 'edit'}</span>
              </button>
            )}
          </div>
          {errors.rol && <span className="text-error text-xs">{errors.rol.message}</span>}
        </div>

        <div className="pt-4 flex justify-end gap-3 mt-4 border-t border-surface-variant pt-5">
          <Button 
            variant="outline"
            onClick={onClose}
            className="w-auto"
          >
            Cancelar
          </Button>
          <Button type="submit" className="w-auto">
            {isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditarUsuariosModal;
