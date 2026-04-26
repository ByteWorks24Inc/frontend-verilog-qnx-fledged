import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Cpu, Terminal, Zap, ChevronRight, Binary, ArrowRight, Github, Youtube, User } from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();

    const features = [
        {
            title: 'Verilog Core',
            desc: 'Write and simulate digital logic using standard hardware description languages.',
            icon: Binary,
        },
        {
            title: 'VHDL Core',
            desc: 'Hardware description language for digital logic design and RTL verification.',
            icon: Cpu,
        },
        {
            title: 'QNX x86',
            desc: 'Develop and test applications for real-time operating systems in a deterministic environment.',
            icon: Terminal,
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    return (
        <div className="min-h-screen bg-bg-base text-text-main font-sans selection:bg-accent selection:text-text-inverse overflow-hidden transition-colors duration-300">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-50">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center space-x-3"
                >
                    <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                        <span className="text-text-inverse font-black text-xl">B</span>
                    </div>
                    <span className="text-2xl font-black tracking-tighter">BIT<span className="text-text-muted">LAB</span></span>
                </motion.div>

                <motion.nav 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center space-x-6"
                >
                    <Link to="/login" className="text-sm font-bold text-text-muted hover:text-accent transition-colors uppercase tracking-widest">
                        Sign In
                    </Link>
                    <Link to="/register" className="px-6 py-3 bg-accent text-text-inverse text-xs font-black uppercase tracking-[0.2em] rounded-xl hover:bg-accent-hover transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform duration-300">
                        Get Started
                    </Link>
                </motion.nav>
            </header>

            {/* Hero Section */}
            <main className="relative pt-40 pb-20 px-6 lg:px-12 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-screen z-10">
                
                {/* Abstract Background Element */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 flex items-center justify-center opacity-30">
                    <motion.div 
                        animate={{ 
                            rotate: [0, 90, 180, 270, 360],
                            scale: [1, 1.05, 1] 
                        }}
                        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                        className="w-[800px] h-[800px] border-[1px] border-border-main rounded-full border-dashed"
                    />
                    <motion.div 
                        animate={{ 
                            rotate: [360, 270, 180, 90, 0],
                        }}
                        transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
                        className="absolute w-[600px] h-[600px] border-[1px] border-border-main rounded-full"
                    />
                </div>

                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-center max-w-4xl mx-auto z-10"
                >
                    <motion.div variants={itemVariants} className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-bg-surface-elevated border border-border-main mb-8">
                        <Zap size={14} className="text-accent" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">High-Performance Computing</span>
                    </motion.div>

                    <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8">
                        Execute Logic.<br/>
                        <span className="text-text-muted">In the Cloud.</span>
                    </motion.h1>

                    <motion.p variants={itemVariants} className="text-lg md:text-xl text-text-muted font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
                        A minimal, lightning-fast online execution platform for Verilog, VHDL, and QNX x86 architecture. Compile, simulate, and analyze directly in your browser.
                    </motion.p>

                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                        <button 
                            onClick={() => navigate('/register')}
                            className="w-full sm:w-auto px-10 py-5 bg-accent text-text-inverse rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] hover:bg-accent-hover transition-all duration-300 hover:scale-105 flex items-center justify-center group"
                        >
                            <span>Start Building</span>
                            <ArrowRight size={16} className="ml-3 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button 
                            onClick={() => navigate('/login')}
                            className="w-full sm:w-auto px-10 py-5 bg-bg-surface-elevated border border-border-main text-text-main rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] hover:bg-border-main transition-all duration-300 hover:scale-105 flex items-center justify-center group"
                        >
                            <span>Access Workspace</span>
                            <ChevronRight size={16} className="ml-3 group-hover:translate-x-1 transition-transform opacity-50" />
                        </button>
                    </motion.div>
                </motion.div>

                {/* Features Grid */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full max-w-5xl relative z-10"
                >
                    {features.map((feature, idx) => (
                        <motion.div 
                            key={idx}
                            variants={itemVariants}
                            className="p-8 rounded-[2rem] bg-bg-surface border border-border-main hover:border-accent hover:shadow-lg transition-all duration-500 group"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-bg-surface-elevated flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                                <feature.icon size={24} className="text-accent" />
                            </div>
                            <h3 className="text-xl font-black mb-3 tracking-tight group-hover:translate-x-1 transition-transform">{feature.title}</h3>
                            <p className="text-text-muted text-sm leading-relaxed">{feature.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* About Section */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="w-full max-w-4xl mt-32 text-center relative z-10"
                >
                    <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl font-black mb-8 tracking-tighter">
                        Why We Built <span className="text-accent">BitLab.</span>
                    </motion.h2>
                    <motion.p variants={itemVariants} className="text-lg text-text-muted leading-relaxed font-medium">
                        BitLab was created to bridge the gap between heavy, complex hardware design software and the modern web. We provide a seamless, zero-setup environment where engineers, researchers, and students can immediately start writing, simulating, and visualizing hardware logic or real-time OS operations. No complex toolchains, no local installations—just a pure, fast, and minimal execution workspace.
                    </motion.p>
                </motion.div>

                {/* Footer Section */}
                <motion.footer 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="w-full max-w-5xl mt-32 pt-10 border-t border-border-main flex flex-col md:flex-row items-center justify-between gap-6 z-10 relative"
                >
                    <motion.div variants={itemVariants} className="flex items-center space-x-2 text-text-muted text-[10px] uppercase tracking-widest font-black">
                        <User size={14} className="text-accent" />
                        <span>Built by <a href="https://utej.me" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors underline underline-offset-4">utej.me</a></span>
                    </motion.div>
                    
                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8 mt-8 md:mt-0">
                        <a href="https://www.youtube.com/watch?v=lrvG5LdMyaE&t=5s" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 text-text-main hover:text-[#FF0000] transition-transform hover:scale-110 text-sm md:text-base uppercase tracking-widest font-black">
                            <Youtube size={24} />
                            <span>Tutorial</span>
                        </a>
                        <a href="https://github.com/ByteWorks24Inc" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 text-text-main hover:text-accent transition-transform hover:scale-110 text-sm md:text-base uppercase tracking-widest font-black">
                            <Github size={24} />
                            <span>GitHub</span>
                        </a>
                    </motion.div>
                </motion.footer>
            </main>
        </div>
    );
};

export default Landing;
