import React, { useState, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FileCode, FolderOpen, Code , Loader2 } from 'lucide-react';
import { PanelHeader, StatusBadge } from '@/components/ui/panel-header';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { SplitPane } from '@/components/ui/split-pane';
import { FileTree } from '@/components/FileTree';
import { useTheme } from '@/hooks/useTheme';
import { usePreviewStore } from '@/stores/previewStore';

interface FileExplorerProps {
  /**
   * Root path for the file tree
   */
  rootPath?: string;
  /**
   * Optional className
   */
  className?: string;
}

/**
 * Detects language from file extension
 */
const getLanguageFromPath = (filePath: string): string => {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    kt: 'kotlin',
    swift: 'swift',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    php: 'php',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    dockerfile: 'dockerfile',
    xml: 'xml',
    toml: 'toml',
  };
  return langMap[ext] || 'text';
};

/**
 * FileExplorer - File tree + Code viewer with split pane layout
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
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // PreviewStore에서 setCurrentEditorFile 가져오기
  const setCurrentEditorFile = usePreviewStore((state) => state.setCurrentEditorFile);

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (filePath: string) => {
    setSelectedFile(filePath);
    setIsLoadingFile(true);
    setFileError(null);

    // PreviewStore 업데이트 - Preview가 이 파일을 추적할 수 있도록
    setCurrentEditorFile(filePath);
    console.log('[FileExplorer] File selected, updating PreviewStore:', filePath);

    try {
      const content = await api.readFileContent(filePath);
      setFileContent(content);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Failed to load file');
      setFileContent(null);
    } finally {
      setIsLoadingFile(false);
    }
  }, [setCurrentEditorFile]);

  const detectedLanguage = selectedFile ? getLanguageFromPath(selectedFile) : 'text';

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

  const fileName = selectedFile ? selectedFile.split('/').pop() : null;
  const projectName = rootPath.split('/').pop() || 'Explorer';

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* 통일 헤더 */}
      <PanelHeader
        icon={<Code className="w-4 h-4" />}
        title="코드"
        subtitle={projectName}
        badge={
          selectedFile ? (
            <StatusBadge variant="info">{fileName}</StatusBadge>
          ) : (
            <StatusBadge variant="muted">파일 선택</StatusBadge>
          )
        }
      />

      {/* 콘텐츠 영역 */}
      <div className="flex-1 min-h-0 p-3">
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
                    {projectName}
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
                isDark ? "bg-[#282c34]" : "bg-background"
              )}>
                {/* Code Viewer Header */}
                {selectedFile && (
                  <div className={cn(
                    "flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b",
                    isDark ? "bg-[#21252b] border-[#181a1f]" : "bg-muted/50 border-border"
                  )}>
                    <FileCode className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate" title={selectedFile}>
                      {selectedFile}
                    </span>
                  </div>
                )}

              {/* Code Content */}
              <div className="flex-1 overflow-auto">
                {isLoadingFile ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : fileError ? (
                  <div className="flex items-center justify-center h-full p-4">
                    <p className="text-sm text-destructive text-center">{fileError}</p>
                  </div>
                ) : selectedFile && fileContent !== null ? (
                  <SyntaxHighlighter
                    language={detectedLanguage}
                    style={isDark ? oneDark : oneLight}
                    showLineNumbers
                    wrapLines
                    customStyle={{
                      margin: 0,
                      padding: '12px',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      background: 'transparent',
                      minHeight: '100%',
                    }}
                    lineNumberStyle={{
                      minWidth: '3em',
                      paddingRight: '1em',
                      color: isDark ? '#636d83' : '#999999',
                      userSelect: 'none',
                    }}
                  >
                    {fileContent}
                  </SyntaxHighlighter>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center mb-3">
                      <FileCode className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium mb-1">No file selected</p>
                    <p className="text-xs text-center max-w-[180px]">
                      Click a file in the tree to view its contents
                    </p>
                  </div>
                )}
              </div>
            </div>
          }
          />
        </div>
      </div>
    </div>
  );
};

export default FileExplorer;
