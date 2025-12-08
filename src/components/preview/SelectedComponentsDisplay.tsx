import React from 'react';
import { Code2, X } from 'lucide-react';
import { usePreviewStore } from '@/stores/previewStore';
import { cn } from '@/lib/utils';

interface SelectedComponentsDisplayProps {
  className?: string;
}

/**
 * 선택된 컴포넌트 표시 컴포넌트
 * 채팅 입력창 위에 선택된 컴포넌트 목록을 보여줌
 */
export const SelectedComponentsDisplay: React.FC<SelectedComponentsDisplayProps> = ({
  className,
}) => {
  const {
    selectedComponents,
    removeSelectedComponent,
    clearSelectedComponents,
    postMessageToIframe,
  } = usePreviewStore();

  const handleRemoveComponent = (index: number) => {
    const componentToRemove = selectedComponents[index];
    removeSelectedComponent(componentToRemove.id);

    // iframe에 오버레이 제거 메시지 전송
    postMessageToIframe({
      type: 'remove-anyon-component-overlay',
      componentId: componentToRemove.id,
    });
  };

  const handleClearAll = () => {
    clearSelectedComponents();
  };

  if (!selectedComponents || selectedComponents.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "p-2 pb-1 max-h-[180px] overflow-y-auto",
        "border-b border-gray-200 dark:border-gray-700",
        className
      )}
      data-testid="selected-component-display"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Selected Components ({selectedComponents.length})
        </span>
        <button
          onClick={handleClearAll}
          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          title="Clear all selected components"
        >
          Clear all
        </button>
      </div>

      {/* 선택된 컴포넌트 목록 */}
      {selectedComponents.map((component, index) => (
        <div key={component.id} className="mb-1 last:mb-0">
          <div className={cn(
            "flex items-center justify-between rounded-md px-2 py-1.5 text-sm",
            "bg-purple-100 dark:bg-purple-900/30"
          )}>
            <div className="flex items-center gap-2 overflow-hidden">
              <Code2
                className="w-4 h-4 flex-shrink-0 text-purple-600 dark:text-purple-400"
              />
              <div className="flex flex-col overflow-hidden">
                <span
                  className="truncate font-medium text-purple-800 dark:text-purple-300"
                  title={component.name}
                >
                  {component.name}
                </span>
                <span
                  className="truncate text-xs text-purple-600/80 dark:text-purple-400/80"
                  title={`${component.relativePath}:${component.lineNumber}`}
                >
                  {component.relativePath}:{component.lineNumber}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleRemoveComponent(index)}
              className="ml-2 flex-shrink-0 rounded-full p-0.5 hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors"
              title="Deselect component"
            >
              <X className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SelectedComponentsDisplay;
