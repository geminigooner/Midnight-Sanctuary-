import fs from 'fs';
let lines = fs.readFileSync('src/components/ChatArea.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i] === '}' && lines[i+2] === 'interface ChatAreaProps {') {
    lines[i] = '}, (prev, next) => prev.msg === next.msg && prev.isLast === next.isLast && prev.isGenerating === next.isGenerating);';
    break;
  }
}

fs.writeFileSync('src/components/ChatArea.tsx', lines.join('\n'));
