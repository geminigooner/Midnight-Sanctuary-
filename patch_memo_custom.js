import fs from 'fs';
let code = fs.readFileSync('src/components/ChatArea.tsx', 'utf8');
code = code.replace(
  '\n});\n\nexport function ChatArea(',
  '\n}, (prev, next) => {\n  return prev.msg === next.msg && \n         prev.isLast === next.isLast && \n         prev.isGenerating === next.isGenerating &&\n         prev.isWaitingForToken === next.isWaitingForToken &&\n         prev.reducedMotion === next.reducedMotion;\n});\n\nexport function ChatArea('
);
fs.writeFileSync('src/components/ChatArea.tsx', code);
