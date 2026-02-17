'use client';

import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useChatStore, type ChatMessageLocal } from '@/stores/chat-store';
import { useGenerationStore } from '@/stores/generation-store';
import { readSSEStream } from '@/lib/ai/stream-handler';
import { toast } from 'sonner';

export function useChat(projectId: string) {
  const queryClient = useQueryClient();
  const {
    messages,
    isProcessing,
    processingStage,
    setMessages,
    addMessage,
    updateLastAssistantMessage,
    setProcessing,
    reset,
  } = useChatStore();

  const generationStore = useGenerationStore();

  // Load messages from DB on mount
  useEffect(() => {
    const loadMessages = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(
          data.map((m: Record<string, unknown>) => ({
            id: m.id as string,
            project_id: m.project_id as string,
            role: m.role as ChatMessageLocal['role'],
            content: m.content as string,
            metadata: (m.metadata as ChatMessageLocal['metadata']) || {},
            created_at: m.created_at as string,
          }))
        );
      }
    };

    loadMessages();

    return () => {
      reset();
    };
  }, [projectId, setMessages, reset]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isProcessing) return;

      const supabase = createClient();

      // 1. Add user message locally + persist
      const userMessage: ChatMessageLocal = {
        id: crypto.randomUUID(),
        project_id: projectId,
        role: 'user',
        content: content.trim(),
        metadata: {},
        created_at: new Date().toISOString(),
      };
      addMessage(userMessage);

      // Persist user message (fire and forget)
      supabase
        .from('chat_messages')
        .insert({
          id: userMessage.id,
          project_id: projectId,
          role: 'user',
          content: userMessage.content,
          metadata: {},
        })
        .then();

      setProcessing(true, 'parsing');

      try {
        // 2. Call parse-prompt API
        const parseResponse = await fetch('/api/chat/parse-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            prompt: content.trim(),
            chatHistory: messages.slice(-10).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!parseResponse.ok) {
          const err = await parseResponse.json();
                    if (err.error === 'subscription_required') {
                                  throw new Error('subscription_required');
                    }
          throw new Error(err.error || 'Failed to parse prompt');
        }

        const { config, planDescription } = await parseResponse.json();

        // 3. Add assistant plan message
        const planMessage: ChatMessageLocal = {
          id: crypto.randomUUID(),
          project_id: projectId,
          role: 'assistant',
          content: planDescription,
          metadata: { stage: 'generating' },
          created_at: new Date().toISOString(),
        };
        addMessage(planMessage);

        // Persist plan message
        supabase
          .from('chat_messages')
          .insert({
            id: planMessage.id,
            project_id: projectId,
            role: 'assistant',
            content: planMessage.content,
            metadata: planMessage.metadata,
          })
          .then();

        // 4. Start generation
        setProcessing(true, 'generating');
        generationStore.startGeneration();

        const genResponse = await fetch('/api/generate/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, config }),
        });

        if (!genResponse.ok) {
          let errMsg = `Generation failed (${genResponse.status})`;
          try {
            const errData = await genResponse.json();
            errMsg = errData.error || errMsg;
                        if (errData.error === 'subscription_required') {
                                        errMsg = 'subscription_required';
                        }
          } catch {
            // response might not be JSON
          }
          throw new Error(errMsg);
        }

        if (!genResponse.body) {
          throw new Error('No response stream from generation endpoint');
        }

        // 5. Read SSE stream
        for await (const event of readSSEStream(genResponse.body)) {
          generationStore.processEvent(event);

          // Update progress in chat
          if (event.type === 'component-complete') {
            const completed = event.completedFiles ?? 0;
            const total = event.totalFiles ?? 0;
            updateLastAssistantMessage(
              `${planDescription}\n\nGenerating components... (${completed}/${total})`,
              { stage: 'generating' }
            );
          }
        }

        // 6. Generation complete
        setProcessing(false, 'complete');

        const completionMessage: ChatMessageLocal = {
          id: crypto.randomUUID(),
          project_id: projectId,
          role: 'assistant',
          content:
            'Your website is ready! You can see the live preview on the right. Send another message to make changes.',
          metadata: { stage: 'complete' },
          created_at: new Date().toISOString(),
        };
        addMessage(completionMessage);

        // Persist completion message
        supabase
          .from('chat_messages')
          .insert({
            id: completionMessage.id,
            project_id: projectId,
            role: 'assistant',
            content: completionMessage.content,
            metadata: completionMessage.metadata,
          })
          .then();

        // Invalidate preview queries
        queryClient.invalidateQueries({
          queryKey: ['generated-files', projectId],
        });
        queryClient.invalidateQueries({
          queryKey: ['project', projectId],
        });
      } catch (error) {
        setProcessing(false, 'error');

        const errorMsg =
          error instanceof Error ? error.message : 'Something went wrong';

                // Handle subscription required error with upgrade prompt
                if (errorMsg === 'subscription_required') {
                            const upgradeMessage: ChatMessageLocal = {
                                          id: crypto.randomUUID(),
                                          project_id: projectId,
                                          role: 'assistant',
                                          content: '🔒 **Beta Plan Required**\n\nTo generate websites with AI, you need to subscribe to our Beta plan. The Beta plan includes credits to build and customize your website.\n\n[Upgrade to Beta Plan →](/settings/billing)',
                                          metadata: { stage: 'subscription_required' },
                                          created_at: new Date().toISOString(),
                            };
                            addMessage(upgradeMessage);
                            toast.error('Subscription required', {
                                          description: 'Please subscribe to the Beta plan to use AI generation.',
                            });
                            return;
                }

        const errorMessage: ChatMessageLocal = {
          id: crypto.randomUUID(),
          project_id: projectId,
          role: 'assistant',
          content: `Sorry, something went wrong: ${errorMsg}. Please try again.`,
          metadata: { stage: 'error' },
          created_at: new Date().toISOString(),
        };
        addMessage(errorMessage);

        // Persist error message
        supabase
          .from('chat_messages')
          .insert({
            id: errorMessage.id,
            project_id: projectId,
            role: 'assistant',
            content: errorMessage.content,
            metadata: errorMessage.metadata,
          })
          .then();

        toast.error('Generation failed', { description: errorMsg });
      }
    },
    [
      projectId,
      isProcessing,
      messages,
      addMessage,
      setProcessing,
      updateLastAssistantMessage,
      generationStore,
      queryClient,
    ]
  );

  return {
    messages,
    isProcessing,
    processingStage,
    sendMessage,
  };
}
