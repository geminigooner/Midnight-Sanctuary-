import fs from 'fs';
let code = fs.readFileSync('src/components/MessageBubble.tsx', 'utf8');
code = code.replace(
  'export function MessageBubble({',
  'export const MessageBubble = React.memo(function MessageBubble({\n'
);
// We also need to add `})` at the end of the file.
code = code.trim() + '});\n';
fs.writeFileSync('src/components/MessageBubble.tsx', code);
