import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Loader2 } from "@/lib/icons";
import maintainTabIcon from '@/assets/maintain-tab-icon.png';
import mvpTabIcon from '@/assets/mvp-tab-icon.png';
import { SelectionCard } from '@/components/ui/selection-card';
import { TrackSelector } from '@/components/TrackSelector';
import { AppSidebar } from '@/components/AppSidebar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useProjects, useProjectsNavigation } from '@/components/ProjectRoutes';
import { api } from '@/lib/api';
import type { Project } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import { useTrackStore } from '@/stores/trackStore';
import type { TrackId } from '@/types/track';

// Cross-platform project name extractor (handles / and \\)
const getProjectName = (path: string): string => {
  const segments = path.split(/[/\\\\]+/);
  return segments[segments.length - 1] || 'Project';
};

interface WorkspaceSelectorProps {
  projectId: string;
}

/**
 * WorkspaceSelector - Choose between MVP development and Maintenance
 *
 * Layout:
 * ┌────────┬─────────────────────────────────────────┐
 * │Sidebar │       Workspace Selection Cards         │
 * │ (56px) │         (centered content)              │
 * └────────┴─────────────────────────────────────────┘
 */
export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({ projectId }) => {
  const { goToProjectList, goToMvp, goToMaintenance } = useProjectsNavigation();
  const { projects, loading, getProjectById } = useProjects();
  const { t } = useTranslation();
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [showTrackSelector, setShowTrackSelector] = useState(false);
  const setProjectTrack = useTrackStore((state) => state.setProjectTrack);

  useEffect(() => {
    console.log('[WorkspaceSelector] useEffect triggered', {
      projectId,
      projectsLength: projects.length,
      loading,
      projects: projects.map(p => ({ id: p.id, path: p.path }))
    });

    if (projectId) {
      const found = getProjectById(projectId);
      console.log('[WorkspaceSelector] Found project:', found);
      setProject(found);
    }
  }, [projectId, projects, loading, getProjectById]);

  // Check git repo when project is loaded
  useEffect(() => {
    const checkProjectSetup = async () => {
      if (project?.path) {
        // Check if it's a git repository and initialize if not
        try {
          const isGitRepo = await api.checkIsGitRepo(project.path);

          if (!isGitRepo) {
            console.log('[WorkspaceSelector] Initializing git repository...');
            const gitResult = await api.initGitRepo(project.path);
            if (!gitResult.success) {
              console.warn('Git init failed:', gitResult.stderr);
            }
          }
        } catch (gitErr) {
          console.error('Failed to check/init git repo:', gitErr);
        }
      }
    };
    checkProjectSetup();
  }, [project?.path]);

  const handleBack = () => {
    goToProjectList();
  };

  const handleSelectMvp = () => {
    // MVP 선택 시 트랙 선택 화면으로
    setShowTrackSelector(true);
  };

  const handleTrackSelect = async (trackId: TrackId) => {
    if (projectId && project?.path) {
      // 트랙 저장 (BMAD 트랙인 경우 _bmad 폴더 자동 복사)
      await setProjectTrack(project.path, trackId);
      // MVP 워크스페이스로 이동 (trackId는 store에서 조회)
      goToMvp(projectId);
    }
  };

  const handleBackFromTrackSelector = () => {
    setShowTrackSelector(false);
  };

  const handleSelectMaintenance = () => {
    if (projectId) {
      goToMaintenance(projectId);
    }
  };

  // Get project name from path
  const projectName = project?.path ? getProjectName(project.path) : 'Project';

  // Show loading while initially fetching projects OR while project is undefined
  if (loading || !project) {
    return (
      <div className="h-full flex">
        <AppSidebar
          navDisabled
          showRightPanelToggle={false}
          showBackButton
          onBackClick={handleBack}
          onLogoClick={goToProjectList}
        />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  // 트랙 선택 화면 표시
  if (showTrackSelector) {
    return (
      <div className="h-full flex overflow-hidden bg-background">
        <AppSidebar
          navDisabled
          showRightPanelToggle={false}
          showBackButton
          onBackClick={handleBackFromTrackSelector}
          onLogoClick={goToProjectList}
        />
        <div className="flex-1 h-full overflow-y-auto relative">
          <TrackSelector
            onTrackSelect={handleTrackSelect}
            onBack={handleBackFromTrackSelector}
            projectName={projectName}
          />
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
          showBackButton
          onBackClick={handleBack}
          onLogoClick={goToProjectList}
        />

        {/* Main Content */}
        <div className="flex-1 h-full overflow-y-auto flex flex-col">
          {/* Breadcrumb - Top Left */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="p-6"
          >
            <Breadcrumb
              items={[
                {
                  label: t('workspaceSelector.breadcrumb.projects'),
                  onClick: goToProjectList,
                  icon: <FolderOpen className="w-4 h-4" />,
                },
                {
                  label: projectName,
                },
              ]}
            />
          </motion.div>

          {/* Center Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-8 pb-16">
            {/* Selection prompt */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, delay: 0.05 }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl font-medium text-muted-foreground">
                {t('workspaceSelector.prompt')}
              </h2>
            </motion.div>

            {/* Selection cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: 0.1 }}
              >
                <SelectionCard
                  iconImage={mvpTabIcon}
                  title={t('workspaceSelector.mvp.title')}
                  description={t('workspaceSelector.mvp.description')}
                  onClick={handleSelectMvp}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: 0.15 }}
              >
                <SelectionCard
                  iconImage={maintainTabIcon}
                  title={t('workspaceSelector.maintenance.title')}
                  description={t('workspaceSelector.maintenance.description')}
                  onClick={handleSelectMaintenance}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default WorkspaceSelector;
