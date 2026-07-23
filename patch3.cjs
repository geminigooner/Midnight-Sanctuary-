const fs = require('fs');
let code = fs.readFileSync('src/backend/chatHandler.ts', 'utf8');

code = code.replace(
  `const send = (data: string) => controller.enqueue(encoder.encode(data));`,
  `let isClosed = false;
      const send = (data: string) => {
        if (!isClosed) {
          try {
            controller.enqueue(encoder.encode(data));
          } catch (e) {
            isClosed = true;
          }
        }
      };
      const safeClose = () => {
        if (!isClosed) {
          isClosed = true;
          try { controller.close(); } catch (e) {}
        }
      };`
);

code = code.replace(
  `controller.close();\n      };\n      if (abortSignal)`,
  `safeClose();\n      };\n      if (abortSignal)`
);

code = code.replace(
  `controller.close();\n      } catch`,
  `safeClose();\n      } catch`
);

code = code.replace(
  `controller.close();\n        }\n      } finally`,
  `safeClose();\n        }\n      } finally`
);

fs.writeFileSync('src/backend/chatHandler.ts', code);
