import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Binary,
    Terminal,
    LogOut,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    Sun,
    Moon,
    CircleDot,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) setIsCollapsed(true);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const { logout, user } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { id: 'verilog',   label: 'Verilog',   icon: Binary,          path: '/editor/verilog' },
        { id: 'vhdl',      label: 'VHDL',      icon: Binary,          path: '/editor/vhdl' },
        { id: 'qnx',       label: 'QNX',       icon: Terminal,        path: '/editor/qnx' },
    ];

    const w = isCollapsed ? (isMobile ? 64 : 72) : (isMobile ? '100vw' : 256);

    return (
        <motion.aside
            initial={false}
            animate={{ width: w }}
            transition={{ type: 'spring', stiffness: 280, damping: 32 }}
            className={`h-screen bg-bg-sidebar border-r border-border-main flex flex-col z-50 overflow-hidden ${
                isMobile && !isCollapsed ? 'absolute top-0 left-0 bottom-0 z-[100]' : 'relative'
            }`}
        >
            {/* Collapse toggle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-16 w-6 h-6 bg-bg-surface border border-border-main rounded-full flex items-center justify-center text-text-muted z-50 hover:text-accent hover:border-accent transition-all"
            >
                {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>

            {/* Logo */}
            <div className={`h-16 flex items-center border-b border-border-main ${isCollapsed ? 'justify-center' : 'px-5'}`}>
                <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-text-inverse font-black text-sm">B</span>
                </div>
                {!isCollapsed && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-3 overflow-hidden">
                        <span className="text-sm font-black text-text-main tracking-tight block leading-none">BitLab</span>
                        <span className="text-[9px] text-text-muted uppercase tracking-[0.3em] mt-0.5 block">Laboratory</span>
                    </motion.div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-200 ${
                                isActive
                                    ? 'bg-accent text-text-inverse'
                                    : 'text-text-muted hover:text-text-main hover:bg-bg-surface-elevated'
                            } ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            <item.icon size={16} className="shrink-0" />
                            {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-border-main space-y-1">
                {!isCollapsed && (
                    <div className="flex items-center gap-2 px-3 py-2 mb-1">
                        <CircleDot size={10} className="text-emerald-500 shrink-0" />
                        <span className="text-[10px] text-text-muted truncate">{user?.email || '—'}</span>
                    </div>
                )}
                <button
                    onClick={toggleTheme}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest text-text-muted hover:text-text-main hover:bg-bg-surface-elevated transition-all ${isCollapsed ? 'justify-center' : ''}`}
                >
                    {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                    {!isCollapsed && <span>{isDarkMode ? 'Light' : 'Dark'}</span>}
                </button>
                <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest text-text-muted hover:text-red-500 hover:bg-red-500/8 transition-all ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <LogOut size={16} className="shrink-0" />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </motion.aside>
    );
};

export default Sidebar;
