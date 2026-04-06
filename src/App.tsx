import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Upload as UploadIcon, 
  Settings, 
  LogOut,
  GraduationCap,
  Bell
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import Upload from './components/Upload';
import SessionDetail from './components/SessionDetail';
import { cn } from './lib/utils';

function Sidebar() {
  const location = useLocation();
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: UploadIcon, label: 'Analyze Session', path: '/upload' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
          <GraduationCap size={24} />
        </div>
        <span className="text-xl font-bold text-slate-900 tracking-tight">Vedantu Session Analyzer</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
              location.pathname === item.path 
                ? "bg-blue-50 text-blue-600" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon size={20} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-slate-500 hover:text-red-600 transition-colors font-medium">
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

function TopNav() {
  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search sessions..." 
            className="bg-slate-50 border-none rounded-full px-6 py-2 text-sm w-64 focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>
        <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900">Dr. Sarah Wilson</p>
            <p className="text-xs text-slate-500">Senior Educator</p>
          </div>
          <div className="w-10 h-10 bg-slate-200 rounded-full" />
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <TopNav />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/session/:id" element={<SessionDetail />} />
              <Route path="/settings" element={<div className="p-8">Settings Page (Coming Soon)</div>} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}
