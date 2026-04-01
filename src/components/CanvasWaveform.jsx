import React, { useRef, useEffect, useState, useCallback } from 'react';

const CanvasWaveform = ({ signals, maxTime }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    
    // Step 19 & 20: Zoom and Pan State
    const [zoom, setZoom] = useState(1);
    const [offsetX, setOffsetX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    
    // Step 18: Cursor State
    const [cursorX, setCursorX] = useState(-1);
    const [hoverTime, setHoverTime] = useState(0);

    const ROW_HEIGHT = 60; // Step 17: Vertical Layout
    const LABEL_WIDTH = 200; // Step 13: Signal Names area
    const CANVAS_WIDTH = 1000; // Step 14: Setup Canvas

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear
        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, width, height);

        // Calculate Scale
        // Step 15: x = (time / maxTime) * canvasWidth
        // With Zoom: x = (time / maxTime) * (canvasWidth * zoom) + offsetX
        const waveAreaWidth = width - LABEL_WIDTH;
        const timeToX = (time) => {
            return (time / maxTime) * (waveAreaWidth * zoom) + LABEL_WIDTH + offsetX;
        };

        const xToTime = (x) => {
            return ((x - LABEL_WIDTH - offsetX) / (waveAreaWidth * zoom)) * maxTime;
        };

        // Draw GridLines (Optional but helpful)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        for (let i = 0; i <= 10; i++) {
            const t = (maxTime / 10) * i;
            const x = timeToX(t);
            if (x < LABEL_WIDTH) continue;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Step 16: Draw Signals
        signals.forEach((sig, index) => {
            const yBase = index * ROW_HEIGHT + ROW_HEIGHT / 2;
            const yTop = yBase - 15;
            const yBottom = yBase + 15;

            // Draw Signal Name Background
            ctx.fillStyle = 'rgba(11, 15, 26, 0.8)';
            ctx.fillRect(0, index * ROW_HEIGHT, LABEL_WIDTH, ROW_HEIGHT);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.strokeRect(0, index * ROW_HEIGHT, LABEL_WIDTH, ROW_HEIGHT);

            // Draw Signal Name
            ctx.fillStyle = 'white';
            ctx.font = '12px JetBrains Mono';
            ctx.fillText(sig.name, 20, yBase + 5);

            // Draw Waveform Area Border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.strokeRect(LABEL_WIDTH, index * ROW_HEIGHT, waveAreaWidth, ROW_HEIGHT);

            if (sig.values.length === 0) return;

            ctx.lineWidth = 2;
            
            if (sig.width === 1) {
                // Step 16: For 1-bit signals (Step-like)
                ctx.strokeStyle = '#10b981';
                ctx.beginPath();
                
                sig.values.forEach((v, i) => {
                    const x = timeToX(v.time);
                    const y = v.value === 1 ? yTop : yBottom;
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        const prevX = timeToX(sig.values[i-1].time);
                        const prevY = sig.values[i-1].value === 1 ? yTop : yBottom;
                        
                        // Horizontal to start of current change
                        ctx.lineTo(x, prevY);
                        // Vertical to new level
                        ctx.lineTo(x, y);
                    }

                    // Continue to next time or end
                    const nextTime = (i < sig.values.length - 1) ? sig.values[i+1].time : maxTime;
                    const nextX = timeToX(nextTime);
                    ctx.lineTo(nextX, y);
                });
                ctx.stroke();
            } else {
                // Step 16: For multi-bit signals (Flat line with text)
                ctx.strokeStyle = '#3b82f6';
                
                sig.values.forEach((v, i) => {
                    const x1 = timeToX(v.time);
                    const nextTime = (i < sig.values.length - 1) ? sig.values[i+1].time : maxTime;
                    const x2 = timeToX(nextTime);
                    
                    if (x2 < LABEL_WIDTH) return; // Off screen
                    
                    const drawX1 = Math.max(x1, LABEL_WIDTH);
                    const drawX2 = Math.min(x2, width);
                    
                    if (drawX1 >= drawX2) return;

                    // Draw transition lines
                    ctx.beginPath();
                    ctx.moveTo(x1, yTop); ctx.lineTo(x1 + 5, yBase); ctx.lineTo(x1, yBottom);
                    ctx.stroke();

                    // Draw horizontal lines
                    ctx.beginPath();
                    ctx.moveTo(x1 + 5, yTop); ctx.lineTo(x2 - 5, yTop);
                    ctx.moveTo(x1 + 5, yBottom); ctx.lineTo(x2 - 5, yBottom);
                    ctx.stroke();

                    // Display value as text
                    if (x2 - x1 > 30) {
                        ctx.fillStyle = 'rgba(255,255,255,0.7)';
                        ctx.font = '10px JetBrains Mono';
                        ctx.fillText(v.value.toString(16).toUpperCase(), x1 + 10, yBase + 4);
                    }
                });
            }
        });

        // Step 18: Draw Cursor
        if (cursorX >= LABEL_WIDTH) {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cursorX, 0);
            ctx.lineTo(cursorX, height);
            ctx.stroke();

            // Time Label
            ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
            ctx.fillRect(cursorX - 25, 0, 50, 15);
            ctx.fillStyle = 'white';
            ctx.font = '8px JetBrains Mono';
            ctx.fillText(Math.round(hoverTime).toString(), cursorX - 15, 12);
        }

    }, [signals, maxTime, zoom, offsetX, cursorX, hoverTime]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        // Handle high DPI
        const dpr = window.devicePixelRatio || 1;
        canvas.width = CANVAS_WIDTH * dpr;
        canvas.height = signals.length * ROW_HEIGHT * dpr;
        canvas.style.width = `${CANVAS_WIDTH}px`;
        canvas.style.height = `${signals.length * ROW_HEIGHT}px`;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        draw();
    }, [signals, draw]);

    // Interactivity Handlers
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
        
        // Calculate Time at mouse position
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

    return (
        <div 
            ref={containerRef}
            className="w-full h-full overflow-hidden flex flex-col bg-[#030712]"
            onWheel={handleWheel}
        >
            <div className="flex-1 relative cursor-crosshair">
                <canvas 
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => setCursorX(-1)}
                    className="absolute inset-0"
                />
            </div>
            
            {/* Legend / Status Bar */}
            <div className="h-8 bg-[#0b0f1a] border-t border-white/5 flex items-center px-6 justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <div className="flex items-center space-x-6">
                    <span>Signals: {signals.length}</span>
                    <span>Max Time: {maxTime}ns</span>
                </div>
                <div className="flex items-center space-x-6">
                    <span>Zoom: {zoom.toFixed(1)}x</span>
                    <span>Cursor: {Math.round(hoverTime)}ns</span>
                </div>
            </div>
        </div>
    );
};

export default CanvasWaveform;
