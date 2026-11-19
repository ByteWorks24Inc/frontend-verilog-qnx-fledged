import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Gauge,
    XCircle,
    AlertTriangle,
    Info,
    Loader2,
    CheckCircle2,
} from 'lucide-react';

const TIERS = [
    { min: 80, label: 'Excellent', text: 'text-emerald-400', stroke: '#10b981', soft: 'text-emerald-400' },
    { min: 60, label: 'Fair', text: 'text-amber-400', stroke: '#f59e0b', soft: 'text-amber-400' },
    { min: 40, label: 'Needs work', text: 'text-orange-400', stroke: '#f97316', soft: 'text-orange-400' },
    { min: 0, label: 'Poor', text: 'text-red-400', stroke: '#ef4444', soft: 'text-red-400' },
];

const tierFor = (score) => TIERS.find((t) => score >= t.min) || TIERS[TIERS.length - 1];

const SEVERITY = {
    error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
    warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    info: { icon: Info, color: 'text-sky-400', bg: 'bg-sky-500/10' },
};

function ScoreRing({ score }) {
    const radius = 34;
    const circumference = 2 * Math.PI * radius;
    const tier = tierFor(score);
    return (
        <div className="relative shrink-0" style={{ width: 88, height: 88 }}>
            <svg viewBox="0 0 88 88" className="w-[88px] h-[88px] -rotate-90">
                <circle
                    cx="44" cy="44" r={radius}
                    fill="none" strokeWidth="8"
                    className="stroke-border-main"
                />
                <circle
                    cx="44" cy="44" r={radius}
                    fill="none" strokeWidth="8" strokeLinecap="round"
                    stroke={tier.stroke}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - Math.min(100, Math.max(0, score)) / 100)}
                    style={{ transition: 'stroke-dashoffset 600ms ease, stroke 300ms ease' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-[22px] font-black leading-none ${tier.text}`}>{score}</span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-text-muted mt-0.5">/ 100</span>
            </div>
        </div>
    );
}

function Stat({ label, value }) {
    return (
        <div className="rounded-lg bg-bg-surface-elevated border border-border-main px-2.5 py-1.5">
            <div className="text-[13px] font-bold text-text-main leading-none">{value}</div>
            <div className="text-[8px] font-black uppercase tracking-widest text-text-muted/60 mt-1">{label}</div>
        </div>
    );
}

const CodeQualityPanel = ({ report, loading }) => {
    const hasReport = report && typeof report.score === 'number' && report.grade !== 'No code';
    const tier = hasReport ? tierFor(report.score) : null;
    const findings = hasReport && Array.isArray(report.findings) ? report.findings : [];

    return (
        <div className="h-full flex flex-col bg-bg-surface min-h-0" data-testid="quality-panel">
            {/* Header */}
            <div className="h-8 shrink-0 px-4 flex items-center justify-between bg-bg-surface-elevated border-b border-border-main">
                <div className="flex items-center gap-2">
                    <Gauge size={12} className="text-accent" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">Code Quality</span>
                </div>
                {loading ? (
                    <span className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-text-muted/60">
                        <Loader2 size={10} className="animate-spin" /> analyzing
                    </span>
                ) : (
                    <span className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-emerald-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> live
                    </span>
                )}
            </div>

            {!hasReport ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
                    {loading ? (
                        <>
                            <Loader2 size={24} className="text-accent animate-spin" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted/60">Analyzing your code…</p>
                        </>
                    ) : (
                        <>
                            <Gauge size={28} className="text-text-muted/25" />
                            <p className="text-[11px] text-text-muted/60 leading-relaxed">
                                Start typing C code to see its quality score.
                            </p>
                        </>
                    )}
                </div>
            ) : (
                <>
                    {/* Score */}
                    <div className="px-4 pt-4 pb-3 flex items-center gap-4">
                        <ScoreRing score={report.score} />
                        <div className="min-w-0">
                            <div className={`text-[13px] font-black uppercase tracking-widest ${tier.text}`}>
                                {report.grade}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[9px] font-bold uppercase tracking-wider">
                                {report.errorCount > 0 && <span className="text-red-400">{report.errorCount} error{report.errorCount === 1 ? '' : 's'}</span>}
                                {report.warningCount > 0 && <span className="text-amber-400">{report.warningCount} warning{report.warningCount === 1 ? '' : 's'}</span>}
                                {report.infoCount > 0 && <span className="text-sky-400">{report.infoCount} note{report.infoCount === 1 ? '' : 's'}</span>}
                                {report.errorCount + report.warningCount + report.infoCount === 0 && (
                                    <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 size={11} /> no issues</span>
                                )}
                            </div>
                            <p className="text-[9px] text-text-muted/50 mt-1 leading-snug">Updates as you type</p>
                        </div>
                    </div>

                    {/* Metrics */}
                    <div className="px-4 pb-3 grid grid-cols-3 gap-2">
                        <Stat label="Lines" value={report.lines} />
                        <Stat label="Funcs" value={report.functions} />
                        <Stat label="Comments" value={`${Math.round(report.commentRatio)}%`} />
                    </div>

                    {/* Findings */}
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar border-t border-border-main">
                        <AnimatePresence initial={false}>
                            {findings.length === 0 ? (
                                <div className="p-4 flex items-center gap-2 text-[10px] text-emerald-400/80">
                                    <CheckCircle2 size={13} /> No issues found — nice work.
                                </div>
                            ) : (
                                findings.map((finding, index) => {
                                    const meta = SEVERITY[finding.severity] || SEVERITY.info;
                                    const Icon = meta.icon;
                                    return (
                                        <motion.div
                                            key={`${finding.rule}-${finding.line ?? 'file'}-${index}`}
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="flex items-start gap-2 px-3 py-2 border-b border-border-main/40"
                                        >
                                            <Icon size={12} className={`mt-0.5 shrink-0 ${meta.color}`} />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10.5px] leading-snug text-text-main/90">{finding.message}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {finding.line != null && (
                                                        <span className={`text-[8px] font-mono font-bold px-1.5 py-px rounded ${meta.bg} ${meta.color}`}>
                                                            L{finding.line}
                                                        </span>
                                                    )}
                                                    <span className="text-[8px] font-mono text-text-muted/40 uppercase tracking-wider">{finding.rule}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </AnimatePresence>
                    </div>
                </>
            )}
        </div>
    );
};

export default CodeQualityPanel;
