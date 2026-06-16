import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div className="bg-surface-container-lowest min-h-screen flex items-center justify-center p-margin-page">
      {/* Main Container: Level 1 Stroke (Flat, Corporate) */}
      <main className="w-full max-w-[400px] bg-surface-container-lowest border border-surface-variant rounded-xl p-padding-card flex flex-col gap-stack-lg shadow-sm">
        {children}
      </main>
    </div>
  );
};

export default AuthLayout;
