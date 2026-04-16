"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { authStorage } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { 
  LayoutDashboard, 
  CalendarPlus, 
  CalendarCheck, 
  Activity,
  UserPlus,
  Settings, 
  Zap, 
  LogOut 
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'New Request', href: '/demos/create', icon: CalendarPlus },
    { name: 'Scheduling', href: '/demos/schedule', icon: CalendarCheck },
    { name: 'Status Tracking', href: '/status-tracking', icon: Activity },
    { name: 'Assign Executive', href: '/reports', icon: UserPlus },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="w-72 shrink-0 bg-[#fafaf9] text-slate-600 min-h-screen p-5 flex flex-col border-r border-slate-200 h-full">
      
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3 mb-10 mt-4 px-2 group cursor-pointer">
        <div className="p-2 bg-cyan-100 rounded-xl group-hover:bg-cyan-500 group-hover:rotate-12 transition-all duration-300">
          <Zap className="text-cyan-600 group-hover:text-white transition-colors duration-300" size={24} />
        </div>
        <span className="text-lg font-bold text-slate-800 tracking-widest uppercase">
          Demo Booking
        </span>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link key={item.name} href={item.href}
              className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium ${
                isActive 
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-200/50' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}>
              <Icon 
                size={20} 
                className={`transition-all duration-300 ${
                  isActive 
                    ? "text-white" 
                    : "text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-1"
                }`} 
              />
              <span className={`transition-transform duration-300 ${!isActive ? 'group-hover:translate-x-1' : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
      
      {/* Profile Card with Fixed Logout Link */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 mt-auto shadow-sm flex items-center justify-between group hover:border-cyan-200 transition-all duration-300">
        <div className="flex flex-col">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Session Active</p>
          <p className="text-sm text-slate-800 font-bold">{user?.full_name || 'User'}</p>
          <p className="text-[11px] text-slate-500 font-medium capitalize">{user?.role || 'guest'}</p>
        </div>
        
        {/* The logout link correctly points to the root '/' (Login page) */}
        <Link 
          href="/" 
          onClick={() => {
            authStorage.clearToken();
            logout();
          }}
          className="p-2.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all active:scale-90"
          title="Logout"
        >
          <LogOut size={20} />
        </Link>
      </div>
      
    </div>
  );
}