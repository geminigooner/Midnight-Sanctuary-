import fs from 'fs';
let code = fs.readFileSync('src/components/ChatArea.tsx', 'utf8');

code = code.replace(
  'const handleCopy = (text: string) => navigator.clipboard.writeText(text);',
  'const handleCopy = useCallback((text: string) => { navigator.clipboard.writeText(text); }, []);\n  const handleOpenImage = useCallback((url: string) => { setSelectedImage(url); }, []);'
);

code = code.replace(
  'onOpenImage={(url) => setSelectedImage(url)}',
  'onOpenImage={handleOpenImage}'
);

fs.writeFileSync('src/components/ChatArea.tsx', code);
