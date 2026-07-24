import fs from 'fs';
let code = fs.readFileSync('src/components/ChatArea.tsx', 'utf8');

// Find the end of MessageBubble, which is `  );\n}` followed by `interface ChatAreaProps {`
code = code.replace(
  '    </motion.div>\n  );\n}\ninterface ChatAreaProps {',
  '    </motion.div>\n  );\n}, (prev, next) => {\n  return prev.msg === next.msg && prev.isLast === next.isLast && prev.isGenerating === next.isGenerating;\n});\n\ninterface ChatAreaProps {'
);

fs.writeFileSync('src/components/ChatArea.tsx', code);
