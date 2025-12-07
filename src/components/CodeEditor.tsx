import React, { useRef, useState, useCallback, useEffect } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { Loader2, Save, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';

interface CodeEditorProps {
  /**
   * The file path being edited
   */
  filePath: string;
  /**
   * Initial content of the file
   */
  content: string;
  /**
   * Whether the editor is read-only
   */
  readOnly?: boolean;
  /**
   * Callback when content changes
   */
  onChange?: (content: string) => void;
  /**
   * Callback when file is saved
   */
  onSave?: (filePath: string, content: string) => void;
  /**
   * Optional className
   */
  className?: string;
}

/**
 * Detects the Monaco language from file extension
 */
const getLanguageFromPath = (filePath: string): string => {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
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
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'scss',
    less: 'less',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    markdown: 'markdown',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    dockerfile: 'dockerfile',
    xml: 'xml',
    toml: 'ini',
    ini: 'ini',
    vue: 'vue',
    svelte: 'html',
  };
  return langMap[ext] || 'plaintext';
};

/**
 * CodeEditor - Monaco Editor based code editor component
 *
 * Features:
 * - Syntax highlighting for multiple languages
 * - Ctrl+S / Cmd+S to save
 * - Auto-save on blur (optional)
 * - Change detection (modified indicator)
 * - Dark/Light theme support
 */
export const CodeEditor: React.FC<CodeEditorProps> = ({
  filePath,
  content,
  readOnly = false,
  onChange,
  onSave,
  className,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'gray';

  const editorRef = useRef<any>(null);
  const [currentContent, setCurrentContent] = useState(content);
  const [originalContent, setOriginalContent] = useState(content);
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Update content when file changes
  useEffect(() => {
    setCurrentContent(content);
    setOriginalContent(content);
    setIsModified(false);
    setSaveError(null);
  }, [filePath, content]);

  // Detect language from file path
  const language = getLanguageFromPath(filePath);

  // Handle editor mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Add Ctrl+S / Cmd+S save shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    // Focus editor
    editor.focus();
  };

  // Handle content change
  const handleEditorChange: OnChange = (value) => {
    const newContent = value || '';
    setCurrentContent(newContent);
    setIsModified(newContent !== originalContent);
    setSaveError(null);
    onChange?.(newContent);
  };

  // Save file
  const handleSave = useCallback(async () => {
    if (readOnly || isSaving || !isModified) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await api.writeFileContent(filePath, currentContent);
      setOriginalContent(currentContent);
      setIsModified(false);
      setLastSaved(new Date());
      onSave?.(filePath, currentContent);
    } catch (err) {
      console.error('Failed to save file:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save file');
    } finally {
      setIsSaving(false);
    }
  }, [filePath, currentContent, readOnly, isSaving, isModified, onSave]);

  // Auto-save on blur (optional - disabled by default for safety)
  const handleBlur = useCallback(() => {
    // Uncomment to enable auto-save on blur:
    // if (isModified && !readOnly) {
    //   handleSave();
    // }
  }, []);

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Editor Header / Status Bar */}
      <div className={cn(
        'flex-shrink-0 flex items-center justify-between px-3 py-1.5 border-b',
        isDark ? 'bg-[#1e1e1e] border-[#3c3c3c]' : 'bg-muted/50 border-border'
      )}>
        <div className="flex items-center gap-2">
          {/* Modified indicator */}
          {isModified && (
            <Circle className="w-2.5 h-2.5 fill-orange-500 text-orange-500" />
          )}
          <span className="text-xs text-muted-foreground">
            {language}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Save error */}
          {saveError && (
            <div className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="max-w-[150px] truncate">{saveError}</span>
            </div>
          )}

          {/* Last saved */}
          {lastSaved && !saveError && (
            <span className="text-xs text-muted-foreground">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}

          {/* Save button */}
          {!readOnly && (
            <button
              onClick={handleSave}
              disabled={!isModified || isSaving}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
                isModified && !isSaving
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save</span>
            </button>
          )}
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden" onBlur={handleBlur}>
        <Editor
          height="100%"
          language={language}
          value={currentContent}
          theme={isDark ? 'vs-dark' : 'light'}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          loading={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          }
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 13,
            lineHeight: 20,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            folding: true,
            renderLineHighlight: 'line',
            selectOnLineNumbers: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            padding: { top: 8, bottom: 8 },
            tabSize: 2,
            insertSpaces: true,
            formatOnPaste: true,
            formatOnType: true,
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>

      {/* Keyboard shortcut hint */}
      {isModified && !readOnly && (
        <div className={cn(
          'flex-shrink-0 px-3 py-1 text-xs text-muted-foreground border-t',
          isDark ? 'bg-[#1e1e1e] border-[#3c3c3c]' : 'bg-muted/30 border-border'
        )}>
          Press <kbd className="px-1 py-0.5 rounded bg-muted text-foreground">Ctrl+S</kbd> to save
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
