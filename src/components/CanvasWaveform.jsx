import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ZoomIn, ZoomOut, Maximize, MoveHorizontal } from 'lucide-react';

const ROW_HEIGHT = 54;
const LABEL_WIDTH = 190;
const AXIS_HEIGHT = 26;

const NICE_STEPS = [
    1e-6, 2e-6, 5e-6, 1e-5, 2e-5, 5e-5, 1e-4, 2e-4, 5e-4,
    0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5,
    1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500,
    1000, 2000, 2500, 5000, 10000, 20000, 50000, 100000,
];

const pickStep = (span) => {
    const target = span / 8;
    return NICE_STEPS.find((s) => s >= target) || NICE_STEPS[NICE_STEPS.length - 1];
};

const formatValue = (val, radix) => {
    const v = Number.isFinite(val) ? val : 0;
    if (radix === 'hex') return '0x' + v.toString(16).toUpperCase();
    if (radix === 'bin') return '0b' + v.toString(2);
    return String(v);
};

const formatTime = (t) => {
    if (!Number.isFinite(t)) return '0';
    const abs = Math.abs(t);
    if (abs === 0) return '0';
    if (abs >= 1000) return Math.round(t).toString();
    if (abs >= 10) return t.toFixed(1).replace(/\.0$/, '');
    if (abs >= 1) return t.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return t.toPrecision(3);
};

const valueAtTime = (sig, time) => {
    const values = sig.values || [];
    let value = values.length ? values[0].value : 0;
    for (let i = 0; i < values.length; i++) {
        if (values[i].time <= time + 1e-9) value = values[i].value;
        else break;
    }
    return value;
};

const truncate = (ctx, text, maxWidth) => {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let out = text;
    while (out.length > 3 && ctx.measureText(out + '…').width > maxWidth) {
        out = out.slice(0, -1);
    }
    return out + '…';
};

