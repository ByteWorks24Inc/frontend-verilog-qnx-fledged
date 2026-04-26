import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Binary,
    Terminal,
    LogOut,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    ShieldAlert,
    Settings,
    Sun,
    Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { logout, user } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { id: 'verilog', label: 'Verilog Lab', icon: Binary, path: '/editor/verilog' },
        { id: 'vhdl', label: 'VHDL Lab', icon: Binary, path: '/editor/vhdl' },
        { id: 'qnx', label: 'QNX OS Lab', icon: Terminal, path: '/editor/qnx' },
    ];

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 90 : 280 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-screen bg-bg-sidebar border-r border-border-main flex flex-col relative z-50 overflow-hidden transition-colors duration-300"
        >

            {/* Collapse Toggle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-20 w-6 h-12 bg-bg-surface-elevated border border-border-main rounded-full flex items-center justify-center text-text-muted z-50 hover:text-accent hover:border-accent transition-all hover:scale-110 active:scale-95"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Logo */}
            <div className={`pt-12 pb-16 flex items-center transition-all duration-500 ${isCollapsed ? 'justify-center' : 'px-8'}`}>
                <motion.div
                    className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center border border-border-main group-hover:rotate-12 transition-transform"
                >
                    <span className="text-text-inverse font-black text-2xl">B</span>
                </motion.div>
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="ml-5"
                    >
                        <span className="text-2xl font-black text-text-main tracking-tighter block leading-none">BIT<span className="text-accent">LAB</span></span>
                        <span className="text-[8px] font-black text-text-muted uppercase tracking-[0.4em] mt-1 block">Laboratory Core</span>
                    </motion.div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-3">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center py-4 rounded-2xl transition-all duration-500 group relative
                ${isActive
                                    ? 'bg-bg-surface-elevated text-accent border border-border-main'
                                    : 'text-text-muted hover:bg-bg-surface hover:text-text-main'}`}
                        >
                            {isActive && <motion.div layoutId="activeNav" className="absolute left-0 w-1 h-6 bg-accent rounded-full" />}
                            <div className={`flex items-center transition-all duration-500 ${isCollapsed ? 'mx-auto' : 'px-6'}`}>
                                <item.icon size={20} className={isActive ? 'text-accent' : 'group-hover:text-accent transition-colors'} />
                                {!isCollapsed && (
                                    <span className="ml-5 font-black text-[10px] uppercase tracking-[0.3em] truncate">
                                        {item.label}
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </nav>

            {/* Footer Metrics */}
            <div className="p-4 border-t border-border-main">
                <div className="space-y-2">
                    <button
                        onClick={toggleTheme}
                        className={`w-full flex items-center py-4 rounded-2xl text-text-muted hover:bg-bg-surface-elevated hover:text-text-main transition-all duration-500 group ${isCollapsed ? 'justify-center' : 'px-6'}`}
                    >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        {!isCollapsed && <span className="ml-5 font-black text-[10px] uppercase tracking-[0.3em]">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
                    </button>
                    {!isCollapsed && (
                        <div className="p-4 bg-bg-surface rounded-2xl border border-border-main mb-4 flex items-center space-x-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest truncate">{user?.email || 'DEBUG@AUTO'}</span>
                        </div>
                    )}

                    <button
                        onClick={() => {
                            logout();
                            navigate('/login');
                        }}
                        className={`w-full flex items-center py-4 rounded-2xl text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-all duration-500 group ${isCollapsed ? 'justify-center' : 'px-6'}`}
                    >
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                        {!isCollapsed && <span className="ml-5 font-black text-[10px] uppercase tracking-[0.3em]">Logout</span>}
                    </button>
                </div>
            </div>
        </motion.aside>
    );
};

export default Sidebar;
