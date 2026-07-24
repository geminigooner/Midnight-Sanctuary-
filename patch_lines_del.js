import fs from 'fs';
let lines = fs.readFileSync('src/components/ChatArea.tsx', 'utf8').split('\n');

// Find export function ChatArea
let exportIndex = lines.findIndex(l => l.startsWith('export function ChatArea'));
if (exportIndex > -1) {
  // Check lines before it
  let i = exportIndex - 1;
  while (i >= 0 && (lines[i].includes('prev.msg') || lines[i].includes('});') || lines[i].includes('(prev, next)') || lines[i].includes('return prev') || lines[i].trim() === '')) {
    lines.splice(i, 1);
    i--;
  }
}
fs.writeFileSync('src/components/ChatArea.tsx', lines.join('\n'));
