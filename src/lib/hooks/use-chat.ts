'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useChatStore, type ChatMessageLocal } from '@/stores/chat-store';
import { useGenerationStore } from '@/stores/generation-store';
import { readSSEStream } from '@/lib/ai/stream-handler';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check whether an error looks like a network / connection drop. */
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

/**
 * Poll the lightweight /api/generate/status endpoint until the generation
 * either completes or errors out. Returns the final status response.
 *
 * - Polls every 5 seconds
 * - Gives up after 5 minutes (60 attempts)
 * - Resolves as soon as status is no longer "generating"
 */
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

      // Make sure we are looking at the version that was created during
      // this generation attempt (not an older one).
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

      // Also check if the project itself transitioned out of "generating"
      if (
        data.projectStatus === 'generated' ||
        data.projectStatus === 'error'
      ) {
        return data;
      }
    } catch {
      // Network still down â keep trying
    }
  }

  return null; // timed out
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

// Module-level guard: survives component remounts within the same client session
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

  // ââ Shared generation runner âââââââââââââââââââââââââââââââââââââââââ
  // Both the auto-trigger path and the sendMessage path need identical
  // SSE-reading + recovery logic, so we extract it here.
  const runGeneration = useCallback(
    async (
      config: Record<string, unknown>,
      planDescription: string,
      opts?: { isTemplate?: boolean; projectName?: string }
    ) => {
      const supabase = createClient();
      const generationStartedAt = new Date().toISOString();

      setProcessing(true, 'generating');
      generationStore.startGeneration();

      try {
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

        // Read SSE stream
        for await (const event of readSSEStream(genResponse.body)) {
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

        // Stream finished normally â generation complete
        await handleGenerationComplete(supabase);
      } catch (error) {
        const rawMsg =
          error instanceof Error ? error.message : 'Something went wrong';

        // ââ Connection-drop recovery ââââââââââââââââââââââââââââââââ
        if (isConnectionError(rawMsg)) {
          updateLastAssistantMessage(
            `${planDescription}\n\nConnection interrupted â checking if the generation finished on the server...`,
            { stage: 'generating' }
          );

          const status = await pollForCompletion(
            projectId,
            generationStartedAt
          );

          if (status && status.projectStatus === 'generated') {
            // Backend finished successfully even though the client lost
            // the stream.  Treat it as a success.
            await handleGenerationComplete(supabase);
            toast.success('Generation recovered', {
              description:
                'The connection was briefly lost but your site was generated successfully.',
            });
            return; // exit â no error
          }

          if (
            status &&
            status.latestVersion &&
            status.latestVersion.status === 'complete'
          ) {
            await handleGenerationComplete(supabase);
            toast.success('Generation recovered', {
              description:
                'The connection was briefly lost but your site was generated successfully.',
            });
            return;
          }

          // If polling also failed or the backend errored, fall through
          // to the normal error handler below.
          if (status && status.projectStatus === 'error') {
            throw new Error(
              'The generation failed on the server. Please try again.'
            );
          }

          // Polling timed out â the backend may still be running
          throw new Error(
            'The connection was lost and we could not confirm the generation completed. Please refresh the page â your site may already be ready.'
          );
        }

        // ââ Non-connection errors âââââââââââââââââââââââââââââââââââ
        if (rawMsg === 'subscription_required') {
          const upgradeMessage: ChatMessageLocal = {
            id: crypto.randomUUID(),
            project_id: projectId,
            role: 'assistant',
            content:
              'To generate websites with AI, you need to subscribe to our Beta plan.\n\n[Upgrade to Beta Plan](/settings/billing)',
            metadata: { stage: 'error' },
            created_at: new Date().toISOString(),
          };
          addMessage(upgradeMessage);
          setProcessing(false, 'error');
          generationStore.reset();
          toast.error('Subscription required', {
            description:
              'Please subscribe to the Beta plan to use AI generation.',
          });
          return;
        }

        // Generic error
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

      // ââ Inner helpers âââââââââââââââââââââââââââââââââââââââââââââââ
      async function handleGenerationComplete(
        sb: ReturnType<typeof createClient>
      ) {
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

        sb.from('chat_messages')
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
      }
    },
    [
      projectId,
      addMessage,
      setProcessing,
      updateLastAssistantMessage,
      generationStore,
      queryClient,
    ]
  );

  // Auto-trigger generation for template-based projects
  useEffect(() => {
    if (templateAutoTriggered.current) return;
    if (autoTriggeredProjectIds.has(projectId)) return;
    templateAutoTriggered.current = true;
    autoTriggeredProjectIds.add(projectId);

    const autoGenerate = async () => {
      const supabase = createClient();

      // Check if this project was created from a template (has generation_config and is draft)
      const { data: project, error } = await supabase
        .from('projects')
        .select('status, generation_config, name')
        .eq('id', projectId)
        .single();

      if (error || !project) return;

      // Only auto-trigger if project is draft with a generation_config and no messages yet
      if (
        project.status !== 'draft' ||
        !project.generation_config ||
        typeof project.generation_config !== 'object'
      ) {
        return;
      }

      // Check if there are already chat messages for this project
      const { count } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId);

      if (count && count > 0) return;

      // Immediately mark project as generating on the server to prevent
      // any other tab or reload from re-triggering auto-generation
      await supabase
        .from('projects')
        .update({ status: 'generating' })
        .eq('id', projectId);

      const config = project.generation_config;
      const planDescription = `Starting generation from template: **${project.name}**. Your website is being built with AI...`;

      // Add a welcome message
      const welcomeMessage: ChatMessageLocal = {
        id: crypto.randomUUID(),
        project_id: projectId,
        role: 'assistant',
        content: planDescription,
        metadata: { stage: 'generating' },
        created_at: new Date().toISOString(),
      };
      addMessage(welcomeMessage);

      // Persist welcome message (await to ensure it exists before generation)
      await supabase
        .from('chat_messages')
        .insert({
          id: welcomeMessage.id,
          project_id: projectId,
          role: 'assistant',
          content: welcomeMessage.content,
          metadata: welcomeMessage.metadata,
        });

      // Start generation with recovery
      await runGeneration(
        config as Record<string, unknown>,
        planDescription,
        { isTemplate: true, projectName: project.name }
      );
    };

    // Delay slightly to ensure messages have loaded first
    const timer = setTimeout(autoGenerate, 500);
    return () => clearTimeout(timer);
  }, [projectId, addMessage, runGeneration]);

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

        // 4. Start generation with recovery
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
              'To generate websites with AI, you need to subscribe to our Beta plan. The Beta plan includes credits to build and customize your website.\n\n[Upgrade to Beta Plan](/settings/billing)',
            metadata: { stage: 'error' },
            created_at: new Date().toISOString(),
          };
          addMessage(upgradeMessage);
          toast.error('Subscription required', {
            description:
              'Please subscribe to the Beta plan to use AI generation.',
          });
          return;
        }

        let errorMsg = rawMsg;
        if (isConnectionError(rawMsg)) {
          errorMsg =
            'The generation timed out or the connection was lost. This can happen with complex sites. Please try again \u2014 the generation should be faster now.';
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
