import React from 'react';

const Button = ({ children, type = 'button', variant = 'primary', className = '', ...props }) => {
  const baseStyles = "w-full font-title-sm text-title-sm font-semibold py-2.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary-container text-on-primary hover:bg-primary shadow-sm",
    outline: "border border-outline-variant text-on-surface-variant hover:bg-surface-variant bg-transparent",
    error: "bg-error text-white hover:bg-error/90 shadow-sm"
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
