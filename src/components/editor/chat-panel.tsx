'use client';

import { useRef, useEffect } from 'react';
import { useChat } from '@/lib/hooks/use-chat';
import { useGenerationStore } from '@/stores/generation-store';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { ChatWelcome } from './chat-welcome';

interface ChatPanelProps {
  projectId: string;
}

export function ChatPanel({ projectId }: ChatPanelProps) {
  const { messages, isProcessing, processingStage, sendMessage } = useChat(projectId);
  const { currentStage, progress, isGenerating } = useGenerationStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  return (
    <div className="flex h-full flex-col min-h-0">
      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {messages.length === 0 && !isProcessing ? (
          <ChatWelcome onSuggestionClick={sendMessage} />
        ) : (
          <div className="flex flex-col gap-1 p-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {/* Inline generation progress */}
            {isGenerating && (
              <div className="flex items-start gap-3 py-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    {currentStage === 'design-system' && 'Designing color scheme and typography...'}
                    {currentStage === 'blueprint' && 'Planning page structure...'}
                    {currentStage === 'components' && `Generating components... (${progress.completed}/${progress.total})`}
                    {currentStage === 'assembly' && 'Assembling project files...'}
                    {currentStage === 'config-assembly' && 'Preparing configuration...'}
                    {!currentStage && 'Starting generation...'}
                  </p>
                </div>
              </div>
            )}

            {/* Parsing indicator */}
            {processingStage === 'parsing' && !isGenerating && (
              <div className="flex items-start gap-3 py-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
                <div className="text-sm text-muted-foreground">
                  Understanding your request...
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area — ChatInput has its own border-t and padding */}
      <ChatInput
        onSend={sendMessage}
        isDisabled={isProcessing}
        placeholder={
          messages.length === 0
            ? 'Describe the website you want to build...'
            : 'Describe changes you\'d like to make...'
        }
      />
    </div>
  );
}
