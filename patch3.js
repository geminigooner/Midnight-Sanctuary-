import fs from 'fs';
let code = fs.readFileSync('src/components/ChatArea.tsx', 'utf8');
code = code.replace(
  "      if (!currentModelText.trim() && currentModelThought.trim()) {\n        currentModelText = currentModelThought.trim();\n        currentModelThought = '';\n      }\n\n      if (!currentModelText.trim() && currentModelThought.trim()) {\n        currentModelText = currentModelThought.trim();\n        currentModelThought = '';\n      }\n\n      if (!currentModelText && !currentModelThought) {",
  "      if (!currentModelText && !currentModelThought && !hasToolCalls) {"
);
fs.writeFileSync('src/components/ChatArea.tsx', code);
