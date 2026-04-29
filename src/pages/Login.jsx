import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Loader2, ShieldCheck, Zap } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-base px-4">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-sm"
            >
                {/* Logo mark */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-11 h-11 bg-accent rounded-2xl flex items-center justify-center mb-5">
                        <span className="text-text-inverse font-black text-lg">B</span>
                    </div>
                    <h1 className="text-2xl font-black text-text-main tracking-tight">BitLab</h1>
                    <p className="text-text-muted text-xs mt-1">Sign in to continue</p>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-red-500 text-xs text-center mb-5 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3"
                        >
                            {error}
                        </motion.p>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-premium text-sm"
                        placeholder="Email address"
                        required
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-premium text-sm"
                        placeholder="Password"
                        required
                    />

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-4 flex items-center justify-center gap-3 text-sm font-bold mt-2"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <span>Sign In</span>
                                <LogIn className="w-4 h-4" />
                            </>
                        )}
                    </motion.button>
                </form>

                <p className="text-center text-text-muted text-xs mt-8">
                    No account?{' '}
                    <Link to="/register" className="text-text-main font-bold hover:underline underline-offset-4 transition-all">
                        Create one
                    </Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
