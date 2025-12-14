import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { AppSidebar } from '@/components/AppSidebar';
import { useProjects, useProjectsNavigation } from '@/components/ProjectRoutes';
import { Toast, ToastContainer } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { TEMPLATES, type Template } from '@/types/template';
import { cn } from '@/lib/utils';
import type { Project } from '@/lib/api';

// Cross-platform project name extractor
const getProjectName = (path: string): string => {
  const segments = path.split(/[/\\\\]+/);
  return segments[segments.length - 1] || 'Project';
};

interface TemplateSelectorProps {
  projectId: string;
}

/**
 * TemplateSelector - Choose project template
 *
 * Layout:
 * ┌────────┬─────────────────────────────────────────┐
 * │Sidebar │       Template Selection Grid           │
 * │ (56px) │         (centered content)              │
 * └────────┴─────────────────────────────────────────┘
 */
export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ projectId }) => {
  const { goToProjectList, goToWorkspaceSelector } = useProjectsNavigation();
  const { projects, loading, getProjectById } = useProjects();
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (projectId) {
      const found = getProjectById(projectId);
      setProject(found);
    }
  }, [projectId, projects, loading, getProjectById]);

  const handleSelectTemplate = async (template: Template) => {
    if (!template.available) {
      setToast({ message: '출시 예정입니다', type: 'info' });
      return;
    }

    if (!project) return;

    setIsSaving(true);
    try {
      await api.setProjectTemplate(project.path, template.id);
      
      // Basic 템플릿 → WorkspaceSelector로 이동
      if (template.id === 'basic') {
        goToWorkspaceSelector(projectId);
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      setToast({ message: '템플릿 저장에 실패했습니다', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Get project name from path
  const projectName = project?.path ? getProjectName(project.path) : 'Project';

  // Show loading
  if (loading || !project) {
    return (
      <div className="h-full flex">
        <AppSidebar
          navDisabled
          showRightPanelToggle={false}
          onLogoClick={goToProjectList}
        />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex overflow-hidden bg-background">
      {/* Sidebar */}
      <AppSidebar
        navDisabled
        showRightPanelToggle={false}
        onLogoClick={goToProjectList}
      />

      {/* Main Content */}
      <div className="flex-1 h-full overflow-y-auto flex flex-col">
        {/* Center Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-16">
          {/* Selection prompt */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: 0.05 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-medium text-foreground mb-2">
              템플릿 선택
            </h2>
            <p className="text-muted-foreground">
              <span className="font-medium">{projectName}</span> 프로젝트의 템플릿을 선택하세요
            </p>
          </motion.div>

          {/* Template grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full max-w-5xl">
            {TEMPLATES.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: 0.1 + index * 0.03 }}
              >
                <TemplateCard
                  template={template}
                  onClick={() => handleSelectTemplate(template)}
                  disabled={isSaving}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Toast */}
      <ToastContainer>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast(null)}
          />
        )}
      </ToastContainer>
    </div>
  );
};

/**
 * TemplateCard - Individual template selection card
 */
interface TemplateCardProps {
  template: Template;
  onClick: () => void;
  disabled?: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onClick, disabled }) => {
  return (
    <motion.div
      whileHover={template.available ? { scale: 1.03 } : undefined}
      whileTap={template.available ? { scale: 0.97 } : undefined}
      transition={{ duration: 0.15 }}
    >
      <Card
        onClick={disabled ? undefined : onClick}
        className={cn(
          "relative p-6 min-h-[180px]",
          "flex flex-col items-center justify-center text-center",
          "transition-all duration-200",
          template.available
            ? "cursor-pointer hover:shadow-lg hover:border-primary/50"
            : "cursor-not-allowed opacity-60",
          disabled && "pointer-events-none"
        )}
      >
        {/* Coming Soon Badge */}
        {!template.available && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs">
              <Lock className="w-3 h-3" />
              <span>출시 예정</span>
            </div>
          </div>
        )}

        {/* Icon */}
        <div className="text-4xl mb-3">
          {template.icon}
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold mb-1">
          {template.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {template.description}
        </p>
      </Card>
    </motion.div>
  );
};

export default TemplateSelector;
