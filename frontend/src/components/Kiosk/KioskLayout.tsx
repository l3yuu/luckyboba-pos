import React from 'react';

interface KioskLayoutProps {
  children: React.ReactNode;
}

const KioskLayout: React.FC<KioskLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col overflow-hidden font-sans select-none">
      <main className="flex-1 flex flex-col relative">
        {children}
      </main>
    </div>
  );
};

export default KioskLayout;
