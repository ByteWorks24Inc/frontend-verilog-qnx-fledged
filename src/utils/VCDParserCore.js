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

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

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
                
                signalsMap.set(name, {
                    name,
                    symbol,
                    width,
                    values: [] // Step 7: Value store
                });
            }
            continue;
        }

        // Step 8: Track Time
        // Example: #10
        if (line.startsWith('#')) {
            currentTime = parseInt(line.substring(1));
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
        // Case 2: Single-bit (1! or 0!)
        else if ((line.startsWith('0') || line.startsWith('1') || line.startsWith('x') || line.startsWith('z')) && line.length > 1) {
            const valueChar = line[0];
            const symbol = line.substring(1);
            const name = symbolMap.get(symbol);
            if (name) {
                const parsedValue = valueChar === '1' ? 1 : 0; // Simplified for basic rendering
                // Step 10: Store values
                signalsMap.get(name).values.push({ time: currentTime, value: parsedValue });
            }
        }
    }

    // Step 11: Normalize Data
    let maxTime = 0; // Step 12: Compute maxTime
    const finalSignals = Array.from(signalsMap.values()).map(sig => {
        // Sort by time
        sig.values.sort((a, b) => a.time - b.time);
        
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
