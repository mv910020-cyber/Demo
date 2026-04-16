"use client";
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function SidebarWrapper() {
  const pathname = usePathname();
  const authRoutes = ['/', '/login', '/signup'];

  const isAuthPage = authRoutes.includes(pathname);

  if (isAuthPage) {
    return null;
  }

  return (
    <aside className="shrink-0 z-50 animate-in fade-in duration-500">
      <Sidebar />
    </aside>
  );
}