import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    ChevronRight,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Radio,
    FlaskConical,
    Layers,
    Wrench,
    WifiOff,
} from 'lucide-react';

// ─── Stage tag → icon / colour mapping ───────────────────────────────────────
const STAGE_META = {
    COMPILE:  { icon: Wrench,       color: 'text-sky-400',     bg: 'bg-sky-400/10',    border: 'border-sky-500/20',    label: 'Compile'    },
    ANALYZE:  { icon: FlaskConical, color: 'text-violet-400',  bg: 'bg-violet-400/10', border: 'border-violet-500/20', label: 'Analyze'    },
    ELAB:     { icon: Layers,       color: 'text-amber-400',   bg: 'bg-amber-400/10',  border: 'border-amber-500/20',  label: 'Elaborate'  },
    SIM:      { icon: Radio,        color: 'text-cyan-400',    bg: 'bg-cyan-400/10',   border: 'border-cyan-500/20',   label: 'Simulate'   },
    OK:       { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10',border: 'border-emerald-500/20',label: 'Success'    },
    DONE:     { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10',border: 'border-emerald-500/20',label: 'Complete'   },
    FAIL:     { icon: XCircle,      color: 'text-red-400',     bg: 'bg-red-400/10',    border: 'border-red-500/20',    label: 'Failed'     },
};

function parseLogLine(raw) {
    // Match [STAGE:XXX] prefix
    const m = raw.match(/^\[STAGE:([A-Z]+)\]\s*(.*)$/);
    if (m) return { type: 'stage', tag: m[1], text: m[2] };
    if (raw.startsWith('!!!')) return { type: 'error', text: raw };
    if (raw.startsWith('>>>')) return { type: 'init', text: raw };
    if (raw.startsWith('[QUEUED]')) return { type: 'info', text: raw };
    return { type: 'plain', text: raw };
}

function TerminalLine({ entry, index }) {
    if (entry.type === 'stage') {
        const meta = STAGE_META[entry.tag] || STAGE_META.SIM;
        const Icon = meta.icon;
        return (
            <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-start gap-3 px-3 py-1.5 rounded-lg border ${meta.bg} ${meta.border} mb-1.5`}
            >
                <Icon size={13} className={`${meta.color} mt-0.5 shrink-0`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${meta.color} w-16 shrink-0`}>{meta.label}</span>
                <span className="text-[11px] text-text-muted font-mono leading-relaxed">{entry.text}</span>
            </motion.div>
        );
    }
    if (entry.type === 'error') {
        return (
            <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 px-3 py-1.5 rounded-lg border bg-red-500/10 border-red-500/20 mb-1.5"
            >
                <XCircle size={13} className="text-red-400 mt-0.5 shrink-0" />
                <span className="text-[11px] font-mono text-red-300 leading-relaxed">{entry.text}</span>
            </motion.div>
        );
    }
    if (entry.type === 'init' || entry.type === 'info') {
        return (
            <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 mb-1"
            >
                <span className="text-emerald-900 font-bold mr-1 select-none text-[10px] w-8 shrink-0">{String(index).padStart(3, '0')}</span>
                <span className="text-[11px] font-mono text-emerald-400/80">{entry.text}</span>
            </motion.div>
        );
    }
    // plain
    if (!entry.text.trim()) return <div className="h-1.5" />;
    return (
        <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-3 mb-0.5"
        >
            <span className="text-emerald-900 font-bold select-none text-[10px] w-8 shrink-0">{String(index).padStart(3, '0')}</span>
            <span className="text-[11px] font-mono text-text-muted leading-relaxed">{entry.text}</span>
        </motion.div>
    );
}

// ─── QNX Worker Banner ────────────────────────────────────────────────────────
function QnxWorkerBanner({ status }) {
    if (status === 'online') return (
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            <Wifi size={12} className="animate-pulse" /> QNX Worker Online
        </div>
    );
    if (status === 'offline') return (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-[10px] font-black uppercase tracking-widest text-red-400">
            <WifiOff size={12} /> QNX Worker Offline — Contact admin to start the QNX environment
        </div>
    );
    return null; // checking
}

const CodeLab = () => {
    const { lang } = useParams();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();

    const [designCode, setDesignCode] = useState('');
    const [testbenchCode, setTestbenchCode] = useState('');
    const [logEntries, setLogEntries] = useState([]); // { type, text, tag? }
    const [loading, setLoading] = useState(false);
    const [isTerminalOpen, setIsTerminalOpen] = useState(true);
    const [vcdText, setVcdText] = useState(null);
    const [qnxWorkerStatus, setQnxWorkerStatus] = useState('unknown'); // 'checking' | 'online' | 'offline'
    const terminalRef = useRef(null);
    const studioWindowRef = useRef(null);

    const labConfig = {
        verilog: { title: 'Verilog', mode: 'verilog', icon: Binary, hasTestbench: true },
        vhdl:    { title: 'VHDL',    mode: 'vhdl',    icon: Binary, hasTestbench: true },
        qnx:     { title: 'QNX',     mode: 'cpp',     icon: TerminalIcon, hasTestbench: false },
    };
    const currentLab = labConfig[lang] || labConfig.verilog;

    // ── QNX worker health check ──
    useEffect(() => {
        if (lang !== 'qnx') return;
        const check = async () => {
            setQnxWorkerStatus('checking');
            try {
                const res = await api.get('/worker/qnx/status');
                setQnxWorkerStatus(res.data.online ? 'online' : 'offline');
            } catch {
                setQnxWorkerStatus('offline');
            }
        };
        check();
        const interval = setInterval(check, 30000); // re-ping every 30s
        return () => clearInterval(interval);
    }, [lang]);

    useEffect(() => {
        const savedDesign = localStorage.getItem(`${lang}_design_v2`);
        const savedTB = localStorage.getItem(`${lang}_tb_v2`);
        const templates = getDefaultTemplates(lang);
        setDesignCode(savedDesign || templates.design);
        setTestbenchCode(savedTB || templates.tb);
    }, [lang]);

    const getDefaultTemplates = (language) => {
        if (language === 'qnx') {
            return { design: '#include <stdio.h>\n\nint main() {\n  printf("Initializing BitLab QNX Engine...\\n");\n  return 0;\n}', tb: '' };
        } else if (language === 'verilog') {
            return {
                design: '// BitLab Verilog Template\nmodule adder(input [3:0] a, b, output [4:0] sum);\n  assign sum = a + b;\nendmodule',
                tb: '`timescale 1ns/1ps\n\nmodule tb;\nreg [3:0] a, b;\nwire [4:0] sum;\n\nadder uut (.a(a), .b(b), .sum(sum));\n\ninitial begin\n  $dumpfile("demo.vcd");\n  $dumpvars(0, tb);\n  a = 0; b = 0;\n  #10 a = 3; b = 4;\n  #10 a = 7; b = 8;\n  #10 a = 15; b = 1;\n  #10 $finish;\nend\nendmodule'
            };
        } else if (language === 'vhdl') {
            return {
                design: '-- BitLab VHDL Template\nlibrary ieee;\nuse ieee.std_logic_1164.all;\n\nentity and_gate is\n  port (\n    a : in std_logic;\n    b : in std_logic;\n    y : out std_logic\n  );\nend and_gate;\n\narchitecture rtl of and_gate is\nbegin\n  y <= a and b;\nend rtl;',
                tb: '-- VHDL Testbench\nlibrary ieee;\nuse ieee.std_logic_1164.all;\n\nentity tb is\nend tb;\n\narchitecture sim of tb is\n  signal a, b, y : std_logic;\nbegin\n  uut: entity work.and_gate\n    port map (a => a, b => b, y => y);\n\n  process\n  begin\n    a <= \'0\'; b <= \'0\';\n    wait for 10 ns;\n    a <= \'0\'; b <= \'1\';\n    wait for 10 ns;\n    a <= \'1\'; b <= \'0\';\n    wait for 10 ns;\n    a <= \'1\'; b <= \'1\';\n    wait for 10 ns;\n    wait;\n  end process;\nend sim;'
            };
        }
        return { design: '', tb: '' };
    };

    const handleSave = (val, type) => {
        if (type === 'design') {
            setDesignCode(val);
            localStorage.setItem(`${lang}_design_v2`, val);
        } else {
            setTestbenchCode(val);
            localStorage.setItem(`${lang}_tb_v2`, val);
        }
    };

    const pushLog = (raw) => setLogEntries(prev => [...prev, parseLogLine(raw)]);

    const executeCode = async () => {
        if (loading) return;

        // Gate QNX execution on worker status
        if (lang === 'qnx' && qnxWorkerStatus !== 'online') {
            setLogEntries(prev => [...prev,
                parseLogLine('!!! QNX worker is offline.'),
                parseLogLine('!!! Please contact an admin to start the QNX environment.'),
            ]);
            return;
        }

        setLoading(true);
        setVcdText(null);
        setLogEntries([]);
        pushLog(`>>> [INIT] Initializing ${lang.toUpperCase()} execution environment...`);

        try {
            const response = await api.post('/execute', {
                language: lang,
                designCode,
                testbenchCode: currentLab.hasTestbench ? testbenchCode : null
            });

            if (response.data.jobId) {
                const { jobId } = response.data;
                pushLog(`[QUEUED] Job ${jobId} — waiting for worker...`);

                let attempts = 0;
                const maxAttempts = 60;

                const poll = setInterval(async () => {
                    attempts++;
                    try {
                        const res = await api.get(`/result/${jobId}`);
                        if (res.data && res.data.status === 'DONE') {
                            clearInterval(poll);
                            if (res.data.logs) {
                                res.data.logs.split('\n').forEach(line => {
                                    if (line.trim()) pushLog(line);
                                });
                            }
                            if (res.data.errorLine) {
                                pushLog(`!!! COMPILATION ERROR: ${res.data.errorLine}`);
                            }
                            if (res.data.vcdBase64) {
                                const rawVcd = atob(res.data.vcdBase64);
                                setVcdText(rawVcd);
                                if (studioWindowRef.current && !studioWindowRef.current.closed) {
                                    studioWindowRef.current.postMessage({ type: 'load_vcd', vcd: rawVcd, lang }, '*');
                                }
                            }
                            setLoading(false);
                        } else if (res.data && res.data.status === 'RUNNING') {
                            if (attempts >= maxAttempts) {
                                clearInterval(poll);
                                pushLog('!!! TIMEOUT: Worker execution timed out.');
                                pushLog('*** PLEASE CHECK SYSTEM RESOURCES ***');
                                setLoading(false);
                            }
                        }
                    } catch (err) {
                        if (err.response && err.response.status === 404) {
                            if (attempts >= maxAttempts) {
                                clearInterval(poll);
                                pushLog('!!! TIMEOUT: Worker execution timed out.');
                                setLoading(false);
                            }
                        } else {
                            clearInterval(poll);
                            pushLog(`!!! ERROR: Failed to fetch results.`);
                            pushLog(`!!! DETAIL: ${err.message}`);
                            setLoading(false);
                        }
                    }
                }, 2000);
            }
        } catch (err) {
            const errorMsg = (err.response && err.response.data && err.response.data.message) || err.message || 'Unknown Error';
            const status = (err.response && err.response.status) ? ` [Status: ${err.response.status}]` : '';
            pushLog(`!!! CRITICAL_ERROR: Failed to connect to the server.`);
            pushLog(`!!! DETAIL: ${errorMsg}${status}`);
            if (lang === 'qnx') pushLog('*** PLEASE CONTACT MODERATOR TO TURN ON THE QNX VM SERVER ***');
            setLoading(false);
        }
    };

    const openWaveformStudio = () => {
        if (!vcdText) {
            pushLog('*** ERROR: No simulation trace data found. Run Code first. ***');
            return;
        }
        const width = 1200, height = 800;
        const left = (window.screen.width / 2) - (width / 2);
        const top = (window.screen.height / 2) - (height / 2);
        const win = window.open('/waveform', 'BitLabWaveformStudio',
            `width=${width},height=${height},top=${top},left=${left},status=no,menubar=no,toolbar=no`);
        studioWindowRef.current = win;

        const handleSync = (event) => {
            if (event.data.type === 'studio_ready' && win && !win.closed) {
                win.postMessage({ type: 'load_vcd', vcd: vcdText, lang }, '*');
            }
        };
        window.addEventListener('message', handleSync);
        setTimeout(() => {
            if (win && !win.closed) win.postMessage({ type: 'load_vcd', vcd: vcdText, lang }, '*');
            window.removeEventListener('message', handleSync);
        }, 1000);
    };

    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.ctrlKey && e.key === 'Enter') executeCode();
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [designCode, testbenchCode, loading, qnxWorkerStatus]);

    useEffect(() => {
        if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }, [logEntries]);

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

                {/* QNX Worker Banner */}
                {lang === 'qnx' && <QnxWorkerBanner status={qnxWorkerStatus} />}

                {/* Workspace */}
                <main key={lang} className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                    {/* Design Editor */}
                    <div className="flex-1 flex flex-col min-w-0 h-1/2 md:h-full">
                        <div className="h-8 px-6 flex items-center bg-bg-surface-elevated border-b border-border-main">
                            <div className="flex items-center space-x-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                                <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Code Editor</span>
                            </div>
                        </div>
                        <div className="flex-1 bg-bg-surface relative">
                            <Editor
                                theme={isDarkMode ? 'vs-dark' : 'light'}
                                language={currentLab.mode}
                                value={designCode}
                                onChange={(val) => handleSave(val, 'design')}
                                options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 20 } }}
                            />
                        </div>
                    </div>

                    {/* Testbench Editor */}
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
                                    options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 20 } }}
                                />
                            </div>
                        </div>
                    )}
                </main>

                {/* Terminal */}
                <div className={`transition-all duration-500 ${isTerminalOpen ? 'h-[300px]' : 'h-10'} border-t border-border-main bg-bg-surface flex flex-col relative`}>
                    <div
                        onClick={() => setIsTerminalOpen(!isTerminalOpen)}
                        className="h-10 px-4 md:px-8 flex items-center justify-between cursor-pointer hover:bg-bg-surface-elevated transition-colors relative z-10"
                    >
                        <div className="flex items-center space-x-4">
                            <TerminalIcon size={14} className="text-emerald-500" />
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em]">Console</span>
                            {logEntries.length > 0 && (
                                <span className="text-[9px] text-text-muted">({logEntries.length} lines)</span>
                            )}
                        </div>
                        <div className="flex items-center space-x-8">
                            <ChevronDown size={14} className={`transform transition-transform duration-500 ${isTerminalOpen ? '' : 'rotate-180'} text-text-muted`} />
                        </div>
                    </div>

                    {isTerminalOpen && (
                        <div ref={terminalRef} className="flex-1 overflow-y-auto p-4 md:p-6 leading-relaxed custom-scrollbar relative">
                            {/* Scanline */}
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-emerald-500/[0.015] to-transparent opacity-10"></div>

                            <div className="max-w-5xl relative z-10">
                                {logEntries.length === 0 && !loading && (
                                    <div className="flex items-center gap-3 text-text-muted/40 text-[11px] font-mono">
                                        <TerminalIcon size={12} />
                                        <span>Press <kbd className="px-1 py-0.5 rounded bg-bg-surface-elevated border border-border-main text-[10px]">Ctrl+Enter</kbd> or click Run Code to execute.</span>
                                    </div>
                                )}
                                {logEntries.map((entry, i) => (
                                    <TerminalLine key={i} entry={entry} index={i} />
                                ))}
                                {loading && (
                                    <div className="flex items-center space-x-4 mt-3">
                                        <span className="w-1.5 h-4 bg-accent animate-pulse rounded-sm"></span>
                                        <span className="text-accent font-black text-[10px] uppercase tracking-[0.3em]">Running Code...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="h-6 bg-bg-surface-elevated border-t border-border-main flex items-center justify-between px-6 z-50">
                    <div className="flex items-center space-x-6">
                        <span className="text-[8px] font-black text-text-muted uppercase tracking-widest">BitLab Engine</span>
                    </div>
                    {lang === 'qnx' && (
                        <div className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest ${qnxWorkerStatus === 'online' ? 'text-emerald-400' : 'text-red-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${qnxWorkerStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                            QNX {qnxWorkerStatus}
                        </div>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default CodeLab;
