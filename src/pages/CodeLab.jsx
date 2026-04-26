import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
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
    const { isDarkMode } = useTheme();

    const [designCode, setDesignCode] = useState('');
    const [testbenchCode, setTestbenchCode] = useState('');
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isTerminalOpen, setIsTerminalOpen] = useState(true);
    const [vcdText, setVcdText] = useState(null);
    const terminalRef = useRef(null);
    const studioWindowRef = useRef(null);


    const labConfig = {
        verilog: { title: 'Verilog', mode: 'verilog', icon: Binary, hasTestbench: true },
        vhdl: { title: 'VHDL', mode: 'vhdl', icon: Binary, hasTestbench: true },
        qnx: { title: 'QNX', mode: 'cpp', icon: TerminalIcon, hasTestbench: false },
    };

    const currentLab = labConfig[lang] || labConfig.verilog;

    useEffect(() => {
        const savedDesign = localStorage.getItem(`${lang}_design_v2`);
        const savedTB = localStorage.getItem(`${lang}_tb_v2`);
        
        const templates = getDefaultTemplates(lang);
        
        if (savedDesign) {
            setDesignCode(savedDesign);
        } else {
            setDesignCode(templates.design);
        }
        
        if (savedTB) {
            setTestbenchCode(savedTB);
        } else {
            setTestbenchCode(templates.tb);
        }
    }, [lang]);

    const getDefaultTemplates = (language) => {
        if (language === 'qnx') {
            return {
                design: '#include <stdio.h>\n\nint main() {\n  printf("Initializing BitLab QNX Engine...\\n");\n  return 0;\n}',
                tb: ''
            };
        } else if (language === 'verilog') {
            return {
                design: '// BitLab Verilog Template\nmodule adder(input [3:0] a, b, output [4:0] sum);\n  assign sum = a + b;\nendmodule',
                tb: '\`timescale 1ns/1ps\n\nmodule tb;\nreg [3:0] a, b;\nwire [4:0] sum;\n\nadder uut (.a(a), .b(b), .sum(sum));\n\ninitial begin\n  $dumpfile("demo.vcd");\n  $dumpvars(0, tb);\n  a = 0; b = 0;\n  #10 a = 3; b = 4;\n  #10 a = 7; b = 8;\n  #10 a = 15; b = 1;\n  #10 $finish;\nend\nendmodule'
            };
        } else if (language === 'vhdl') {
            return {
                design: '-- BitLab VHDL Template\nlibrary ieee;\nuse ieee.std_logic_1164.all;\n\nentity and_gate is\n  port (\n    a : in std_logic;\n    b : in std_logic;\n    y : out std_logic\n  );\nend and_gate;\n\narchitecture rtl of and_gate is\nbegin\n  y <= a and b;\nend rtl;',
                tb: '-- VHDL Testbench\nlibrary ieee;\nuse ieee.std_logic_1164.all;\n\nentity tb is\nend tb;\n\narchitecture sim of tb is\n  signal a, b, y : std_logic;\nbegin\n  -- The backend will automatically generate demo.vcd for the waveform\n  uut: entity work.and_gate\n    port map (a => a, b => b, y => y);\n\n  process\n  begin\n    a <= \'0\'; b <= \'0\';\n    wait for 10 ns;\n    a <= \'0\'; b <= \'1\';\n    wait for 10 ns;\n    a <= \'1\'; b <= \'0\';\n    wait for 10 ns;\n    a <= \'1\'; b <= \'1\';\n    wait for 10 ns;\n    wait;\n  end process;\nend sim;'
            };
        }
        return { design: '', tb: '' };
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
                `!!! CRITICAL_ERROR: Failed to connect to the server.`,
                `!!! DETAIL: ${errorMsg}${status}`,
                lang === 'qnx' ? `*** PLEASE CONTACT MODERATOR TO TURN ON THE QNX VM SERVER TO ACCESS ***` : ''
            ].filter(Boolean));
            setLoading(false);
        }
    };


    // Native Waveform Studio Handshake
    const openWaveformStudio = () => {
        if (!vcdText) {
            setLogs(prev => [...prev, `*** ERROR: No simulation trace data found. Run Code first. ***`]);
            return;
        }

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

        const handleSync = (event) => {
            if (event.data.type === 'studio_ready' && win && !win.closed) {
                win.postMessage({ type: 'load_vcd', vcd: vcdText, lang }, '*');
            }
        };

        window.addEventListener('message', handleSync);
        
        setTimeout(() => {
            if (win && !win.closed) {
                win.postMessage({ type: 'load_vcd', vcd: vcdText, lang }, '*');
            }
            window.removeEventListener('message', handleSync);
        }, 1000);
    };



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
        <div className="flex h-screen bg-bg-base overflow-hidden text-text-main transition-colors duration-300">
            <Sidebar />

            <div className="flex-1 flex flex-col relative overflow-hidden">
                {/* IDE Header */}
                <header className="h-14 border-b border-border-main bg-bg-surface backdrop-blur-xl px-4 md:px-8 flex items-center justify-between z-40 relative overflow-hidden">

                    <div className="flex items-center space-x-8">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-bg-surface-elevated border border-border-main rounded-xl text-accent">
                                <currentLab.icon size={18} />
                            </div>
                            <div>
                                <h2 className="text-[10px] font-black text-text-main uppercase tracking-[0.3em]">{currentLab.title}</h2>
                            </div>
                        </div>

                        <div className="hidden sm:flex items-center text-[10px] space-x-4">
                            <div className="h-4 w-px bg-border-main"></div>
                            <span className="text-text-muted font-black uppercase tracking-widest flex items-center">Workspace</span>
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
                                <span className="hidden sm:inline">Open Waveform Studio</span>
                            </motion.button>
                        )}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={executeCode}
                            disabled={loading}
                            className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center space-x-3 transition-all duration-500 ${loading ? 'bg-bg-surface-elevated text-text-muted' : 'bg-accent text-text-inverse hover:bg-accent-hover'}`}
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} className="fill-white" />}
                            <span className="hidden sm:inline">{loading ? 'Processing' : 'Run Code'}</span>
                        </motion.button>
                    </div>

                </header>

                {/* Workspace */}
                <main key={lang} className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                    {/* Design Editor */}
                    <div className="flex-1 flex flex-col min-w-0 h-1/2 md:h-full">
                        <div className="h-8 px-6 flex items-center bg-bg-surface-elevated border-b border-border-main">
                            <div className="flex items-center space-x-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                                <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">
                                    Code Editor
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 bg-bg-surface relative">
                            <Editor
                                theme={isDarkMode ? 'vs-dark' : 'light'}
                                language={currentLab.mode}
                                value={designCode}
                                onChange={(val) => handleSave(val, 'design')}
                                options={{
                                    fontSize: 14,
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    padding: { top: 20 },
                                    backgroundColor: 'transparent'
                                }}
                            />
                        </div>
                    </div>

                    {/* Conditional Testbench Editor */}
                    {currentLab.hasTestbench && (
                        <div className="flex-1 md:flex-none md:w-[40%] flex flex-col bg-bg-surface-elevated border-t md:border-t-0 md:border-l border-border-main h-1/2 md:h-full">
                            <div className="h-8 px-6 flex items-center border-b border-border-main">
                                <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Testbench</span>
                            </div>
                            <div className="flex-1">
                                <Editor
                                    theme={isDarkMode ? 'vs-dark' : 'light'}
                                    language={currentLab.mode}
                                    value={testbenchCode}
                                    onChange={(val) => handleSave(val, 'tb')}
                                    options={{
                                        fontSize: 14,
                                        minimap: { enabled: false },
                                        scrollBeyondLastLine: false,
                                        padding: { top: 20 },
                                        backgroundColor: 'transparent'
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </main>

                {/* Terminal / Status Bar Layout */}
                <div className={`transition-all duration-500 ${isTerminalOpen ? 'h-[280px]' : 'h-10'} border-t border-border-main bg-bg-surface flex flex-col relative`}>
                    <div
                        onClick={() => setIsTerminalOpen(!isTerminalOpen)}
                        className="h-10 px-4 md:px-8 flex items-center justify-between cursor-pointer hover:bg-bg-surface-elevated transition-colors relative z-10"
                    >
                        <div className="flex items-center space-x-4">
                            <TerminalIcon size={14} className="text-emerald-500" />
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em]">Console</span>
                        </div>
                        <div className="flex items-center space-x-8">
                            <ChevronDown size={14} className={`transform transition-transform duration-500 ${isTerminalOpen ? '' : 'rotate-180'} text-text-muted`} />
                        </div>
                    </div>

                    {isTerminalOpen && (
                        <div
                            ref={terminalRef}
                            className="flex-1 overflow-y-auto font-mono text-[11px] p-4 md:p-10 text-emerald-400/70 leading-relaxed selection:bg-emerald-500/20 custom-scrollbar relative"
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
                                        <span className="text-accent font-black text-[10px] uppercase tracking-[0.3em]">Running Code...</span>
                                    </div>
                                )}
                                {/* Integrated view removed in favor of professional popup */}



                            </div>
                        </div>
                    )}
                </div>

                {/* Global Footer / Tiny Status Bar */}
                <footer className="h-6 bg-bg-surface-elevated border-t border-border-main flex items-center justify-between px-6 z-50">
                    <div className="flex items-center space-x-6">
                        <span className="text-[8px] font-black text-text-muted uppercase tracking-widest">BitLab Engine</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default CodeLab;
