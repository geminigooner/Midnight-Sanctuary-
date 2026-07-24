import fs from 'fs';
let code = fs.readFileSync('src/components/ChatArea.tsx', 'utf8');
code = code.replace(
  /}, \(prev, next\) => \{([\s\S]*?)prev\.reducedMotion === next\.reducedMotion;\n\}\);/g,
  '}, (prev, next) => {\n  return prev.msg === next.msg && \n         prev.isLast === next.isLast && \n         prev.isGenerating === next.isGenerating;\n});'
);
fs.writeFileSync('src/components/ChatArea.tsx', code);
