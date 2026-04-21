'use client';
import { ThemeProvider } from '@/components/ThemeProvider';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function ClientLayout({ children }) {
  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-dark-200 dark:bg-dark-200">
        <Sidebar />
        <div className="flex-1 flex flex-col ml-64">
          <Header onMenuClick={() => {}} />
          <main className="flex-1 p-6 mt-16">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}