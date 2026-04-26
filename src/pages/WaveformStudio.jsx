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

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data && event.data.type === 'load_vcd') {
                setStatus('parsing');
                try {
                    const parsed = parseVCD(event.data.vcd);
                    if (parsed.signals.length === 0) {
                        throw new Error('No signals found in trace. Ensure $dumpfile("demo.vcd") is in your testbench.');
                    }
                    setVcdData(parsed);
                    setStatus('ready');
                } catch (err) {
                    setError(err.message);
                    setStatus('error');
                }
            }
        };

        window.addEventListener('message', handleMessage);
        
        // Tell parent we are ready to receive data
        if (window.opener) {
            window.opener.postMessage({ type: 'studio_ready' }, '*');
        }

        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <div className="h-screen bg-bg-base overflow-hidden flex flex-col transition-colors duration-300">
            <header className="h-16 px-10 border-b border-border-main flex items-center justify-between bg-bg-surface backdrop-blur-3xl z-50">
                <div className="flex items-center space-x-6">
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                        <Zap size={20} className="fill-emerald-500/20" />
                    </div>
                    <div>
                        <h1 className="text-xs font-black text-text-main uppercase tracking-[0.4em]">Waveform Explorer</h1>
                    </div>
                </div>
                
                <div className="flex items-center space-x-6">
                    <button 
                        onClick={() => setRetryCount(prev => prev + 1)}
                        className="p-2 text-text-muted hover:text-text-main transition-colors"
                        title="Force Resync"
                    >
                        <RefreshCw size={18} className={status === 'fetching' ? 'animate-spin' : ''} />
                    </button>
                    <div className="h-8 w-px bg-border-main"></div>
                    <button className="text-text-muted hover:text-text-main transition-colors" onClick={() => window.close()}>
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
                                    <h2 className="text-sm font-black text-text-main uppercase tracking-[0.3em]">{status === 'error' ? 'Connection Interrupted' : 'Syncing Core...'}</h2>
                                    <p className="text-[10px] text-text-muted uppercase tracking-widest mt-3 max-w-sm leading-relaxed">
                                        {error}
                                    </p>
                                    <button 
                                        onClick={() => setRetryCount(0)}
                                        className="mt-8 px-8 py-3 bg-bg-surface-elevated hover:bg-border-main text-text-main rounded-xl text-[10px] uppercase font-black tracking-widest border border-border-main transition-all"
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
                                    <h2 className="text-sm font-black text-text-main uppercase tracking-[0.3em] mt-10">
                                        {status === 'fetching' ? 'Connecting...' : 'Processing...'}
                                    </h2>
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

