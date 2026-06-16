import React, { forwardRef } from 'react';

const Input = forwardRef(({ label, icon, rightElement, id, type = 'text', className = '', ...props }, ref) => {
  return (
    <div className={`flex flex-col gap-stack-sm ${className}`}>
      {label && (
        <label className="font-body-sm text-body-sm text-on-surface font-medium" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">
            {icon}
          </span>
        )}
        <input
          id={id}
          ref={ref}
          type={type}
          className={`w-full ${icon ? 'pl-10' : 'pl-3'} ${rightElement ? 'pr-10' : 'pr-3'} py-2 bg-surface-container-lowest border border-surface-variant rounded font-body-md text-body-md text-on-surface placeholder:text-secondary-fixed-dim focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim transition-all disabled:opacity-70 disabled:bg-surface-variant/30 disabled:cursor-not-allowed`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
