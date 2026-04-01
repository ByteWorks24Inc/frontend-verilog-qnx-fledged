import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, X, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { parseVCD } from '../utils/VCDParserCore';
import CanvasWaveform from '../components/CanvasWaveform';

const WaveformStudio = () => {
    const [vcdData, setVcdData] = useState({ signals: [], maxTime: 0 });
    const [status, setStatus] = useState('initializing'); // 'initializing', 'fetching', 'parsing', 'ready', 'error'
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    const fetchVCD = async () => {
        setStatus('fetching');
        setError(null);
        
        try {
            // Phase 6: Step 22 - Wait 2-5 seconds
            // We'll wait 3 seconds before the first fetch
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Phase 1: Step 1 - Call API
            const response = await api.get('/execute/graph?language=verilog', {
                responseType: 'text' // Phase 1: Step 2 - Read as TEXT
            });

            const vcdText = response.data; // Phase 1: Step 3 - Store in vcdText

            // Phase 2 & 3: Parse
            setStatus('parsing');
            const parsed = parseVCD(vcdText);
            
            if (parsed.signals.length === 0) {
                if (retryCount < 2) {
                    setRetryCount(prev => prev + 1);
                    setStatus('retrying');
                    return; // useEffect will trigger on retryCount change
                }
                throw new Error('No signals found in trace. Ensure $dumpfile("demo.vcd") is in your testbench.');
            }

            setVcdData(parsed);
            setStatus('ready');
        } catch (err) {
            console.error('Waveform Fetch Error:', err);
            setError(err.message || 'Failed to establish connection with simulation core.');
            setStatus('error');
        }
    };

    useEffect(() => {
        fetchVCD();
    }, [retryCount]);

    return (
        <div className="h-screen bg-[#030712] overflow-hidden flex flex-col">
            <header className="h-16 px-10 border-b border-white/5 flex items-center justify-between bg-[#0b0f1a]/50 backdrop-blur-3xl z-50">
                <div className="flex items-center space-x-6">
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                        <Zap size={20} className="fill-emerald-500/20" />
                    </div>
                    <div>
                        <h1 className="text-xs font-black text-white uppercase tracking-[0.4em]">BitLab Waveform Studio</h1>
                        <div className="flex items-center text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${status === 'ready' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                            System Status: {status.toUpperCase()}
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center space-x-6">
                    <button 
                        onClick={() => setRetryCount(prev => prev + 1)}
                        className="p-2 text-slate-500 hover:text-white transition-colors"
                        title="Force Resync"
                    >
                        <RefreshCw size={18} className={status === 'fetching' ? 'animate-spin' : ''} />
                    </button>
                    <div className="h-8 w-px bg-white/5"></div>
                    <button className="text-slate-500 hover:text-white transition-colors" onClick={() => window.close()}>
                        <X size={18} />
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    {status !== 'ready' ? (
                        <motion.div 
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex flex-col items-center justify-center p-20 text-center"
                        >
                            {status === 'error' ? (
                                <>
                                    <div className="p-10 bg-red-500/10 rounded-full mb-10 border border-red-500/20">
                                        <AlertCircle size={48} className="text-red-500" />
                                    </div>
                                    <h2 className="text-sm font-black text-white uppercase tracking-[0.3em]">{status === 'error' ? 'Connection Interrupted' : 'Syncing Core...'}</h2>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-3 max-w-sm leading-relaxed">
                                        {error}
                                    </p>
                                    <button 
                                        onClick={() => setRetryCount(0)}
                                        className="mt-8 px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] uppercase font-black tracking-widest border border-white/10 transition-all"
                                    >
                                        Retry Connection
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="relative">
                                        <motion.div 
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                            className="p-10 border-2 border-emerald-500/20 border-t-emerald-500/80 rounded-full"
                                        />
                                        <Activity size={32} className="absolute inset-0 m-auto text-emerald-500 animate-pulse" />
                                    </div>
                                    <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] mt-10">
                                        {status === 'fetching' ? 'Acquiring Signal Data...' : 'Synthesizing Waveforms...'}
                                    </h2>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-3 max-w-sm leading-relaxed">
                                        {status === 'fetching' ? 'Requesting hardware trace from remote kernel. This may take a few seconds.' : 'Normalizing simulation vectors for visual projection.'}
                                    </p>
                                </>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="ready"
                            initial={{ opacity: 0, scale: 0.99 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="h-full"
                        >
                            <CanvasWaveform signals={vcdData.signals} maxTime={vcdData.maxTime} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default WaveformStudio;

