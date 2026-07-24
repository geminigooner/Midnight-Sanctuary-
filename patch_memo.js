import fs from 'fs';
let code = fs.readFileSync('src/components/ChatArea.tsx', 'utf8');
code = code.replace(
  'function MessageBubble({ \n  msg, ',
  'const MessageBubble = React.memo(function MessageBubble({ \n  msg, '
);
// Now we need to find where MessageBubble ends and add the closing parenthesis.
// It ends right before `export function ChatArea`
code = code.replace(
  '\nexport function ChatArea(',
  '\n});\n\nexport function ChatArea('
);
fs.writeFileSync('src/components/ChatArea.tsx', code);
