import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Binary, Terminal, ArrowRight, Radio } from 'lucide-react';

const labs = [
    {
        id: 'verilog',
        title: 'Verilog',
        desc: 'Simulate digital logic with HDL.',
        icon: Binary,
        path: '/editor/verilog',
    },
    {
        id: 'vhdl',
        title: 'VHDL',
        desc: 'VHSIC hardware description language.',
        icon: Binary,
        path: '/editor/vhdl',
    },
    {
        id: 'qnx',
        title: 'QNX',
        desc: 'Real-time OS application development.',
        icon: Terminal,
        path: '/editor/qnx',
    },
];

const Dashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="flex h-screen bg-bg-base overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto px-8 py-16">

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-14"
                    >
                        <div className="flex items-center gap-2 mb-6">
                            <Radio size={10} className="text-emerald-500 animate-pulse" />
                            <span className="text-[10px] text-text-muted uppercase tracking-[0.3em] font-bold">Online</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-text-main tracking-tight leading-tight mb-3">
                            Your Workspace
                        </h1>
                        <p className="text-text-muted text-sm max-w-md leading-relaxed">
                            Select a lab to start writing, simulating, and testing your code.
                        </p>
                    </motion.div>

                    {/* Lab Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {labs.map((lab, idx) => (
                            <motion.button
                                key={lab.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.08, duration: 0.4 }}
                                whileHover={{ y: -4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate(lab.path)}
                                className="group text-left p-6 bg-bg-surface border border-border-main rounded-2xl hover:border-accent/40 hover:bg-bg-surface-elevated transition-all duration-300 flex flex-col"
                            >
                                <div className="w-10 h-10 bg-bg-surface-elevated border border-border-main rounded-xl flex items-center justify-center mb-5 group-hover:border-accent/30 transition-colors">
                                    <lab.icon size={18} className="text-text-muted group-hover:text-accent transition-colors" />
                                </div>
                                <h3 className="text-base font-black text-text-main tracking-tight mb-1">{lab.title}</h3>
                                <p className="text-xs text-text-muted leading-relaxed flex-1">{lab.desc}</p>
                                <div className="flex items-center gap-1.5 mt-5 text-[10px] font-bold text-text-muted group-hover:text-accent uppercase tracking-widest transition-colors">
                                    <span>Open</span>
                                    <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
