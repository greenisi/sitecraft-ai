'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  onSend: (content: string) => void;
  isDisabled: boolean;
  placeholder?: string;
  onStop?: () => void;
}

export function ChatInput({ onSend, isDisabled, placeholder, onStop }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isDisabled) return;
    onSend(trimmed);
    setValue('');
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, isDisabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="relative flex items-end gap-2 p-3 md:p-4 border-t bg-background flex-shrink-0">
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Describe what you want to build...'}
          disabled={isDisabled}
          rows={1}
          className="w-full resize-none rounded-xl border bg-background px-3 py-2.5 md:px-4 md:py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 placeholder:text-muted-foreground"
        />
      </div>
      {isDisabled && onStop ? (
        <Button
          size="icon"
          variant="destructive"
          className="h-10 w-10 rounded-xl flex-shrink-0"
          onClick={onStop}
        >
          <Square className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          size="icon"
          className="h-10 w-10 rounded-xl flex-shrink-0"
          onClick={handleSend}
          disabled={!value.trim() || isDisabled}
        >
          <Send className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
