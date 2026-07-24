import fs from 'fs';
let code = fs.readFileSync('src/components/ChatArea.tsx', 'utf8');

code = code.replace(
  '},\n}, (prev, next) => {\n  return prev.msg === next.msg && \n         prev.isLast === next.isLast && \n         prev.isGenerating === next.isGenerating;\n});\n\nexport function ChatArea(',
  '}\n\nexport function ChatArea('
);

fs.writeFileSync('src/components/ChatArea.tsx', code);
