import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import {
    Play,
    Terminal as TerminalIcon,
    Activity,
    Download,
    Loader2,
    ChevronDown,
    X,
    Binary,
    Cpu,
    Terminal,
    Zap,
    Box,
    HardDrive,
    Wifi,
    ChevronRight
} from 'lucide-react';

const CodeLab = () => {
    const { lang } = useParams();
    const navigate = useNavigate();

    const [designCode, setDesignCode] = useState('');
    const [testbenchCode, setTestbenchCode] = useState('');
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isTerminalOpen, setIsTerminalOpen] = useState(true);
    const [vcdText, setVcdText] = useState(null);
    const terminalRef = useRef(null);
    const studioWindowRef = useRef(null);


    const labConfig = {
        verilog: { title: 'Verilog Core', mode: 'verilog', icon: Binary, hasTestbench: true },
        qnx: { title: 'QNX Target', mode: 'cpp', icon: Terminal, hasTestbench: false },
    };

    const currentLab = labConfig[lang] || labConfig.verilog;

    useEffect(() => {
        const savedDesign = localStorage.getItem(`${lang}_design`);
        const savedTB = localStorage.getItem(`${lang}_tb`);
        if (savedDesign) setDesignCode(savedDesign);
        else setDefaultTemplate();
    }, [lang]);

    const setDefaultTemplate = () => {
        if (lang === 'qnx') {
            setDesignCode('#include <stdio.h>\n\nint main() {\n  printf("Initializing BitLab QNX Engine...\\n");\n  return 0;\n}');
            setTestbenchCode('');
        } else if (lang === 'verilog') {
            setDesignCode('// BitLab Verilog Template\nmodule adder(input [3:0] a, b, output [4:0] sum);\n  assign sum = a + b;\nendmodule');
            setTestbenchCode('\`timescale 1ns/1ps\n\nmodule tb;\nreg [3:0] a, b;\nwire [4:0] sum;\n\nadder uut (.a(a), .b(b), .sum(sum));\n\ninitial begin\n  $dumpfile("demo.vcd");\n  $dumpvars(0, tb);\n  a = 0; b = 0;\n  #10 a = 3; b = 4;\n  #10 a = 7; b = 8;\n  #10 a = 15; b = 1;\n  #10 $finish;\nend\nendmodule');
        }
    };

    const handleSave = (val, type) => {
        if (type === 'design') {
            setDesignCode(val);
            localStorage.setItem(`${lang}_design`, val);
        } else {
            setTestbenchCode(val);
            localStorage.setItem(`${lang}_tb`, val);
        }
    };

    const executeCode = async () => {
        if (loading) return;
        setLoading(true);
        setVcdText(null);
        setLogs(prev => [...prev, `>>> [INIT] Initializing target environment: ${lang.toUpperCase()}...`]);


        try {
            const response = await api.post('/execute', {
                language: lang,
                designCode,
                testbenchCode: currentLab.hasTestbench ? testbenchCode : null
            });

            if (lang === 'qnx' && response.data.jobId) {
                const { jobId } = response.data;
                setLogs(prev => [...prev, `[QUEUED] Job ID: ${jobId}`, `Waiting for worker execution...`]);

                let attempts = 0;
                const maxAttempts = 60;

                const poll = setInterval(async () => {
                    attempts++;
                    try {
                        const res = await api.get(`/result/${jobId}`);
                        if (res.data && res.data.logs != null) {
                            clearInterval(poll);
                            setLogs(prev => [...prev, ...res.data.logs.split('\n')]);
                            setLoading(false);
                        }
                    } catch (err) {
                        if (err.response && err.response.status === 404) {
                            // Still pending
                            if (attempts >= maxAttempts) {
                                clearInterval(poll);
                                setLogs(prev => [
                                    ...prev,
                                    `!!! TIMEOUT: Worker execution timed out.`,
                                    `*** PLEASE CONTACT MODERATOR TO TURN ON THE QNX VM SERVER TO ACCESS ***`
                                ]);
                                setLoading(false);
                            }
                        } else {
                            // other error
                            clearInterval(poll);
                            setLogs(prev => [
                                ...prev,
                                `!!! ERROR: Failed to fetch results.`,
                                `!!! DETAIL: ${err.message}`,
                                `*** PLEASE CONTACT MODERATOR TO TURN ON THE QNX VM SERVER TO ACCESS ***`
                            ]);
                            setLoading(false);
                        }
                    }
                }, 2000);
            } else {
                const { logs: outputLogs } = response.data;
                if (outputLogs) {
                    setLogs(prev => [...prev, ...outputLogs.split('\n')]);
                }
                
                try {
                    const vcdRes = await api.get(`/execute/graph?language=${lang}`, {
                        responseType: 'text'
                    });
                    const rawVcd = vcdRes.data;
                    setVcdText(rawVcd);
                    
                    // Sync with open studio window if it exists
                    if (studioWindowRef.current && !studioWindowRef.current.closed) {
                        studioWindowRef.current.postMessage({ type: 'load_vcd', vcd: rawVcd, lang }, '*');
                    }

                } catch (vcdErr) {
                    setLogs(prev => [...prev, `!!! VCD_FETCH_ERROR: ${vcdErr.message}`]);
                }
                
                setLoading(false);
            }

        } catch (err) {
            const errorMsg = (err.response && err.response.data && err.response.data.message) || err.message || 'Unknown Transport Error';
            const status = (err.response && err.response.status) ? ` [Status: ${err.response.status}]` : '';
            setLogs(prev => [
                ...prev,
                `!!! CRITICAL_ERROR: Failed to establish handshake with remote execution kernel.`,
                `!!! DETAIL: ${errorMsg}${status}`,
                lang === 'qnx' ? `*** PLEASE CONTACT MODERATOR TO TURN ON THE QNX VM SERVER TO ACCESS ***` : ''
            ].filter(Boolean));
            setLoading(false);
        }
    };


    // Native Waveform Studio Handshake
    const openWaveformStudio = () => {
        if (!vcdText) {
            setLogs(prev => [...prev, `*** ERROR: No simulation trace data found. Run Execute Core first. ***`]);
            return;
        }

        // Open our internal /waveform route in a specialized popup
        const width = 1200;
        const height = 800;
        const left = (window.screen.width / 2) - (width / 2);
        const top = (window.screen.height / 2) - (height / 2);

        const win = window.open(
            '/waveform', 
            'BitLabWaveformStudio', 
            `width=${width},height=${height},top=${top},left=${left},status=no,menubar=no,toolbar=no`
        );

        studioWindowRef.current = win;

        // Messaging bridge: Send the data once the target acknowledges readiness
        const handleSync = (event) => {
            if (event.data.type === 'studio_ready' && win && !win.closed) {
                win.postMessage({ type: 'load_vcd', vcd: vcdText, lang }, '*');
            }

        };

        window.addEventListener('message', handleSync);
        
        // Timeout based safety sync (if ready signal is missed)
        setTimeout(() => {
            if (win && !win.closed) {
                win.postMessage({ type: 'load_vcd', vcd: vcdText, lang }, '*');
            }

            window.removeEventListener('message', handleSync);
        }, 1000);
    };
    // Keyboard & UI Sync



    // Keyboard & UI Sync
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.ctrlKey && e.key === 'Enter') executeCode();
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [designCode, testbenchCode, loading]);

    useEffect(() => {
        if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }, [logs]);

    return (
        <div className="flex h-screen bg-[#030712] overflow-hidden text-slate-300">
            <Sidebar />

            <div className="flex-1 flex flex-col relative overflow-hidden">
                {/* IDE Header */}
                <header className="h-14 border-b border-white/[0.03] bg-[#0b0f1a]/80 backdrop-blur-xl px-8 flex items-center justify-between z-40 relative overflow-hidden">
                    <div className="absolute inset-0 shimmer pointer-events-none opacity-5"></div>

                    <div className="flex items-center space-x-8">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-accent/10 border border-accent/20 rounded-xl text-accent shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                                <currentLab.icon size={18} />
                            </div>
                            <div>
                                <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{currentLab.title}</h2>
                                <div className="flex items-center text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">
                                    <span className="w-1 h-1 rounded-full bg-emerald-500 mr-2 animate-pulse"></span> Remote Instance: 0xFD21
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center text-[10px] space-x-4">
                            <div className="h-4 w-px bg-white/5"></div>
                            <span className="text-slate-500 font-black uppercase tracking-widest flex items-center"><Box size={10} className="mr-2" /> Main.v</span>
                            <span className="text-slate-800 font-black uppercase tracking-widest">/</span>
                            <span className="text-slate-500 font-black uppercase tracking-widest flex items-center">Synthesis: Ready</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        {vcdText && (
                            <motion.button
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={openWaveformStudio}
                                className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center space-x-3 transition-all duration-500 border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 group"
                            >
                                <Activity size={14} className="animate-pulse group-hover:scale-110 transition-transform" />
                                <span>Open Waveform Studio</span>
                            </motion.button>
                        )}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={executeCode}
                            disabled={loading}
                            className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center space-x-3 transition-all duration-500 ${loading ? 'bg-slate-800 text-slate-500' : 'bg-accent text-white shadow-glow hover:bg-accent-hover'}`}
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} className="fill-white" />}
                            <span>{loading ? 'Processing' : 'Execute Core'}</span>
                        </motion.button>
                    </div>

                </header>

                {/* Workspace */}
                <main key={lang} className="flex-1 flex overflow-hidden relative">
                    {/* Design Editor */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="h-8 px-6 flex items-center bg-[#070b14] border-b border-white/[0.03]">
                            <div className="flex items-center space-x-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent/40"></div>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                    {lang === 'qnx' ? 'Source Console' : 'Logic Workspace'}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 bg-[#0b0f1a] relative">
                            <Editor
                                theme="vs-dark"
                                language={currentLab.mode}
                                value={designCode}
                                onChange={(val) => handleSave(val, 'design')}
                                options={{
                                    fontSize: 14,
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    padding: { top: 20 },
                                    backgroundColor: '#0b0f1a'
                                }}
                            />
                        </div>
                    </div>

                    {/* Conditional Testbench Editor */}
                    {currentLab.hasTestbench && (
                        <div className="w-[40%] flex flex-col bg-[#070b14]/50 backdrop-blur-sm border-l border-white/[0.03]">
                            <div className="h-8 px-6 flex items-center border-b border-white/[0.03]">
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Mention $dumpfile("demo.vcd") for waveform</span>
                            </div>
                            <div className="flex-1">
                                <Editor
                                    theme="vs-dark"
                                    language={currentLab.mode}
                                    value={testbenchCode}
                                    onChange={(val) => handleSave(val, 'tb')}
                                    options={{
                                        fontSize: 14,
                                        minimap: { enabled: false },
                                        scrollBeyondLastLine: false,
                                        padding: { top: 20 },
                                        backgroundColor: '#070b14'
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </main>

                {/* Terminal / Status Bar Layout */}
                <div className={`transition-all duration-500 ${isTerminalOpen ? 'h-[280px]' : 'h-10'} border-t border-white/[0.03] bg-black/60 flex flex-col relative`}>
                    <div
                        onClick={() => setIsTerminalOpen(!isTerminalOpen)}
                        className="h-10 px-8 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors relative z-10"
                    >
                        <div className="flex items-center space-x-4">
                            <TerminalIcon size={14} className="text-emerald-500" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Console Stream_09X</span>
                        </div>
                        <div className="flex items-center space-x-8">
                            <div className="flex items-center text-[8px] font-black text-slate-700 uppercase tracking-widest space-x-4">
                                <span className="flex items-center"><Wifi size={10} className="mr-2 text-emerald-500" /> Uplink: 1.2ms</span>
                                <span className="flex items-center"><Cpu size={10} className="mr-2" /> Host: Lab-7</span>
                            </div>
                            <ChevronDown size={14} className={`transform transition-transform duration-500 ${isTerminalOpen ? '' : 'rotate-180'} text-slate-600`} />
                        </div>
                    </div>

                    {isTerminalOpen && (
                        <div
                            ref={terminalRef}
                            className="flex-1 overflow-y-auto font-mono text-[11px] p-10 text-emerald-400/70 leading-relaxed selection:bg-emerald-500/20 custom-scrollbar relative"
                        >
                            {/* Terminal Scanline Effect */}
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-emerald-500/[0.02] to-transparent bg-[length:100%_4px] opacity-10"></div>

                            <div className="max-w-6xl relative z-10">
                                {logs.map((log, i) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        key={i}
                                        className="mb-2 flex items-start"
                                    >
                                        <span className="text-emerald-900 font-bold mr-6 select-none">{i.toString().padStart(3, '0')}</span>
                                        <span className="flex-1">{log}</span>
                                    </motion.div>
                                ))}
                                {loading && (
                                    <div className="flex items-center space-x-4 mt-4">
                                        <span className="w-1.5 h-4 bg-accent animate-pulse"></span>
                                        <span className="text-accent font-black text-[10px] uppercase tracking-[0.3em]">Processing Logic Vectors...</span>
                                    </div>
                                )}
                                {/* Integrated view removed in favor of professional popup */}



                            </div>
                        </div>
                    )}
                </div>

                {/* Global Footer / Tiny Status Bar */}
                <footer className="h-6 bg-[#0b0f1a] border-t border-white/[0.03] flex items-center justify-between px-6 z-50">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center text-[8px] font-black text-accent uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span> System Ready
                        </div>
                        <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">BitLab Engine v4.0</span>
                    </div>
                    <div className="flex items-center space-x-6 text-[8px] font-black text-slate-700 uppercase tracking-widest">
                        <span className="flex items-center"><HardDrive size={10} className="mr-2" /> 2.4 TB Free</span>
                        <span className="flex items-center"><ChevronRight size={10} className="mx-1" /> Node: Primary</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default CodeLab;
