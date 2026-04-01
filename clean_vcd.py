import sys

try:
    with open('src/pages/CodeLab.jsx', 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Find openWaveform start
    start_idx = -1
    end_idx = -1
    for i, line in enumerate(lines):
        if 'const openWaveform = async () => {' in line:
            start_idx = i
            break
    
    if start_idx != -1:
        # Find the matching closing bracket for openWaveform
        # By just finding the end of the try...catch...finally block
        for i in range(start_idx, len(lines)):
            if '    // Keyboard & UI Sync' in lines[i]:
                end_idx = i - 1
                break
        
        if end_idx != -1:
            del lines[start_idx:end_idx]
            print(f"Removed lines {start_idx} to {end_idx}")
    
    # Remove "View Waveform" button
    # Locate: {lang !== 'qnx' && ( ... </motion.button> )}
    start_btn_idx = -1
    end_btn_idx = -1
    for i, line in enumerate(lines):
        if "{lang !== 'qnx' && (" in line:
            # check if openWaveform is in the next few lines, specifically disabled={loading}
            if i + 4 < len(lines) and 'onClick={openWaveform}' in lines[i+4]:
                start_btn_idx = i
                for j in range(i, len(lines)):
                    if '                        )}' in lines[j]:
                        end_btn_idx = j + 1
                        break
                break
                
    if start_btn_idx != -1 and end_btn_idx != -1:
        del lines[start_btn_idx:end_btn_idx]
        print(f"Removed button lines {start_btn_idx} to {end_btn_idx}")
        
    with open('src/pages/CodeLab.jsx', 'w', encoding='utf-8') as f:
        f.writelines(lines)
        
    print("Success")
except Exception as e:
    print(f"Error: {e}")