const CanvasWaveform = ({ signals = [], maxTime = 0 }) => {
    const { isDarkMode } = useTheme();
    const canvasRef = useRef(null);
    const wrapRef = useRef(null);
    const dragRef = useRef(null);

    const [size, setSize] = useState({ w: 900, h: 320 });
    const [view, setView] = useState({ start: 0, span: Math.max(maxTime, 1) });
    const [radix, setRadix] = useState('hex');
    const [cursor, setCursor] = useState(null); // { x, time }

    const waveWidth = Math.max(20, size.w - LABEL_WIDTH);

    const xToTime = useCallback(
        (x) => view.start + ((x - LABEL_WIDTH) / waveWidth) * view.span,
        [view.start, view.span, waveWidth]
    );

    const clampView = useCallback((next) => {
        const total = Math.max(maxTime, 1e-6);
        const span = Math.min(Math.max(next.span, total / 500), total);
        const maxStart = Math.max(0, total - span);
        const start = Math.min(Math.max(next.start, 0), maxStart);
        return { start, span };
    }, [maxTime]);

    // Fit the whole trace whenever a new VCD arrives
    useEffect(() => {
        setView({ start: 0, span: Math.max(maxTime, 1) });
        setCursor(null);
        // 1-bit logic reads better in binary; buses in hex
        if (signals.length > 0) {
            setRadix(signals.every((s) => s.width === 1) ? 'bin' : 'hex');
        }
    }, [maxTime, signals]);

    // Track the panel size so the canvas is always full width
    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const ro = new ResizeObserver((entries) => {
            const rect = entries[0].contentRect;
            setSize({
                w: Math.max(360, Math.floor(rect.width)),
                h: Math.max(160, Math.floor(rect.height)),
            });
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;

        const bgColor = isDarkMode ? '#0b0f14' : '#ffffff';
        const panelColor = isDarkMode ? '#111827' : '#f8fafc';
        const gridColor = isDarkMode ? 'rgba(148, 163, 184, 0.18)' : 'rgba(15, 23, 42, 0.10)';
        const textColor = isDarkMode ? '#e5e7eb' : '#0f172a';
        const mutedColor = isDarkMode ? '#94a3b8' : '#64748b';
        const signal1BitColor = '#10b981';
        const signalBusColor = '#3b82f6';
        const signalBusFill = isDarkMode ? 'rgba(59, 130, 246, 0.22)' : 'rgba(59, 130, 246, 0.12)';
        const cursorColor = isDarkMode ? '#f87171' : '#dc2626';

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);

        const timeToX = (t) => LABEL_WIDTH + ((t - view.start) / view.span) * waveWidth;

        // ── Axis strip ──────────────────────────────────────────────
        ctx.fillStyle = panelColor;
        ctx.fillRect(0, 0, width, AXIS_HEIGHT);

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, AXIS_HEIGHT + 0.5);
        ctx.lineTo(width, AXIS_HEIGHT + 0.5);
        ctx.stroke();

        ctx.fillStyle = mutedColor;
        ctx.font = '700 9px Inter, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('TIME', 14, AXIS_HEIGHT / 2);
        ctx.font = '600 9px Inter, system-ui, sans-serif';
        ctx.fillText('ns', 52, AXIS_HEIGHT / 2);

        // Tick marks + labels + vertical grid
        const step = pickStep(view.span);
        const firstTick = Math.ceil(view.start / step) * step;
        ctx.font = '500 10px ui-monospace, SFMono-Regular, Menlo, monospace';
        for (let t = firstTick; t <= view.start + view.span + step * 1e-6; t += step) {
            const x = timeToX(t);
            if (x < LABEL_WIDTH - 0.5 || x > width - 2) continue;

            if (x > LABEL_WIDTH + 1) {
                ctx.strokeStyle = gridColor;
                ctx.beginPath();
                ctx.moveTo(x, AXIS_HEIGHT);
                ctx.lineTo(x, height);
                ctx.stroke();
            }

            ctx.fillStyle = mutedColor;
            if (x < LABEL_WIDTH + 14) {
                ctx.textAlign = 'left';
                ctx.fillText(formatTime(t), x + 5, AXIS_HEIGHT / 2);
            } else if (x > width - 22) {
                ctx.textAlign = 'right';
                ctx.fillText(formatTime(t), x - 5, AXIS_HEIGHT / 2);
            } else {
                ctx.textAlign = 'center';
                ctx.fillText(formatTime(t), x, AXIS_HEIGHT / 2);
            }
        }
        ctx.textAlign = 'left';

        // ── Signals ─────────────────────────────────────────────────
        signals.forEach((sig, index) => {
            const rowTop = AXIS_HEIGHT + index * ROW_HEIGHT;
            const yBase = rowTop + ROW_HEIGHT / 2;
            const yTop = yBase - 13;
            const yBottom = yBase + 13;

            // Label cell
            ctx.fillStyle = panelColor;
            ctx.fillRect(0, rowTop, LABEL_WIDTH, ROW_HEIGHT);
            ctx.strokeStyle = gridColor;
            ctx.strokeRect(0.5, rowTop + 0.5, LABEL_WIDTH, ROW_HEIGHT);

            const widthSuffix = sig.width > 1 ? ` [${sig.width - 1}:0]` : '';
            ctx.fillStyle = textColor;
            ctx.font = '600 12px Inter, system-ui, sans-serif';
            ctx.textBaseline = 'middle';
            const label = truncate(ctx, sig.name + widthSuffix, LABEL_WIDTH - 92);
            ctx.fillText(label, 14, yBase);

            // Live value in the label column
            if (cursor) {
                const valueText = formatValue(valueAtTime(sig, cursor.time), radix);
                ctx.font = '600 11px ui-monospace, SFMono-Regular, Menlo, monospace';
                ctx.fillStyle = signalBusColor;
                ctx.textAlign = 'right';
                ctx.fillText(valueText, LABEL_WIDTH - 12, yBase);
                ctx.textAlign = 'left';
            }

            // Wave area frame
            ctx.strokeStyle = gridColor;
            ctx.strokeRect(LABEL_WIDTH + 0.5, rowTop + 0.5, waveWidth, ROW_HEIGHT);

            const values = sig.values || [];
            if (!values.length) return;

            ctx.lineWidth = 1.8;

            if (sig.width === 1) {
                ctx.strokeStyle = signal1BitColor;
                ctx.beginPath();
                let prevY = values[0].value === 1 ? yTop : yBottom;
                ctx.moveTo(timeToX(values[0].time), prevY);
                for (let i = 0; i < values.length; i++) {
                    const v = values[i];
                    const x = timeToX(v.time);
                    const y = v.value === 1 ? yTop : yBottom;
                    const nextTime = i < values.length - 1 ? values[i + 1].time : view.start + view.span;
                    const nextX = timeToX(Math.min(nextTime, view.start + view.span));
                    if (y !== prevY) {
                        ctx.lineTo(x, prevY);
                        ctx.lineTo(x, y);
                        prevY = y;
                    }
                    ctx.lineTo(nextX, y);
                }
                ctx.stroke();
            } else {
                for (let i = 0; i < values.length; i++) {
                    const v = values[i];
                    const x1 = timeToX(v.time);
                    const nextTime = i < values.length - 1 ? values[i + 1].time : view.start + view.span;
                    const x2 = timeToX(Math.min(nextTime, view.start + view.span));

                    if (x2 < LABEL_WIDTH || x1 > width) continue;

                    const drawX1 = Math.max(x1, LABEL_WIDTH);
                    const drawX2 = Math.min(x2, width);
                    if (drawX1 >= drawX2) continue;

                    const clipLeft = x1 < LABEL_WIDTH;
                    const clipRight = x2 > width;
                    const startX = clipLeft ? drawX1 : x1 + 4;
                    const endX = clipRight ? drawX2 : x2 - 4;

                    ctx.fillStyle = signalBusFill;
                    ctx.strokeStyle = signalBusColor;
                    ctx.beginPath();
                    ctx.moveTo(drawX1, yBase);
                    ctx.lineTo(startX, yTop);
                    ctx.lineTo(endX, yTop);
                    ctx.lineTo(drawX2, yBase);
                    ctx.lineTo(endX, yBottom);
                    ctx.lineTo(startX, yBottom);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    if (!cursor && x2 - x1 > 56) {
                        ctx.fillStyle = textColor;
                        ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, monospace';
                        const text = formatValue(v.value, radix);
                        if (x2 - x1 > ctx.measureText(text).width + 20) {
                            ctx.fillText(text, x1 + 9, yBase);
                        }
                    }
                }
            }
        });

        // ── Cursor ──────────────────────────────────────────────────
        if (cursor && cursor.x >= LABEL_WIDTH) {
            const x = cursor.x;

            ctx.strokeStyle = cursorColor;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(x, AXIS_HEIGHT);
            ctx.lineTo(x, height);
            ctx.stroke();
            ctx.setLineDash([]);

            // Time pill in the axis
            const timeLabel = `${formatTime(cursor.time)} ns`;
            ctx.font = '700 10px ui-monospace, SFMono-Regular, Menlo, monospace';
            const pillW = ctx.measureText(timeLabel).width + 14;
            const pillX = Math.min(Math.max(x - pillW / 2, LABEL_WIDTH), width - pillW - 2);
            ctx.fillStyle = cursorColor;
            ctx.beginPath();
            ctx.roundRect(pillX, 4, pillW, AXIS_HEIGHT - 8, 4);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(timeLabel, pillX + pillW / 2, AXIS_HEIGHT / 2);
            ctx.textAlign = 'left';

            // Per-signal value badges
            ctx.font = '700 10px ui-monospace, SFMono-Regular, Menlo, monospace';
            signals.forEach((sig, index) => {
                const rowTop = AXIS_HEIGHT + index * ROW_HEIGHT;
                const yBase = rowTop + ROW_HEIGHT / 2;
                const text = formatValue(valueAtTime(sig, cursor.time), radix);
                const w = ctx.measureText(text).width + 12;
                const h = 18;
                let bx = x + 7;
                if (bx + w > width - 4) bx = x - 7 - w;
                const by = yBase - h / 2;

                ctx.fillStyle = isDarkMode ? 'rgba(37, 99, 235, 0.92)' : 'rgba(37, 99, 235, 0.92)';
                ctx.beginPath();
                ctx.roundRect(bx, by, w, h, 4);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, bx + 6, yBase);
            });
        }

        ctx.textBaseline = 'alphabetic';
    }, [signals, maxTime, view, size, cursor, radix, isDarkMode, waveWidth]);

    // Size the bitmap + repaint
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        const needed = AXIS_HEIGHT + signals.length * ROW_HEIGHT;
        const h = Math.max(needed, size.h);
        canvas.width = Math.floor(size.w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = `${size.w}px`;
        canvas.style.height = `${h}px`;
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw();
    }, [size, signals.length, draw]);

    // Scroll = pan, Ctrl+Scroll = zoom at pointer
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const onWheel = (e) => {
            if (!signals.length) return;
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;

            if (e.ctrlKey || e.metaKey) {
                const t = xToTime(Math.max(x, LABEL_WIDTH));
                const factor = e.deltaY > 0 ? 1.2 : 1 / 1.2;
                setView((v) => {
                    const nextSpan = Math.min(Math.max(v.span * factor, Math.max(maxTime, 1e-6) / 500), Math.max(maxTime, 1e-6));
                    const ratio = Math.min(Math.max((x - LABEL_WIDTH) / waveWidth, 0), 1);
                    return clampView({ span: nextSpan, start: t - ratio * nextSpan });
                });
            } else {
                const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
                setView((v) => clampView({ ...v, start: v.start + (delta / waveWidth) * v.span }));
            }
        };

        canvas.addEventListener('wheel', onWheel, { passive: false });
        return () => canvas.removeEventListener('wheel', onWheel);
    }, [signals.length, maxTime, waveWidth, clampView, xToTime]);

    // Drag to pan
    useEffect(() => {
        const onMove = (e) => {
            const drag = dragRef.current;
            if (!drag) return;
            const dx = e.clientX - drag.x;
            setView((v) => clampView({ ...v, start: drag.start - (dx / waveWidth) * v.span }));
        };
        const onUp = () => { dragRef.current = null; };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [clampView, waveWidth]);

    const handleMouseMove = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < LABEL_WIDTH) {
            setCursor(null);
            return;
        }
        const time = Math.min(Math.max(xToTime(x), 0), Math.max(maxTime, 0));
        setCursor({ x, time });
    };

    const handleMouseDown = (e) => {
        if (e.button !== 0) return;
        dragRef.current = { x: e.clientX, start: view.start };
    };

    const fit = () => setView(clampView({ start: 0, span: Math.max(maxTime, 1) }));
    const zoomBy = (factor) => setView((v) => {
        const center = v.start + v.span / 2;
        const span = v.span * factor;
        return clampView({ span, start: center - span / 2 });
    });

    const zoomPercent = Math.round((Math.max(maxTime, 1e-6) / view.span) * 100);

    return (
        <div className="w-full h-full flex flex-col bg-bg-base transition-colors duration-300">
            {/* Toolbar */}
            <div className="h-10 shrink-0 bg-bg-surface border-b border-border-main flex items-center justify-between px-3 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <select
                        value={radix}
                        onChange={(e) => setRadix(e.target.value)}
                        className="bg-bg-surface-elevated border border-border-main text-text-main text-[11px] px-2 py-1 rounded-md focus:outline-none cursor-pointer"
                    >
                        <option value="hex">Hexadecimal</option>
                        <option value="dec">Decimal</option>
                        <option value="bin">Binary</option>
                    </select>
                    <span className="hidden lg:flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted/60 ml-2">
                        <MoveHorizontal size={12} />
                        scroll to pan · ctrl+scroll to zoom · drag to move
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={() => zoomBy(1.25)} className="p-1.5 text-text-muted hover:text-text-main hover:bg-bg-surface-elevated rounded-md transition-colors" title="Zoom Out">
                        <ZoomOut size={15} />
                    </button>
                    <button onClick={fit} className="p-1.5 text-text-muted hover:text-text-main hover:bg-bg-surface-elevated rounded-md transition-colors" title="Fit whole trace">
                        <Maximize size={15} />
                    </button>
                    <button onClick={() => zoomBy(0.8)} className="p-1.5 text-text-muted hover:text-text-main hover:bg-bg-surface-elevated rounded-md transition-colors" title="Zoom In">
                        <ZoomIn size={15} />
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div ref={wrapRef} className="flex-1 min-h-0 overflow-auto custom-scrollbar relative">
                {signals.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-[11px] font-mono text-text-muted/50">
                        No signals in trace
                    </div>
                ) : (
                    <canvas
                        ref={canvasRef}
                        onMouseMove={handleMouseMove}
                        onMouseDown={handleMouseDown}
                        onMouseLeave={() => { if (!dragRef.current) setCursor(null); }}
                        onDoubleClick={fit}
                        className="block cursor-crosshair"
                    />
                )}
            </div>

            {/* Status bar */}
            <div className="h-7 shrink-0 bg-bg-surface border-t border-border-main flex items-center justify-between px-4 text-[9px] font-black text-text-muted uppercase tracking-widest gap-4">
                <div className="flex items-center gap-6 overflow-hidden">
                    <span className="whitespace-nowrap">{signals.length} signals</span>
                    <span className="whitespace-nowrap">
                        window {formatTime(view.start)} – {formatTime(view.start + view.span)} ns
                    </span>
                </div>
                <div className="flex items-center gap-6 whitespace-nowrap">
                    <span>{zoomPercent}%</span>
                    <span className={cursor ? 'text-accent' : ''}>
                        {cursor ? `${formatTime(cursor.time)} ns` : 'hover for values'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CanvasWaveform;
