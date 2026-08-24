import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { companyApi } from '../../api/endpoints';
import { useCompanyStore } from '../../store/companyStore';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const setConfig = useCompanyStore((s) => s.setConfig);

  useEffect(() => {
    companyApi
      .get()
      .then((res) => setConfig(res.data))
      .catch(() => undefined);
  }, [setConfig]);

  return (
    <div className="flex h-screen bg-[#f4f5fa]">
      <Sidebar open={sidebarOpen} />
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-[1px] lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
