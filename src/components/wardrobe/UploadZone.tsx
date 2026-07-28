'use client';

import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { useWardrobeStore } from '@/lib/store';

export function UploadZone() {
  const uploadItems = useWardrobeStore((s) => s.uploadItems);
  const uploadTasks = useWardrobeStore((s) => s.uploadTasks);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;
    await uploadItems(files);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={clsx(
          'flex flex-col items-center justify-center gap-2 rounded-xl2 border-2 border-dashed px-4 py-6 text-center transition-colors',
          dragOver
            ? 'border-thread-500 bg-thread-50 dark:bg-thread-900/20'
            : 'border-line bg-canvas-soft hover:border-thread-300 dark:border-dusk-line dark:bg-dusk-surface2',
        )}
      >
        <div className="rounded-full bg-white p-2.5 text-thread-500 shadow-softer dark:bg-dusk-surface">
          <UploadCloud size={18} aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-ink dark:text-dusk-text">Drag a clothing photo here</p>
        <p className="text-xs text-ink-muted dark:text-dusk-muted">
          AI removes the background and sorts it into a category automatically
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm font-medium text-thread-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thread-400 rounded dark:text-thread-300"
        >
          Browse files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
          aria-label="Upload clothing photos"
        />
      </div>

      {uploadTasks.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {uploadTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs dark:border-dusk-line dark:bg-dusk-surface2"
            >
              {task.status === 'error' ? (
                <span className="h-2 w-2 shrink-0 rounded-full bg-thread-500" aria-hidden="true" />
              ) : (
                <Loader2 size={12} className="shrink-0 animate-spin text-thread-500" aria-hidden="true" />
              )}
              <span className="min-w-0 flex-1 truncate text-ink dark:text-dusk-text">{task.fileName}</span>
              <span className="shrink-0 text-ink-muted dark:text-dusk-muted">
                {task.status === 'removing-background' && 'Removing background…'}
                {task.status === 'classifying' && 'Classifying…'}
                {task.status === 'saving' && 'Saving…'}
                {task.status === 'error' && (task.error ?? 'Failed')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
