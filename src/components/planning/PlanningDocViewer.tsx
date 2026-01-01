import React, { useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { open } from '@tauri-apps/plugin-shell';

interface PlanningDocViewerProps {
  content: string;
  filename?: string;
}

/**
 * Document viewer for planning documents
 * Supports both Markdown and HTML content
 */
export const PlanningDocViewer: React.FC<PlanningDocViewerProps> = ({ content, filename }) => {
  // Handle link clicks - open in system browser
  const handleLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string | undefined) => {
    e.preventDefault();
    if (href) {
      open(href);
    }
  }, []);

  // Detect if content is HTML
  const isHtml = useMemo(() => {
    if (filename?.endsWith('.html')) return true;
    // Check if content starts with HTML doctype or html tag
    const trimmed = content.trim().toLowerCase();
    return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
  }, [content, filename]);

  if (isHtml) {
    return (
      <div className="h-full w-full overflow-hidden bg-background">
        <iframe
          srcDoc={content}
          className="w-full h-full border-0"
          title="UX Design Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 bg-background">
      <div className="prose prose-sm dark:prose-invert max-w-none
        prose-headings:font-semibold
        prose-h1:text-2xl prose-h1:border-b prose-h1:pb-2 prose-h1:mb-4
        prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
        prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2
        prose-p:leading-relaxed prose-p:mb-3
        prose-ul:my-2 prose-ol:my-2
        prose-li:my-0.5
        prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
        prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg
        prose-table:border-collapse prose-table:w-full
        prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-th:text-left
        prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:pl-4 prose-blockquote:italic
      ">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => (
              <a
                href={href}
                onClick={(e) => handleLinkClick(e, href)}
                className="text-primary cursor-pointer hover:underline"
              >
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default PlanningDocViewer;
