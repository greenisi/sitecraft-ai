'use client';

import { useRef, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChat } from '@/lib/hooks/use-chat';
import { usePlan } from '@/lib/hooks/use-plan';
import { useGenerationStore } from '@/stores/generation-store';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { ChatWelcome } from './chat-welcome';
import { GenerationProgress } from './generation-progress';
import { useUpgradeGate, LockBadge } from './upgrade-gate';
import { Sparkles, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ChatPanelProps {
  projectId: string;
}

export function ChatPanel({ projectId }: ChatPanelProps) {
  const { messages, isProcessing, processingStage, sendMessage } =
    useChat(projectId);
  const { currentStage, progress, isGenerating, projectId: genProjectId } =
    useGenerationStore();
  const { isPaid, loading: planLoading } = usePlan();
  const { modal: upgradeModal, showUpgrade } = useUpgradeGate();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [projectName, setProjectName] = useState<string>('');
  const [projectDescription, setProjectDescription] = useState<string>('');
  const [inputPrefill, setInputPrefill] = useState<string>('');

  // Only show generation UI if it belongs to THIS project
  const isGeneratingThisProject = isGenerating && genProjectId === projectId;

  useEffect(() => {
    const fetchProject = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .single();
      if (data) {
        setProjectName(data.name || '');
      }
      const desc = searchParams.get('desc') || '';
      if (desc) setProjectDescription(desc);
    };
    fetchProject();
  }, [projectId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  const handleGatedAction = (action: () => void) => {
    if (!isPaid && !planLoading) {
      showUpgrade();
      return;
    }
    action();
  };

  const handleSuggestionClick = (prompt: string) => {
    handleGatedAction(() => setInputPrefill(prompt));
  };

  const handleSend = (content: string, attachments?: File[]) => {
    handleGatedAction(() => sendMessage(content, attachments));
  };

  return (
    <div className="flex h-full flex-col min-h-0">
      {upgradeModal}

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
      >
        {messages.length === 0 && !isProcessing ? (
          <ChatWelcome
            onSuggestionClick={handleSuggestionClick}
            projectName={projectName}
            projectDescription={projectDescription}
            isPaid={isPaid}
          />
        ) : (
          <div className="flex flex-col gap-1 p-4">
            {messages.map((message, index) => (
              <div key={message.id}>
                <ChatMessage message={message} />

                {/* Show follow-up suggestions after completion messages */}
                {message.metadata?.stage === 'complete' &&
                  message.metadata?.followUpSuggestions &&
                  message.metadata.followUpSuggestions.length > 0 &&
                  index === messages.length - 1 &&
                  !isProcessing && (
                    <div className="flex flex-wrap gap-2 mt-3 ml-11">
                      {message.metadata.followUpSuggestions.map(
                        (suggestion: string, i: number) => (
                          <button
                            key={i}
                            onClick={() =>
                              handleSuggestionClick(suggestion)
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 ${
                              isPaid
                                ? 'border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/40 hover:scale-105'
                                : 'border-gray-500/20 bg-gray-500/5 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {isPaid ? (
                              <Sparkles className="h-3 w-3" />
                            ) : (
                              <Lock className="h-3 w-3" />
                            )}
                            {suggestion}
                          </button>
                        )
                      )}
                    </div>
                  )}
              </div>
            ))}

            {/* Generation Progress with live code viewer + checklist */}
            {isGeneratingThisProject && <GenerationProgress />}

            {/* Parsing indicator */}
            {processingStage === 'parsing' && !isGeneratingThisProject && (
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

      {/* Input Area */}
      <ChatInput
        onSend={handleSend}
        isDisabled={isProcessing}
        isPaid={isPaid}
        onUpgradeClick={showUpgrade}
        prefillValue={inputPrefill}
        onPrefillConsumed={() => setInputPrefill('')}
        placeholder={
          !isPaid
            ? 'Upgrade to Pro to use AI generation...'
            : messages.length === 0
            ? 'Describe the website you want to build...'
            : "Describe changes you'd like to make..."
        }
      />
    </div>
  );
}

