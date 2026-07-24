import fs from 'fs';
let code = fs.readFileSync('src/components/ChatArea.tsx', 'utf8');

// Find the end of MessageBubble which is before `interface ChatAreaProps`
code = code.replace(
  '  );\n}\ninterface ChatAreaProps',
  '  );\n}, (prev, next) => prev.msg === next.msg && prev.isLast === next.isLast && prev.isGenerating === next.isGenerating);\n\ninterface ChatAreaProps'
);

// Also remove the extra }, (prev, next) => ... that I accidentally added before export function ChatArea
code = code.replace(
  /}, \(prev, next\) => \{\n  return prev\.msg === next\.msg && \n         prev\.isLast === next\.isLast && \n         prev\.isGenerating === next\.isGenerating;\n\}\);\nexport function ChatArea/g,
  '}\n\nexport function ChatArea'
);

fs.writeFileSync('src/components/ChatArea.tsx', code);
