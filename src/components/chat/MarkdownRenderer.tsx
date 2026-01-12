'use client';

import { cn } from '@/lib/utils';
import { memo } from 'react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

const MarkdownComponents: Components = {
  // リンクを新しいタブで開く
  a: ({ node, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all" />
  ),
  // コードブロックのスタイル
  code: ({ node, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const isInline = !match && !String(children).includes('\n');
    return isInline ? (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono break-all" {...props}>
        {children}
      </code>
    ) : (
      <code className={cn("block bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono my-2", className)} {...props}>
        {children}
      </code>
    );
  },
  // テーブルのスタイル
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-collapse border border-border" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => (
    <thead className="bg-muted" {...props} />
  ),
  th: ({ node, ...props }) => (
    <th className="border border-border px-4 py-2 text-left font-semibold text-sm" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="border border-border px-4 py-2 text-sm" {...props} />
  ),
  // Typography
  p: ({ node, ...props }) => (
    <p className="my-2 leading-relaxed break-words last:mb-0 first:mt-0" {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul className="list-disc pl-6 my-2 space-y-1" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="list-decimal pl-6 my-2 space-y-1" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="leading-relaxed" {...props} />
  ),
  h1: ({ node, ...props }) => (
    <h1 className="text-2xl font-bold mt-6 mb-4 border-b pb-2" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-xl font-bold mt-5 mb-3" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />
  ),
  blockquote: ({ node, ...props }) => (
    <blockquote className="border-l-4 border-muted-foreground/30 pl-4 py-1 my-4 italic text-muted-foreground" {...props} />
  ),
  hr: ({ node, ...props }) => (
    <hr className="my-6 border-border" {...props} />
  ),
};

function MarkdownRendererBase({ content, isStreaming, className }: MarkdownRendererProps) {
  return (
    <div className={cn("markdown-content", className)}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={MarkdownComponents}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 align-middle bg-current animate-pulse" />
      )}
    </div>
  );
}

export const MarkdownRenderer = memo(MarkdownRendererBase);
