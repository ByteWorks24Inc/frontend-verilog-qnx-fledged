import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ZoomIn, ZoomOut, Maximize, Settings2 } from 'lucide-react';

const CanvasWaveform = ({ signals, maxTime }) => {
    const { isDarkMode } = useTheme();
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    
    // Zoom, Pan, Radix State
    const [zoom, setZoom] = useState(1);
    const [offsetX, setOffsetX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [radix, setRadix] = useState('hex'); // 'hex', 'dec', 'bin'
    
    // Cursor State
    const [cursorX, setCursorX] = useState(-1);
    const [hoverTime, setHoverTime] = useState(0);

    const ROW_HEIGHT = 60; 
    const LABEL_WIDTH = 200; 
    const CANVAS_WIDTH = 1000; 

    const formatValue = (val, rad) => {
        if (rad === 'hex') return 'h' + val.toString(16).toUpperCase();
        if (rad === 'bin') return 'b' + val.toString(2);
        return val.toString(10);
    };

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Theme colors
        const bgColor = isDarkMode ? '#000000' : '#ffffff';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const labelBgColor = isDarkMode ? 'rgba(17, 24, 39, 0.9)' : 'rgba(243, 244, 246, 0.9)';
        const textColor = isDarkMode ? '#f9fafb' : '#111827';
        const signal1BitColor = '#10b981'; // emerald-500
        const signalBusColor = '#3b82f6'; // blue-500
        const signalBusFill = isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)';
        
        // Clear
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);

        const waveAreaWidth = width - LABEL_WIDTH;
        const timeToX = (time) => {
            return (time / maxTime) * (waveAreaWidth * zoom) + LABEL_WIDTH + offsetX;
        };

        // Draw GridLines
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            const t = (maxTime / 10) * i;
            const x = timeToX(t);
            if (x < LABEL_WIDTH) continue;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Draw Signals
        signals.forEach((sig, index) => {
            const yBase = index * ROW_HEIGHT + ROW_HEIGHT / 2;
            const yTop = yBase - 15;
            const yBottom = yBase + 15;

            // Draw Signal Name Background
            ctx.fillStyle = labelBgColor;
            ctx.fillRect(0, index * ROW_HEIGHT, LABEL_WIDTH, ROW_HEIGHT);
            ctx.strokeStyle = gridColor;
            ctx.strokeRect(0, index * ROW_HEIGHT, LABEL_WIDTH, ROW_HEIGHT);

            // Draw Signal Name
            ctx.fillStyle = textColor;
            ctx.font = '12px Inter, sans-serif';
            ctx.fillText(sig.name, 20, yBase + 4);

            // Draw Waveform Area Border
            ctx.strokeStyle = gridColor;
            ctx.strokeRect(LABEL_WIDTH, index * ROW_HEIGHT, waveAreaWidth, ROW_HEIGHT);

            if (sig.values.length === 0) return;

            ctx.lineWidth = 2;
            
            if (sig.width === 1) {
                // 1-bit signals (Step-like)
                ctx.strokeStyle = signal1BitColor;
                ctx.beginPath();
                
                sig.values.forEach((v, i) => {
                    const x = timeToX(v.time);
                    const y = v.value === 1 ? yTop : yBottom;
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        const prevX = timeToX(sig.values[i-1].time);
                        const prevY = sig.values[i-1].value === 1 ? yTop : yBottom;
                        ctx.lineTo(x, prevY);
                        ctx.lineTo(x, y);
                    }

                    const nextTime = (i < sig.values.length - 1) ? sig.values[i+1].time : maxTime;
                    const nextX = timeToX(nextTime);
                    ctx.lineTo(nextX, y);
                });
                ctx.stroke();
            } else {
                // Multi-bit signals (Bus polygon)
                sig.values.forEach((v, i) => {
                    const x1 = timeToX(v.time);
                    const nextTime = (i < sig.values.length - 1) ? sig.values[i+1].time : maxTime;
                    const x2 = timeToX(nextTime);
                    
                    if (x2 < LABEL_WIDTH) return;
                    
                    const drawX1 = Math.max(x1, LABEL_WIDTH);
                    const drawX2 = Math.min(x2, width);
                    
                    if (drawX1 >= drawX2) return;

                    // Draw bus polygon
                    ctx.fillStyle = signalBusFill;
                    ctx.strokeStyle = signalBusColor;
                    ctx.beginPath();
                    
                    // Start point
                    const isStart = i === 0 || x1 < LABEL_WIDTH;
                    const isEnd = i === sig.values.length - 1 || x2 > width;
                    
                    const startXPoly = isStart ? x1 : x1 + 5;
                    const endXPoly = isEnd ? x2 : x2 - 5;
                    
                    ctx.moveTo(x1, yBase);
                    ctx.lineTo(startXPoly, yTop);
                    ctx.lineTo(endXPoly, yTop);
                    ctx.lineTo(x2, yBase);
                    ctx.lineTo(endXPoly, yBottom);
                    ctx.lineTo(startXPoly, yBottom);
                    ctx.closePath();
                    
                    ctx.fill();
                    ctx.stroke();

                    // Display value as text
                    if (x2 - x1 > 40 && v.value !== undefined && !Number.isNaN(v.value)) {
                        ctx.fillStyle = textColor;
                        ctx.font = '10px Inter, monospace';
                        const text = formatValue(v.value, radix);
                        const textWidth = ctx.measureText(text).width;
                        if (x2 - x1 > textWidth + 10) {
                            ctx.fillText(text, x1 + 10, yBase + 3);
                        }
                    }
                });
            }
        });

        // Draw Cursor
        if (cursorX >= LABEL_WIDTH) {
            ctx.strokeStyle = isDarkMode ? 'rgba(239, 68, 68, 0.8)' : 'rgba(220, 38, 38, 0.8)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cursorX, 0);
            ctx.lineTo(cursorX, height);
            ctx.stroke();

            // Time Label
            ctx.fillStyle = isDarkMode ? 'rgba(239, 68, 68, 0.9)' : 'rgba(220, 38, 38, 0.9)';
            ctx.fillRect(cursorX - 25, 0, 50, 15);
            ctx.fillStyle = '#ffffff';
            ctx.font = '8px Inter, monospace';
            ctx.fillText(Math.round(hoverTime).toString(), cursorX - 15, 12);
        }

    }, [signals, maxTime, zoom, offsetX, cursorX, hoverTime, radix, isDarkMode]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const dpr = window.devicePixelRatio || 1;
        canvas.width = CANVAS_WIDTH * dpr;
        canvas.height = signals.length * ROW_HEIGHT * dpr;
        canvas.style.width = `${CANVAS_WIDTH}px`;
        canvas.style.height = `${signals.length * ROW_HEIGHT}px`;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        draw();
    }, [signals, draw]);

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(prev => Math.min(Math.max(prev * delta, 0.5), 100));
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.clientX - offsetX);
    };

    const handleMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        setCursorX(x);
        
        const waveAreaWidth = CANVAS_WIDTH - LABEL_WIDTH;
        const time = ((x - LABEL_WIDTH - offsetX) / (waveAreaWidth * zoom)) * maxTime;
        setHoverTime(time);

        if (isDragging) {
            setOffsetX(e.clientX - startX);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const resetView = () => {
        setZoom(1);
        setOffsetX(0);
    };

    return (
        <div 
            ref={containerRef}
            className="w-full h-full overflow-hidden flex flex-col bg-bg-base transition-colors duration-300"
            onWheel={handleWheel}
        >
            {/* Toolbar */}
            <div className="h-10 bg-bg-surface border-b border-border-main flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center">
                    <select 
                        value={radix} 
                        onChange={(e) => setRadix(e.target.value)}
                        className="bg-bg-surface-elevated border border-border-main text-text-main text-xs px-2 py-1 rounded focus:outline-none cursor-pointer"
                    >
                        <option value="hex">Hexadecimal</option>
                        <option value="dec">Decimal</option>
                        <option value="bin">Binary</option>
                    </select>
                </div>
                
                <div className="flex items-center space-x-2">
                    <button onClick={() => setZoom(z => Math.max(z * 0.8, 0.5))} className="p-1.5 text-text-muted hover:text-text-main hover:bg-bg-surface-elevated rounded-md transition-colors" title="Zoom Out">
                        <ZoomOut size={16} />
                    </button>
                    <button onClick={resetView} className="p-1.5 text-text-muted hover:text-text-main hover:bg-bg-surface-elevated rounded-md transition-colors" title="Reset View">
                        <Maximize size={16} />
                    </button>
                    <button onClick={() => setZoom(z => Math.min(z * 1.2, 100))} className="p-1.5 text-text-muted hover:text-text-main hover:bg-bg-surface-elevated rounded-md transition-colors" title="Zoom In">
                        <ZoomIn size={16} />
                    </button>
                </div>
            </div>

            <div className="flex-1 relative cursor-crosshair overflow-hidden">
                <canvas 
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => setCursorX(-1)}
                    className="absolute inset-0"
                />
            </div>
            
            {/* Status Bar */}
            <div className="h-6 bg-bg-surface border-t border-border-main flex items-center px-4 justify-between text-[9px] font-black text-text-muted uppercase tracking-widest shrink-0">
                <div className="flex items-center space-x-6">
                    <span>{signals.length} Signals</span>
                    <span>{maxTime}ns Total</span>
                </div>
                <div className="flex items-center space-x-6">
                    <span>{zoom.toFixed(1)}x</span>
                    <span>{Math.round(hoverTime)}ns</span>
                </div>
            </div>
        </div>
    );
};

export default CanvasWaveform;

