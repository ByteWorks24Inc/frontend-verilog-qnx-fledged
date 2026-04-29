import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Binary, Terminal, Zap, Layers, Radio } from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();

    const labs = [
        {
            id: 'verilog',
            title: 'Verilog',
            desc: 'Write and simulate digital logic using standard hardware description languages.',
            icon: Binary,
            color: 'from-accent/20 to-indigo-500/5',
            accent: 'text-accent',
            path: '/editor/verilog'
        },
        {
            id: 'vhdl',
            title: 'VHDL',
            desc: 'Write and simulate digital logic using standard hardware description languages.',
            icon: Binary,
            color: 'from-accent/20 to-indigo-500/5',
            accent: 'text-accent',
            path: '/editor/vhdl'
        },
        {
            id: 'qnx',
            title: 'QNX',
            desc: 'Develop and test applications for real-time operating systems.',
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

                <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-20 relative z-10">
                    {/* Dashboard Header */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mb-20"
                    >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
                            <div className="px-4 py-1.5 bg-bg-surface-elevated border border-border-main rounded-full text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center">
                                <Radio size={13} className="mr-3 text-emerald-500 animate-pulse" />
                                System Status: Online
                            </div>
                            <div className="h-px w-24 bg-gradient-to-r from-border-main to-transparent"></div>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black text-text-main tracking-tighter mb-8 leading-[0.9]">
                            Your <br />
                            <span className="text-accent">Workspace.</span>
                        </h1>

                        <div className="flex flex-wrap gap-8 items-center">
                            <p className="text-text-muted text-xl font-medium max-w-xl leading-relaxed">
                                Welcome to BitLab. Start writing, simulating, and deploying your code.
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
                                    <h3 className="text-4xl font-black text-text-main tracking-tighter group-hover:translate-x-1 transition-transform">{lab.title}</h3>
                                    <p className="text-text-muted font-medium leading-relaxed text-base transition-colors">
                                        {lab.desc}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                                        <Layers size={15} className="text-accent" />
                                        <span className="text-xs font-black text-accent uppercase tracking-[0.2em]">Ready</span>
                                    </div>
                                    <div className="flex items-center text-text-muted group-hover:text-accent font-black text-xs uppercase tracking-[0.3em] transition-colors">
                                        <span className="mr-3">Launch</span>
                                        <Zap size={15} className="group-hover:fill-accent transition-all animate-pulse" />
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
