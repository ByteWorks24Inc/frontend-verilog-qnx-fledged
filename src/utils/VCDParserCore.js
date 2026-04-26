/**
 * VCD Parser Core - Implementing user-defined Phases 2 & 3.
 * Specialized for Verilog as requested.
 */

export const parseVCD = (vcdText) => {
    if (!vcdText) return { signals: [], maxTime: 0 };

    // Step 4: Split into lines
    const lines = vcdText.split('\n');

    // Step 6: Build Symbol Map (symbol -> signal name)
    const symbolMap = new Map();
    // Step 7: Initialize Signal Storage ({ name, values, width })
    const signalsMap = new Map();
    
    let currentTime = 0; // Step 8: Track Time
    let timeScaleMultiplier = 1; // Default to 1 (assume ns)
    let inTimescale = false;

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        if (line.startsWith('$timescale')) {
            inTimescale = true;
            const parts = line.split(/\s+/);
            if (parts.length > 2) {
                const unit = parts[2];
                if (unit === 'fs') timeScaleMultiplier = 1e-6;
                else if (unit === 'ps') timeScaleMultiplier = 1e-3;
                else if (unit === 'us') timeScaleMultiplier = 1e3;
                else if (unit === 'ms') timeScaleMultiplier = 1e6;
                else if (unit === 's') timeScaleMultiplier = 1e9;
                else if (unit === 'ns') timeScaleMultiplier = 1;
            }
            if (line.includes('$end')) inTimescale = false;
            continue;
        }

        if (inTimescale) {
            if (line.includes('fs')) timeScaleMultiplier = 1e-6;
            else if (line.includes('ps')) timeScaleMultiplier = 1e-3;
            else if (line.includes('us')) timeScaleMultiplier = 1e3;
            else if (line.includes('ms')) timeScaleMultiplier = 1e6;
            else if (line.includes('s')) timeScaleMultiplier = 1e9;
            else if (line.includes('ns')) timeScaleMultiplier = 1;
            
            if (line.includes('$end')) inTimescale = false;
            continue;
        }

        // Step 5: Extract Signal Definitions
        // Example: $var wire 4 ! a $
        if (line.startsWith('$var')) {
            const parts = line.split(/\s+/);
            if (parts.length >= 6) {
                const type = parts[1]; // wire, reg, etc.
                const width = parseInt(parts[2]); // Step 5: Extract width
                const symbol = parts[3]; // Step 5: Extract symbol
                const name = parts[4]; // Step 5: Extract name
                
                symbolMap.set(symbol, name); // Step 6: Map symbol to name
                
                // If it already exists, don't overwrite the symbol object to avoid mixing values incorrectly, 
                // but for Verilog compatibility we keep tracking by name.
                if (!signalsMap.has(name)) {
                    signalsMap.set(name, {
                        name,
                        symbol,
                        width,
                        values: [] // Step 7: Value store
                    });
                }
            }
            continue;
        }

        // Step 8: Track Time
        // Example: #10
        if (line.startsWith('#')) {
            currentTime = parseInt(line.substring(1)) * timeScaleMultiplier;
            continue;
        }

        // Step 9: Parse Value Changes
        // Case 1: Multi-bit (b0011 !)
        if (line.startsWith('b') || line.startsWith('B')) {
            const parts = line.split(/\s+/);
            if (parts.length >= 1) {
                const valuePart = parts[0].substring(1);
                const symbol = parts[1] || "";
                const name = symbolMap.get(symbol);
                if (name) {
                    const parsedValue = parseInt(valuePart, 2);
                    // Step 10: Store values
                    signalsMap.get(name).values.push({ time: currentTime, value: parsedValue });
                }
            }
        } 
        // Case 2: Single-bit (1! or 0! or VHDL U!)
        else if (/^[01xzXZUWLH\-]/i.test(line) && !line.toLowerCase().startsWith('b')) {
            // Some simulators put a space, some don't. We just take the first char as value.
            const valueChar = line[0].toUpperCase();
            const symbol = line.substring(1).trim();
            const name = symbolMap.get(symbol);
            if (name) {
                // For basic rendering: 1 and H are high, rest are low (0, U, X, Z, W, L, -)
                const parsedValue = (valueChar === '1' || valueChar === 'H') ? 1 : 0;
                // Step 10: Store values
                signalsMap.get(name).values.push({ time: currentTime, value: parsedValue });
            }
        }
    }

    // Step 11: Normalize Data & Deduplicate
    let maxTime = 0; // Step 12: Compute maxTime
    const finalSignals = Array.from(signalsMap.values()).map(sig => {
        // Sort by time
        sig.values.sort((a, b) => a.time - b.time);
        
        // Deduplicate consecutive identical values or values at the exact same time
        const deduplicated = [];
        for (let i = 0; i < sig.values.length; i++) {
            const current = sig.values[i];
            const prev = deduplicated.length > 0 ? deduplicated[deduplicated.length - 1] : null;
            
            if (prev) {
                // If same time, overwrite with latest delta cycle value
                if (current.time === prev.time) {
                    deduplicated[deduplicated.length - 1] = current;
                    continue;
                }
                // If same value as previous time, it's redundant for drawing
                if (current.value === prev.value) {
                    continue;
                }
            }
            deduplicated.push(current);
        }
        sig.values = deduplicated;

        if (sig.values.length > 0) {
            const lastTime = sig.values[sig.values.length - 1].time;
            if (lastTime > maxTime) maxTime = lastTime;
        }
        
        return sig;
    });

    return {
        signals: finalSignals,
        maxTime
    };
};
