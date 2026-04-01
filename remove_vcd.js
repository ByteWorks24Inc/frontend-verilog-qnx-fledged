const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'CodeLab.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Remove state vars
content = content.replace(/const \[vcdData, setVcdData\] = useState\(null\);\r?\n/, '');
content = content.replace(/const \[isVcdOpen, setIsVcdOpen\] = useState\(false\);\r?\n/, '');

// 2. Remove downloadVcd
content = content.replace(/const downloadVcd = \(\) => \{[\s\S]*?URL\.revokeObjectURL\(url\);\r?\n\s*\};\r?\n/, '');

// 3. Update executeCode
const execCodeStart = `const executeCode = async () => {
        if (loading) return;
        setLoading(true);
        setLogs(prev => [...prev, \`>>> [INIT] Initializing target environment: \${lang.toUpperCase()}...\`]);`;
const execCodeStartNew = `const executeCode = async () => {
        if (loading) return;
        setLoading(true);
        const img = document.getElementById("waveform");
        if (img) {
            img.src = "";
            img.alt = "Generating waveform...";
        }
        setLogs(prev => [...prev, \`>>> [INIT] Initializing target environment: \${lang.toUpperCase()}...\`]);`;
content = content.replace(execCodeStart, execCodeStartNew);

const execCodeSuccess = `} else {
                const { logs: outputLogs } = response.data;
                if (outputLogs) {
                    setLogs(prev => [...prev, ...outputLogs.split('\\n')]);
                }
                setLoading(false);
            }`;
const execCodeSuccessNew = `} else {
                const { logs: outputLogs } = response.data;
                if (outputLogs) {
                    setLogs(prev => [...prev, ...outputLogs.split('\\n')]);
                }
                const img = document.getElementById("waveform");
                if (img) {
                    img.src = \`\${api.defaults.baseURL}/execute/graph?language=\${lang}&t=\${Date.now()}\`;
                }
                setLoading(false);
            }`;
content = content.replace(execCodeSuccess, execCodeSuccessNew);

// 4. Remove openWaveform
content = content.replace(/const openWaveform = async \(\) => \{[\s\S]*?finally \{\r?\n\s*setLoading\(false\);\r?\n\s*\}\r?\n\s*\};\r?\n/, '');

// 5. Remove 'View Waveform' button
// The button contains: <span>View Waveform</span>
const buttonRegex = /\{lang !== 'qnx' && \([\s\S]*?<span>View Waveform<\/span>\r?\n\s*<\/motion\.button>\r?\n\s*\)\}/;
content = content.replace(buttonRegex, '');

// 6. Add waveform image to terminal
const logsContainerEnd = `                                )}
                            </div>
                        </div>
                    )}`;
const logsContainerEndNew = `                                )}
                                {lang !== 'qnx' && (
                                    <img id="waveform" style={{ width: '100%', marginTop: '20px' }} alt="" />
                                )}
                            </div>
                        </div>
                    )}`;
content = content.replace(logsContainerEnd, logsContainerEndNew);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Update complete.');
