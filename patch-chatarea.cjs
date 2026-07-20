const fs = require('fs');
let code = fs.readFileSync('src/components/ChatArea.tsx', 'utf8');

// Update message bubble
code = code.replace(
  `  const isWaitingForToken = isGenerating && isLast && !isUser && (!msg.parts?.[0]?.text || msg.parts[0].text.length === 0);`,
  `  const textParts = msg.parts?.filter(p => !p.thought && p.text) || [];
  const thoughtParts = msg.parts?.filter(p => p.thought) || [];
  const publicText = textParts.map(p => p.text).join('\\n');
  const thoughtText = thoughtParts.map(p => p.text).join('\\n');
  const isWaitingForToken = isGenerating && isLast && !isUser && !publicText && !thoughtText;
  const [showThought, setShowThought] = useState(false);`
);

code = code.replace(
  `          <div className={\`prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-glass-border \${msg.parts?.[0]?.text?.includes('[Generation stopped: repetition loop detected.]') ? 'text-copper/90' : ''}\`}>
            {isWaitingForToken ? (
              <GemmaTypingIndicator />
            ) : (
              <>
                <Markdown>{msg.parts?.[0]?.text || ''}</Markdown>`,
  `          <div className={\`prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-glass-border \${publicText.includes('[Generation stopped: repetition loop detected.]') ? 'text-copper/90' : ''}\`}>
            {isWaitingForToken ? (
              <GemmaTypingIndicator />
            ) : (
              <>
                {thoughtText && (
                  <div className="mb-3 text-sm">
                    <button 
                      onClick={() => setShowThought(!showThought)}
                      className="flex items-center gap-2 text-mauve hover:text-champagne transition-colors pb-1"
                    >
                      <span className="opacity-70 text-xs font-mono uppercase tracking-wider">Thought summary</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={\`transition-transform \${showThought ? 'rotate-180' : ''}\`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    {showThought && (
                      <div className="p-3 bg-black/20 rounded-xl border border-white/5 mt-1 text-mauve whitespace-pre-wrap font-mono text-xs">
                        {thoughtText}
                      </div>
                    )}
                  </div>
                )}
                {publicText && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                    <Markdown>{publicText}</Markdown>
                  </motion.div>
                )}`
);

// fix copy logic
code = code.replace(
  `onCopy(msg.parts?.[0]?.text || '');`,
  `onCopy(publicText);`
).replace(
  `onCopy(msg.parts?.[0]?.text || '');`,
  `onCopy(publicText);`
).replace(
  `setEditContent(msg.parts?.[0]?.text || '');`,
  `setEditContent(publicText);`
).replace(
  `onFavorite?.(msg.parts?.[0]?.text || '');`,
  `onFavorite?.(publicText);`
);

// fix streaming logic in ChatArea
const streamChatOld = `      const generator = streamChat(newMessages, settings, gifts, abortControllerRef.current.signal);
      
      newMessages.push({ id: modelMsgId, role: 'model', parts: [{ text: '' }], timestamp: Date.now() });
      onUpdate(conversation.id, { messages: [...newMessages] });

      for await (const chunk of generator) {
        if (typeof chunk === 'string') {
          if (isFirstChunk) {
            setPresence('responding');
            isFirstChunk = false;
          }
          currentModelText += chunk;
          onUpdate(conversation.id, {
            messages: newMessages.map(m => m.id === modelMsgId ? { ...m, parts: [{ text: currentModelText }] } : m)
          });
        } else if (chunk && typeof chunk === 'object') {
          if (chunk.type === 'gift') {
            onAddGift({
              from: 'gemma',
              content: chunk.content,
              gift_type: chunk.gift_type,
              reason: chunk.reason
            });
          } else if (chunk.type === 'memory') {
            onAddMemory(chunk.content, 'gemma_initiated');
          } else if (chunk.type === 'eventLog') {
            onAddEventLog(chunk.description);
          }
        }
      }
      onUpdateJewel(prev => ({
        ...prev,
        totalMessages: prev.totalMessages + 1,
        totalResponseCharacters: prev.totalResponseCharacters + currentModelText.length,
        lastInteractionTimestamp: Date.now()
      }));
      setTemporaryPresence('complete', 'resting');
    } catch (e: any) {
      if (e.name === 'AbortError') {
         // It was aborted manually, keep what we have
      } else if (e.name === 'RepetitionError') {
         currentModelText += e.message;
         onUpdate(conversation.id, {
           messages: newMessages.map(m => m.id === modelMsgId ? { ...m, parts: [{ text: currentModelText }] } : m)
         });
         setTemporaryPresence('repetition_stopped', 'resting', 5000);
      } else if (e.name === 'RateLimitError') {
         currentModelText += \`\\n\\n*\${e.message}*\`;
         onUpdate(conversation.id, {
           messages: newMessages.map(m => m.id === modelMsgId ? { ...m, parts: [{ text: currentModelText }] } : m)
         });
         setTemporaryPresence('rate_limit', 'resting', 3000);
      } else {
         currentModelText += \`\\n\\n[Error: \${e.message}]\`;
         onUpdate(conversation.id, {
           messages: newMessages.map(m => m.id === modelMsgId ? { ...m, parts: [{ text: currentModelText }] } : m)
         });
         setTemporaryPresence('error', 'resting', 5000);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }`;

