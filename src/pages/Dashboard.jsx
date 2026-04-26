import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Binary, Terminal, Activity, Zap, Layers, Wind, Radio } from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();

    const labs = [
        {
            id: 'verilog',
            title: 'Verilog Core',
            desc: 'Hardware description language for digital logic design and RTL verification.',
            icon: Binary,
            color: 'from-accent/20 to-indigo-500/5',
            accent: 'text-accent',
            path: '/editor/verilog'
        },
        {
            id: 'vhdl',
            title: 'VHDL Core',
            desc: 'Hardware description language for digital logic design and RTL verification.',
            icon: Binary,
            color: 'from-accent/20 to-indigo-500/5',
            accent: 'text-accent',
            path: '/editor/vhdl'
        },
        {
            id: 'qnx',
            title: 'QNX Target',
            desc: 'Real-time operating system kernel development and deterministic execution.',
            icon: Terminal,
            color: 'from-emerald-600/20 to-emerald-500/5',
            accent: 'text-emerald-400',
            path: '/editor/qnx'
        }
    ];

    return (
        <div className="flex h-screen bg-bg-base overflow-hidden transition-colors duration-300">
            <Sidebar />

            <main className="flex-1 overflow-y-auto relative custom-scrollbar">

                <div className="max-w-7xl mx-auto px-12 py-20 relative z-10">
                    {/* Dashboard Header */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mb-20"
                    >
                        <div className="flex items-center space-x-4 mb-8">
                            <div className="px-4 py-1.5 bg-bg-surface-elevated border border-border-main rounded-full text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center">
                                <Radio size={12} className="mr-3 text-emerald-500 animate-pulse" />
                                Laboratory Node: 0xA7 - Active
                            </div>
                            <div className="h-px w-24 bg-gradient-to-r from-border-main to-transparent"></div>
                        </div>

                        <h1 className="text-7xl font-black text-text-main tracking-tighter mb-8 leading-[0.9]">
                            Architectural <br />
                            <span className="text-accent">Environment.</span>
                        </h1>

                        <div className="flex flex-wrap gap-8 items-center">
                            <p className="text-text-muted text-lg font-medium max-w-xl leading-relaxed">
                                Welcome to BitLab Core. Efficiently synthesize, simulate, and deploy mission-critical engineering logic within parallel sandbox sessions.
                            </p>
                        </div>
                    </motion.div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {labs.map((lab, idx) => (
                            <motion.div
                                key={lab.id}
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.15, duration: 0.8 }}
                                whileHover={{ y: -8 }}
                                onClick={() => navigate(lab.path)}
                                className={`group cursor-pointer glass-card p-10 bg-bg-surface hover:bg-bg-surface-elevated transition-all duration-700 relative overflow-hidden`}
                            >
                                <div className="w-16 h-16 bg-bg-surface-elevated rounded-3xl flex items-center justify-center mb-12 border border-border-main group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                                    <lab.icon className="text-accent" size={32} />
                                </div>

                                <div className="space-y-4 mb-12">
                                    <h3 className="text-3xl font-black text-text-main tracking-tighter group-hover:translate-x-1 transition-transform">{lab.title}</h3>
                                    <p className="text-text-muted font-medium leading-relaxed text-sm transition-colors">
                                        {lab.desc}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                                        <Layers size={14} className="text-accent" />
                                        <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">Ready</span>
                                    </div>
                                    <div className="flex items-center text-text-muted group-hover:text-accent font-black text-[10px] uppercase tracking-[0.3em] transition-colors">
                                        <span className="mr-3">Launch</span>
                                        <Zap size={14} className="group-hover:fill-accent transition-all animate-pulse" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* System Status Footer */}
                    <motion.footer
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-32 pt-12 border-t border-border-main flex flex-col md:flex-row justify-between items-center gap-6"
                    >
                        <div className="flex items-center space-x-8 text-[9px] font-black text-text-muted uppercase tracking-[0.3em]">
                            <span className="text-border-main uppercase font-black text-[20px] select-none">BitLab™</span>
                        </div>
                    </motion.footer>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
