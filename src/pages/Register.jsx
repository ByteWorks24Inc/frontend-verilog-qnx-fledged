import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth';
import { UserPlus, Loader2, CheckCircle2, UserCheck, ShieldPlus } from 'lucide-react';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.trim() !== confirmPassword.trim()) {
            return setError('CONFLICT: ACCESS_CODES_MISMATCH');
        }
        setLoading(true);
        setError('');
        try {
            await authService.register(email, password);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            setError('PROTOCOL_ERROR: REGISTRATION_INTERRUPTED');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative bg-bg-base px-4 overflow-hidden transition-colors duration-300">

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-md w-full glass-card p-12 relative z-10 overflow-hidden bg-bg-surface border border-border-main"
            >

                <div className="flex flex-col items-center mb-12">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: -8 }}
                        className="w-20 h-20 bg-accent rounded-[2rem] flex items-center justify-center shadow-md mb-8"
                    >
                        <ShieldPlus className="w-10 h-10 text-text-inverse" />
                    </motion.div>
                    <h2 className="text-5xl font-black text-text-main mb-3 uppercase tracking-tighter">BITLAB</h2>
                    <p className="text-text-muted font-black text-[10px] tracking-[0.3em] uppercase">Security Protocol: Initialize</p>
                </div>

                <AnimatePresence mode="wait">
                    {success ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 p-10 rounded-[2rem] mb-8 text-center flex flex-col items-center"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                <CheckCircle2 className="w-14 h-14 mb-6" />
                            </motion.div>
                            <p className="font-black text-xs uppercase tracking-[0.3em] mb-2">Protocol Accepted</p>
                            <p className="text-[10px] opacity-60 uppercase tracking-widest">Awaiting login handshake...</p>
                        </motion.div>
                    ) : (
                        <motion.div key="form" exit={{ opacity: 0, scale: 0.9 }}>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-red-500/5 border border-red-500/10 text-red-500 p-4 rounded-2xl mb-8 text-[10px] font-black tracking-widest text-center uppercase"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="input-premium peer"
                                        placeholder=" "
                                        required
                                    />
                                    <label className="absolute left-6 top-4 text-text-muted text-[10px] font-black uppercase tracking-[0.2em] transition-all peer-focus:-top-3 peer-focus:left-4 peer-focus:text-accent peer-focus:bg-bg-surface peer-focus:px-2 peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:text-accent peer-[:not(:placeholder-shown)]:bg-bg-surface peer-[:not(:placeholder-shown)]:px-2 pointer-events-none">
                                        Engineer Identity
                                    </label>
                                </div>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="input-premium peer"
                                        placeholder=" "
                                        required
                                    />
                                    <label className="absolute left-6 top-4 text-text-muted text-[10px] font-black uppercase tracking-[0.2em] transition-all peer-focus:-top-3 peer-focus:left-4 peer-focus:text-accent peer-focus:bg-bg-surface peer-focus:px-2 peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:text-accent peer-[:not(:placeholder-shown)]:bg-bg-surface peer-[:not(:placeholder-shown)]:px-2 pointer-events-none">
                                        Security Code
                                    </label>
                                </div>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="input-premium peer"
                                        placeholder=" "
                                        required
                                    />
                                    <label className="absolute left-6 top-4 text-text-muted text-[10px] font-black uppercase tracking-[0.2em] transition-all peer-focus:-top-3 peer-focus:left-4 peer-focus:text-accent peer-focus:bg-bg-surface peer-focus:px-2 peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:left-4 peer-[:not(:placeholder-shown)]:text-accent peer-[:not(:placeholder-shown)]:bg-bg-surface peer-[:not(:placeholder-shown)]:px-2 pointer-events-none">
                                        Confirm Code
                                    </label>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02, translateY: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full btn-primary py-5 flex items-center justify-center space-x-4 group"
                                >
                                    {loading ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>
                                            <span className="tracking-[0.4em] uppercase text-xs font-black">Initialize</span>
                                            <UserCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        </>
                                    )}
                                </motion.button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-12 pt-10 border-t border-border-main text-center">
                    <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em]">
                        Access existing node?{' '}
                        <Link to="/login" className="text-accent hover:text-accent-hover transition-colors underline underline-offset-8">
                            Protocol: Authenticate
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