const streamChatNew = `      let currentModelThought = '';
      let hasToolCalls = false;
      const generator = streamChat(newMessages, settings, gifts, abortControllerRef.current.signal);
      
      newMessages.push({ id: modelMsgId, role: 'model', parts: [], timestamp: Date.now() });
      onUpdate(conversation.id, { messages: [...newMessages] });

      const updateModelMessage = (text: string, thought: string) => {
         let updatedParts = [];
         if (text) updatedParts.push({ text: text });
         if (thought) updatedParts.push({ text: thought, thought: true });
         
         onUpdate(conversation.id, {
           messages: newMessages.map(m => m.id === modelMsgId ? { ...m, parts: updatedParts } : m)
         });
      };

      for await (const chunk of generator) {
        if (typeof chunk === 'string') {
          if (isFirstChunk) {
            setPresence('responding');
            isFirstChunk = false;
          }
          currentModelText += chunk;
          updateModelMessage(currentModelText, currentModelThought);
        } else if (chunk && typeof chunk === 'object') {
          if (chunk.type === 'thought') {
            currentModelThought += chunk.text;
            updateModelMessage(currentModelText, currentModelThought);
          } else if (chunk.type === 'gift') {
            hasToolCalls = true;
            onAddGift({
              from: 'gemma',
              content: chunk.content,
              gift_type: chunk.gift_type,
              reason: chunk.reason
            });
          } else if (chunk.type === 'memory') {
            hasToolCalls = true;
            onAddMemory(chunk.content, 'gemma_initiated');
          } else if (chunk.type === 'eventLog') {
            hasToolCalls = true;
            onAddEventLog(chunk.description);
          }
        }
      }
      
      if (!currentModelText && !currentModelThought) {
         onUpdate(conversation.id, {
           messages: newMessages.filter(m => m.id !== modelMsgId)
         });
      } else {
        onUpdateJewel(prev => ({
          ...prev,
          totalMessages: prev.totalMessages + 1,
          totalResponseCharacters: prev.totalResponseCharacters + currentModelText.length,
          lastInteractionTimestamp: Date.now()
        }));
      }
      setTemporaryPresence('complete', 'resting');
    } catch (e: any) {
      if (e.name === 'AbortError') {
         // It was aborted manually, keep what we have
      } else if (e.name === 'RepetitionError') {
         currentModelText += e.message;
         updateModelMessage(currentModelText, currentModelThought);
         setTemporaryPresence('repetition_stopped', 'resting', 5000);
      } else if (e.name === 'RateLimitError') {
         currentModelText += \`\\n\\n*\${e.message}*\`;
         updateModelMessage(currentModelText, currentModelThought);
         setTemporaryPresence('rate_limit', 'resting', 3000);
      } else {
         if (!currentModelText && !currentModelThought) {
            onUpdate(conversation.id, {
              messages: newMessages.filter(m => m.id !== modelMsgId)
            });
            setTemporaryPresence('error', 'resting', 5000);
         } else {
            currentModelText += \`\\n\\n[Error: \${e.message}]\`;
            updateModelMessage(currentModelText, currentModelThought);
            setTemporaryPresence('error', 'resting', 5000);
         }
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }`;

code = code.replace(streamChatOld, streamChatNew);

fs.writeFileSync('src/components/ChatArea.tsx', code);
console.log('done');
