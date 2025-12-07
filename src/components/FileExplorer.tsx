import React, { useState, useCallback } from 'react';
import { FileCode, FolderOpen, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { SplitPane } from '@/components/ui/split-pane';
import { FileTree } from '@/components/FileTree';
import { CodeEditor } from '@/components/CodeEditor';
import { useTheme } from '@/hooks/useTheme';

interface FileExplorerProps {
  /**
   * Root path for the file tree
   */
  rootPath?: string;
  /**
   * Optional className
   */
  className?: string;
  /**
   * Callback when a file is clicked (selected)
   */
  onFileClick?: (filePath: string) => void;
}

/**
 * FileExplorer - File tree + Code editor with split pane layout
 *
 * Layout:
 * ┌─────────────────┬──────────────────────────────────┐
 * │   File Tree     │   Code Viewer                    │
 * │   (left)        │   (right)                        │
 * └─────────────────┴──────────────────────────────────┘
 */
export const FileExplorer: React.FC<FileExplorerProps> = ({
  rootPath,
  className,
  onFileClick,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'gray';

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (filePath: string) => {
    setSelectedFile(filePath);
    setIsLoadingFile(true);
    setFileError(null);

    // Notify parent about file selection
    onFileClick?.(filePath);

    try {
      const content = await api.readFileContent(filePath);
      setFileContent(content);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Failed to load file');
      setFileContent(null);
    } finally {
      setIsLoadingFile(false);
    }
  }, [onFileClick]);

  // Handle file save callback
  const handleFileSave = useCallback((filePath: string, _content: string) => {
    console.log('File saved:', filePath);
    // Could add toast notification here
  }, []);

  // Empty state when no root path
  if (!rootPath) {
    return (
      <div className={cn('h-full p-3', className)}>
        <div className="h-full flex flex-col rounded-lg border border-border bg-muted/30 shadow-sm">
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8" />
            </div>
            <p className="text-sm font-medium mb-1">No project selected</p>
            <p className="text-xs text-center max-w-[200px]">
              Select a project to explore its files
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('h-full p-3', className)}>
      <div className="h-full rounded-lg border border-border shadow-sm overflow-hidden">
        <SplitPane
          initialSplit={30}
          minLeftWidth={150}
          minRightWidth={200}
          left={
            <div className={cn(
              "h-full border-r border-border",
              isDark ? "bg-[#1e1e1e]" : "bg-muted/30"
            )}>
              {/* File Tree Header */}
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 border-b",
                isDark ? "bg-[#252526] border-[#3c3c3c]" : "bg-muted/50 border-border"
              )}>
                <FolderOpen className="w-4 h-4 text-yellow-500" />
                <span className="text-xs text-muted-foreground font-medium truncate">
                  {rootPath.split('/').pop() || 'Explorer'}
                </span>
              </div>
              {/* File Tree */}
              <FileTree
                rootPath={rootPath}
                selectedFile={selectedFile || undefined}
                onFileSelect={handleFileSelect}
                className="text-[13px]"
              />
            </div>
          }
          right={
            <div className={cn(
              "h-full flex flex-col",
              isDark ? "bg-[#1e1e1e]" : "bg-background"
            )}>
              {/* Code Editor Header */}
              {selectedFile && (
                <div className={cn(
                  "flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b",
                  isDark ? "bg-[#252526] border-[#3c3c3c]" : "bg-muted/50 border-border"
                )}>
                  <FileCode className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate" title={selectedFile}>
                    {selectedFile}
                  </span>
                </div>
              )}

              {/* Code Editor */}
              <div className="flex-1 overflow-hidden">
                {isLoadingFile ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : fileError ? (
                  <div className="flex items-center justify-center h-full p-4">
                    <p className="text-sm text-destructive text-center">{fileError}</p>
                  </div>
                ) : selectedFile && fileContent !== null ? (
                  <CodeEditor
                    filePath={selectedFile}
                    content={fileContent}
                    onSave={handleFileSave}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center mb-3">
                      <FileCode className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium mb-1">No file selected</p>
                    <p className="text-xs text-center max-w-[180px]">
                      Click a file in the tree to edit its contents
                    </p>
                  </div>
                )}
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default FileExplorer;
