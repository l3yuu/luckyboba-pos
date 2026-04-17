import React from 'react';

interface KioskLayoutProps {
  children: React.ReactNode;
}

const KioskLayout: React.FC<KioskLayoutProps> = ({ children }) => {
  return (
    <div className="h-screen bg-zinc-50 flex flex-col overflow-hidden font-sans select-none fixed inset-0">
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default KioskLayout;
