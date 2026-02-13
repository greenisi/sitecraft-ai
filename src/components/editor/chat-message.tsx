'use client';

import { cn } from '@/lib/utils/cn';
import { User, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ChatMessageLocal } from '@/stores/chat-store';

interface ChatMessageProps {
  message: ChatMessageLocal;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isComplete = message.metadata?.stage === 'complete';
  const isError = message.metadata?.stage === 'error';

  return (
    <div className={cn('flex gap-3 py-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : isComplete ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : isError ? (
          <AlertCircle className="h-4 w-4 text-destructive" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </div>

      {/* Message Bubble */}
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-md'
            : isError
              ? 'bg-destructive/10 text-destructive rounded-tl-md'
              : 'bg-muted rounded-tl-md'
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
