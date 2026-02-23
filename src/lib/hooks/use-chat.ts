'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useChatStore, type ChatMessageLocal } from '@/stores/chat-store';
import { useGenerationStore } from '@/stores/generation-store';
import {
  startBackgroundGeneration,
  subscribe as bgSubscribe,
  getGenerationState,
  isGenerating as bgIsGenerating,
  clearGeneration,
} from '@/lib/generation/background-generation';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isConnectionError(msg: string): boolean {
  return (
    msg === 'Load failed' ||
    msg === 'Failed to fetch' ||
    msg === 'NetworkError when attempting to fetch resource.' ||
    msg.includes('network') ||
    msg.includes('aborted')
  );
}

interface GenerationStatus {
  projectStatus: string;
  lastGeneratedAt: string | null;
  latestVersion: {
    id: string;
    versionNumber: number;
    status: string;
    generationTimeMs: number | null;
    completedAt: string | null;
    createdAt: string;
  } | null;
  fileCount: number;
}

async function pollForCompletion(
  projectId: string,
  versionCreatedAfter: string
): Promise<GenerationStatus | null> {
  const MAX_ATTEMPTS = 60;
  const INTERVAL_MS = 5_000;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
    try {
      const res = await fetch(
        `/api/generate/status?projectId=${encodeURIComponent(projectId)}`
      );
      if (!res.ok) continue;
      const data: GenerationStatus = await res.json();
      if (
        data.latestVersion &&
        data.latestVersion.createdAt >= versionCreatedAfter
      ) {
        if (
          data.latestVersion.status === 'complete' ||
          data.latestVersion.status === 'error'
        ) {
          return data;
        }
      }
      if (
        data.projectStatus === 'generated' ||
        data.projectStatus === 'error'
      ) {
        return data;
      }
    } catch {
      // Network still down - keep trying
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const autoTriggeredProjectIds = new Set<string>();

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
  const templateAutoTriggered = useRef(false);
  const followUpSuggestionsRef = useRef<string[]>([]);

  // ── Reset generation store when projectId changes ──
  // This prevents generation state from project A leaking into project B
  useEffect(() => {
    const storeProjectId = useGenerationStore.getState().projectId;
    if (storeProjectId && storeProjectId !== projectId) {
      generationStore.reset();
    }
  }, [projectId, generationStore]);

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

  // Reconnect to background generation if one is in progress for this project
  useEffect(() => {
    const bgState = getGenerationState(projectId);
    if (bgState && bgState.status === 'generating') {
      setProcessing(true, 'generating');
      generationStore.startGeneration(projectId);

      for (const event of bgState.events) {
        generationStore.processEvent(event);
      }
    }

    const unsub = bgSubscribe(projectId, (state) => {
      // Only process events if the generation store is tracking this project
      const currentStoreProject = useGenerationStore.getState().projectId;
      if (currentStoreProject && currentStoreProject !== projectId) return;

      if (state.status === 'generating') {
        const lastEvent = state.events[state.events.length - 1];
        if (lastEvent) {
          generationStore.processEvent(lastEvent);

          if (lastEvent.type === 'component-complete') {
            const completed = lastEvent.completedFiles ?? 0;
            const total = lastEvent.totalFiles ?? 0;
            updateLastAssistantMessage(
              `Generating components... (${completed}/${total})`,
              { stage: 'generating' }
            );
          }
        }
      } else if (state.status === 'complete') {
        handleGenerationComplete();
      } else if (state.status === 'error') {
        setProcessing(false, 'error');
        generationStore.reset();

        const errorMessage: ChatMessageLocal = {
          id: crypto.randomUUID(),
          project_id: projectId,
          role: 'assistant',
          content: `Sorry, something went wrong: ${state.error}. Please try again.`,
          metadata: { stage: 'error' },
          created_at: new Date().toISOString(),
        };
        addMessage(errorMessage);

        const supabase = createClient();
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

        toast.error('Generation failed', {
          description: state.error || 'Unknown error',
        });
        clearGeneration(projectId);
      }
    });

    return unsub;
  }, [projectId]);

  const handleGenerationComplete = useCallback(async () => {
    const supabase = createClient();

    setProcessing(false, 'complete');

    const completionMessage: ChatMessageLocal = {
      id: crypto.randomUUID(),
      project_id: projectId,
      role: 'assistant',
      content:
        'Your website is ready! You can see the live preview on the right. Send another message to make changes.',
      metadata: {
        stage: 'complete',
        followUpSuggestions: followUpSuggestionsRef.current,
      },
      created_at: new Date().toISOString(),
    };
    addMessage(completionMessage);

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

    queryClient.invalidateQueries({
      queryKey: ['generated-files', projectId],
    });
    queryClient.invalidateQueries({
      queryKey: ['project', projectId],
    });

    clearGeneration(projectId);
  }, [projectId, addMessage, setProcessing, queryClient]);

  const runGeneration = useCallback(
    async (
      config: Record<string, unknown>,
      planDescription: string,
      opts?: { isTemplate?: boolean; projectName?: string }
    ) => {
      const generationStartedAt = new Date().toISOString();
      setProcessing(true, 'generating');
      generationStore.startGeneration(projectId);

              // Route to edit endpoint for surgical changes
        const isEditMode = !!(config as Record<string, unknown>)._editMode;
        const editConfig = config as Record<string, unknown>;
        const streamEndpoint = isEditMode ? '/api/generate/edit' : '/api/generate/stream';
        const streamBody = isEditMode
          ? { projectId, editInstructions: editConfig.editInstructions, targetFiles: editConfig.targetFiles }
          : { projectId, config };

try {
        const bgState = await startBackgroundGeneration(
          projectId,
          isEditMode ? streamBody : config,
          (event) => {
            generationStore.processEvent(event);

            if (event.type === 'component-complete') {
              const completed = event.completedFiles ?? 0;
              const total = event.totalFiles ?? 0;
              updateLastAssistantMessage(
                `${planDescription}\n\nGenerating components... (${completed}/${total})`,
                { stage: 'generating' }
              );
            }
          }
        );

        if (bgState.status === 'complete') {
          await handleGenerationComplete();
        } else if (bgState.status === 'error') {
          throw new Error(bgState.error || 'Generation failed');
        }
      } catch (error) {
        const rawMsg =
          error instanceof Error ? error.message : 'Something went wrong';

        if (isConnectionError(rawMsg)) {
          updateLastAssistantMessage(
            `${planDescription}\n\nConnection interrupted — checking if the generation finished on the server...`,
            { stage: 'generating' }
          );

          const status = await pollForCompletion(
            projectId,
            generationStartedAt
          );

          if (status && status.projectStatus === 'generated') {
            await handleGenerationComplete();
            toast.success('Generation recovered', {
              description:
                'The connection was briefly lost but your site was generated successfully.',
            });
            return;
          }

          if (
            status &&
            status.latestVersion &&
            status.latestVersion.status === 'complete'
          ) {
            await handleGenerationComplete();
            toast.success('Generation recovered', {
              description:
                'The connection was briefly lost but your site was generated successfully.',
            });
            return;
          }

          if (status && status.projectStatus === 'error') {
            throw new Error(
              'The generation failed on the server. Please try again.'
            );
          }

          throw new Error(
            'The connection was lost and we could not confirm the generation completed. Please refresh the page — your site may already be ready.'
          );
        }

        if (rawMsg === 'subscription_required') {
          const upgradeMessage: ChatMessageLocal = {
            id: crypto.randomUUID(),
            project_id: projectId,
            role: 'assistant',
            content:
              'To generate websites with AI, you need to subscribe to our Pro plan.\n\n[Upgrade to Pro Plan](/settings/billing)',
            metadata: { stage: 'error' },
            created_at: new Date().toISOString(),
          };
          addMessage(upgradeMessage);
          setProcessing(false, 'error');
          generationStore.reset();
          toast.error('Subscription required', {
            description:
              'Please subscribe to the Pro plan to use AI generation.',
          });
          return;
        }

        setProcessing(false, 'error');
        generationStore.reset();

        const errorMessage: ChatMessageLocal = {
          id: crypto.randomUUID(),
          project_id: projectId,
          role: 'assistant',
          content: `Sorry, something went wrong: ${rawMsg}. Please try again.`,
          metadata: { stage: 'error' },
          created_at: new Date().toISOString(),
        };
        addMessage(errorMessage);

        const supabase = createClient();
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

        toast.error('Generation failed', { description: rawMsg });
      }
    },
    [
      projectId,
      addMessage,
      setProcessing,
      updateLastAssistantMessage,
      generationStore,
      handleGenerationComplete,
    ]
  );

  // Auto-trigger generation for template-based projects
  useEffect(() => {
    if (templateAutoTriggered.current) return;
    if (autoTriggeredProjectIds.has(projectId)) return;
    templateAutoTriggered.current = true;
    autoTriggeredProjectIds.add(projectId);

    const autoGenerate = async () => {
      // Disabled: always show welcome screen with follow-up questions
      return;
    };
    const timer = setTimeout(autoGenerate, 500);
    return () => clearTimeout(timer);
  }, [projectId, addMessage, runGeneration]);

  const sendMessage = useCallback(
    async (content: string, attachments?: File[]) => {
      if (
        (!content.trim() && (!attachments || attachments.length === 0)) ||
        isProcessing
      )
        return;

      const supabase = createClient();

      let uploadedImages: Array<{
        url: string;
        imageType: string;
        fileName: string;
      }> = [];
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('projectId', projectId);
          formData.append(
            'imageType',
            file.name.toLowerCase().includes('logo') ? 'logo' : 'image'
          );
          try {
            const res = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });
            if (res.ok) {
              const data = await res.json();
              uploadedImages.push(data);
            }
          } catch (e) {
            console.error('Failed to upload image:', e);
          }
        }
      }

      let messageContent = content.trim();
      if (uploadedImages.length > 0) {
        const imageDescriptions = uploadedImages
          .map((img) =>
            img.imageType === 'logo'
              ? `[Uploaded logo: ${img.url}]`
              : `[Uploaded image: ${img.url}]`
          )
          .join('\n');
        messageContent = messageContent
          ? `${messageContent}\n\n${imageDescriptions}`
          : imageDescriptions;
      }

      const userMessage: ChatMessageLocal = {
        id: crypto.randomUUID(),
        project_id: projectId,
        role: 'user',
        content: messageContent,
        metadata: {},
        created_at: new Date().toISOString(),
      };
      addMessage(userMessage);

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
        const parseResponse = await fetch('/api/chat/parse-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            prompt: messageContent,
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
          if (err.error === 'no_credits') {
            throw new Error('no_credits');
          }
          throw new Error(err.error || 'Failed to parse prompt');
        }

        const { config, planDescription, followUpSuggestions, mode, editInstructions, targetFiles } =
          await parseResponse.json();

        if (mode === 'conversation') {
          const conversationMessage: ChatMessageLocal = {
            id: crypto.randomUUID(),
            project_id: projectId,
            role: 'assistant',
            content: planDescription,
            metadata: {
              stage: 'complete',
              followUpSuggestions: followUpSuggestions || [],
            },
            created_at: new Date().toISOString(),
          };
          addMessage(conversationMessage);

          supabase
            .from('chat_messages')
            .insert({
              id: conversationMessage.id,
              project_id: projectId,
              role: 'assistant',
              content: conversationMessage.content,
              metadata: conversationMessage.metadata,
            })
            .then();

          setProcessing(false, 'complete');
          return;
        }

        // MODE: Edit - surgical changes to existing website
        if (mode === 'edit') {
          const editPlanMessage: ChatMessageLocal = {
            id: crypto.randomUUID(),
            project_id: projectId,
            role: 'assistant',
            content: planDescription,
            metadata: { stage: 'generating' },
            created_at: new Date().toISOString(),
          };
          addMessage(editPlanMessage);
          supabase
            .from('chat_messages')
            .insert({
              id: editPlanMessage.id,
              project_id: projectId,
              role: 'assistant',
              content: editPlanMessage.content,
              metadata: editPlanMessage.metadata,
            })
            .then();

          followUpSuggestionsRef.current = followUpSuggestions || [];

          // Use the edit endpoint instead of full generation
          await runGeneration(
            { _editMode: true, editInstructions, targetFiles } as unknown as Record<string, unknown>,
            planDescription
          );
          return;
        }


        const planMessage: ChatMessageLocal = {
          id: crypto.randomUUID(),
          project_id: projectId,
          role: 'assistant',
          content: planDescription,
          metadata: { stage: 'generating' },
          created_at: new Date().toISOString(),
        };
        addMessage(planMessage);

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

        followUpSuggestionsRef.current = followUpSuggestions || [];

        await runGeneration(config, planDescription);
      } catch (error) {
        setProcessing(false, 'error');
        generationStore.reset();

        const rawMsg =
          error instanceof Error ? error.message : 'Something went wrong';

        if (rawMsg === 'subscription_required') {
          const upgradeMessage: ChatMessageLocal = {
            id: crypto.randomUUID(),
            project_id: projectId,
            role: 'assistant',
            content:
              'To generate websites with AI, you need to subscribe to our Pro plan. The Pro plan includes credits to build and customize your website.\n\n[Upgrade to Pro Plan](/settings/billing)',
            metadata: { stage: 'error' },
            created_at: new Date().toISOString(),
          };
          addMessage(upgradeMessage);
          toast.error('Subscription required', {
            description:
              'Please subscribe to the Pro plan to use AI generation.',
          });
          return;
        }

        if (rawMsg === 'no_credits') {
          const noCreditsMessage: ChatMessageLocal = {
            id: crypto.randomUUID(),
            project_id: projectId,
            role: 'assistant',
            content:
              'You have no generation credits remaining. Visit the Pricing page to get more credits.\n\n[Get More Credits](/settings/billing)',
            metadata: { stage: 'error' },
            created_at: new Date().toISOString(),
          };
          addMessage(noCreditsMessage);
          toast.error('No credits remaining', {
            description: 'Visit the Pricing page to get more credits.',
          });
          return;
        }

        let errorMsg = rawMsg;
        if (isConnectionError(rawMsg)) {
          errorMsg =
            'The generation timed out or the connection was lost. This can happen with complex sites. Please try again — the generation should be faster now.';
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

        const supabase2 = createClient();
        supabase2
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
      generationStore,
      runGeneration,
    ]
  );

  return {
    messages,
    isProcessing,
    processingStage,
    sendMessage,
  };
}

