import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Search, Plus, Download, CheckCircle, AlertCircle, ArrowUpDown, Clock, SortAsc, Calendar, Trash2, X, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProjectCard } from '@/components/ProjectCard';
import { MinimalSidebar } from '@/components/MinimalSidebar';
import { Settings } from '@/components/Settings';
import { useProjects, useProjectsNavigation } from '@/components/ProjectRoutes';
import { api, type Project } from '@/lib/api';
import type { TemplateId } from '@/types/template';

// Cross-platform project name extractor (handles / and \\)
const getProjectName = (path: string): string => {
  const segments = path.split(/[/\\\\]+/);
  return segments[segments.length - 1] || '';
};

/**
 * ProjectListView - Grid card view of all projects with sidebar
 *
 * Layout:
 * ┌────────┬─────────────────────────────────────────┐
 * │Sidebar │         Project Grid                    │
 * │ (56px) │         (full width)                    │
 * └────────┴─────────────────────────────────────────┘
 */
export const ProjectListView: React.FC = () => {
  const { goToProject } = useProjectsNavigation();
  const { projects, loading, error, refreshProjects } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpeningFolder, setIsOpeningFolder] = useState(false);
  const [isInstallingAnyon, setIsInstallingAnyon] = useState(false);
  const [installStatus, setInstallStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'created'>('recent');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [projectTemplates, setProjectTemplates] = useState<Record<string, TemplateId>>({});

  const toggleSelectMode = () => {
    if (isSelectMode) {
      setSelectedProjects(new Set());
    }
    setIsSelectMode(!isSelectMode);
  };

  const toggleProjectSelection = (projectId: string) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
  };

  const selectAllDisplayed = () => {
    const newSelected = new Set<string>();
    filteredProjects.forEach(p => newSelected.add(p.id));
    setSelectedProjects(newSelected);
  };

  const deselectAll = () => {
    setSelectedProjects(new Set());
  };

  const handleDeleteSelected = async () => {
    if (selectedProjects.size === 0) return;
    
    const count = selectedProjects.size;
    if (window.confirm(`Remove ${count} project${count > 1 ? 's' : ''} from the list?`)) {
      try {
        const projectsToDelete = projects.filter(p => selectedProjects.has(p.id));
        for (const project of projectsToDelete) {
          await api.unregisterProject(project.path);
        }
        await refreshProjects();
        setSelectedProjects(new Set());
        setIsSelectMode(false);
      } catch (err) {
        console.error('Failed to remove projects:', err);
      }
    }
  };

  // Load projects on mount (ensure context stays in sync)
  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  // Load project templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templates = await api.getProjectTemplates();
        setProjectTemplates(templates as Record<string, TemplateId>);
      } catch (err) {
        console.error('Failed to load project templates:', err);
      }
    };
    loadTemplates();
  }, [projects]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    // First filter by search query
    const filtered = projects.filter((project) => {
      const projectName = getProjectName(project.path);
      return projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
             project.path.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Then sort based on sortBy
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          // Sort by most recent session, fallback to created_at
          const aTime = a.most_recent_session || a.created_at;
          const bTime = b.most_recent_session || b.created_at;
          return bTime - aTime; // Descending (newest first)
        case 'name':
          const aName = getProjectName(a.path).toLowerCase();
          const bName = getProjectName(b.path).toLowerCase();
          return aName.localeCompare(bName); // Ascending (A-Z)
        case 'created':
          return b.created_at - a.created_at; // Descending (newest first)
        default:
          return 0;
      }
    });
  }, [projects, searchQuery, sortBy]);

  const handleProjectClick = (project: Project) => {
    // Navigate to workspace selector for this project
    goToProject(project.id);
  };

  const handleOpenFolder = async () => {
    setIsOpeningFolder(true);
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Project Folder',
        defaultPath: await api.getHomeDirectory(),
      });

      if (selected && typeof selected === 'string') {
        console.log('[ProjectListView] Creating project for path:', selected);
        const project = await api.createProject(selected);
        console.log('[ProjectListView] Created project:', project);

        // Register the project so it appears in the list
        await api.registerProject(selected);
        console.log('[ProjectListView] Registered project');

        // Refresh project list and get the updated list
        const updatedProjects = await refreshProjects();
        console.log('[ProjectListView] Projects refreshed, count:', updatedProjects.length);

        // Find the project in the updated list to verify it exists
        const foundProject = updatedProjects.find(p => p.id === project.id);
        console.log('[ProjectListView] Found project in updated list:', foundProject);

        if (foundProject) {
          // Wait a moment for React state to propagate
          await new Promise(resolve => setTimeout(resolve, 500));

          // Navigate to the project workspace selector
          console.log('[ProjectListView] Navigating to project:', foundProject.id);
          goToProject(foundProject.id);
        } else {
          console.error('[ProjectListView] Project not found in updated list after registration');
        }

        // Run git init and anyon installation in the background
        setIsInstallingAnyon(true);
        setInstallStatus({ type: 'info', text: 'Checking git repository...' });

        try {
          console.log('[Git Check] Checking git repo for:', selected);
          const isGitRepo = await api.checkIsGitRepo(selected);
          console.log('[Git Check] Is git repo:', isGitRepo);

          if (!isGitRepo) {
            console.log('[Git Init] Initializing git repository...');
            setInstallStatus({ type: 'info', text: 'Initializing git repository...' });
            const gitResult = await api.initGitRepo(selected);
            console.log('[Git Init] Result:', gitResult);

            if (gitResult.success) {
              setInstallStatus({ type: 'success', text: 'Git repository initialized!' });
              console.log('[Git Init] Success!');
            } else {
              console.warn('[Git Init] Failed:', gitResult.stderr);
              setInstallStatus({ type: 'info', text: 'Git initialization failed, but continuing...' });
            }
            await new Promise(resolve => setTimeout(resolve, 1500));
          } else {
            console.log('[Git Check] Already a git repository, skipping init');
          }
        } catch (gitErr) {
          console.error('[Git Error] Failed to check/init git repo:', gitErr);
          // Continue even if git check/init fails
        }

        // Project setup complete
        setInstallStatus({ type: 'success', text: 'Project setup complete!' });
        setTimeout(() => setInstallStatus(null), 2000);
        setIsInstallingAnyon(false);
      }
    } catch (err) {
      console.error('Failed to open folder picker:', err);
    } finally {
      setIsOpeningFolder(false);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (window.confirm(`Remove project "${project.path.split('/').pop()}" from the list?`)) {
      try {
        // Unregister the project (removes from the app's project list)
        await api.unregisterProject(project.path);
        await refreshProjects();
      } catch (err) {
        console.error('Failed to remove project:', err);
      }
    }
  };

  // Handle project selection from sidebar
  const handleSidebarProjectSelect = (project: Project) => {
    goToProject(project.id);
  };

  // Show settings view
  if (showSettings) {
    return (
      <div className="h-full flex overflow-hidden bg-background">
        <MinimalSidebar
          settingsActive
          onSettingsClick={() => setShowSettings(false)}
          onLogoClick={() => setShowSettings(false)}
          onProjectSelect={handleSidebarProjectSelect}
        />
        <div className="flex-1 h-full overflow-y-auto">
          <Settings onBack={() => setShowSettings(false)} />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex">
        <MinimalSidebar
          onSettingsClick={() => setShowSettings(true)}
          onProjectSelect={handleSidebarProjectSelect}
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
      <MinimalSidebar
        onSettingsClick={() => setShowSettings(true)}
        onProjectSelect={handleSidebarProjectSelect}
      />

      {/* Main Content */}
      <div className="flex-1 h-full overflow-y-auto">
        {/* Installation Status - Bottom Center Inline */}
        <AnimatePresence>
          {installStatus && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
            >
              <div className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-lg border backdrop-blur-sm ${
                installStatus.type === 'error'
                  ? 'bg-destructive/90 border-destructive/30 text-white'
                  : installStatus.type === 'success'
                  ? 'bg-green-600/90 border-green-500/30 text-white'
                  : 'bg-background/95 border-border text-foreground'
              }`}>
                {installStatus.type === 'info' && <Loader2 className="h-4 w-4 animate-spin" />}
                {installStatus.type === 'success' && <CheckCircle className="h-4 w-4" />}
                {installStatus.type === 'error' && <AlertCircle className="h-4 w-4" />}
                <span className="text-sm font-medium">{installStatus.text}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Projects</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Select a project to start working
              </p>
            </div>
            <div className="flex items-center gap-2">
              <motion.div
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15 }}
              >
                <Button
                  onClick={handleOpenFolder}
                  disabled={isOpeningFolder || isInstallingAnyon}
                  className="flex items-center gap-2"
                >
                  {isOpeningFolder ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isInstallingAnyon ? (
                    <>
                      <Download className="h-4 w-4 animate-pulse" />
                      Installing...
                    </>
                  ) : (
                    <>
                      <FolderOpen className="h-4 w-4" />
                      Open Folder
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Search and Sort */}
          {projects.length > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="default" className="gap-2 min-w-[140px]">
                    <ArrowUpDown className="h-4 w-4" />
                    {sortBy === 'recent' && '최근 사용순'}
                    {sortBy === 'name' && '이름순'}
                    {sortBy === 'created' && '생성일순'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy('recent')} className="gap-2">
                    <Clock className="h-4 w-4" />
                    최근 사용순
                    {sortBy === 'recent' && <CheckCircle className="h-4 w-4 ml-auto text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('name')} className="gap-2">
                    <SortAsc className="h-4 w-4" />
                    이름순
                    {sortBy === 'name' && <CheckCircle className="h-4 w-4 ml-auto text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('created')} className="gap-2">
                    <Calendar className="h-4 w-4" />
                    생성일순
                    {sortBy === 'created' && <CheckCircle className="h-4 w-4 ml-auto text-primary" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Selection Mode Bar */}
          {projects.length > 0 && (
            <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-muted/50 border">
              {isSelectMode ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {selectedProjects.size > 0 
                        ? `${selectedProjects.size}개 선택됨`
                        : '삭제할 프로젝트를 선택하세요'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectedProjects.size === filteredProjects.length ? deselectAll : selectAllDisplayed}
                      className="text-xs"
                    >
                      {selectedProjects.size === filteredProjects.length ? '전체 해제' : '전체 선택'}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteSelected}
                      disabled={selectedProjects.size === 0}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      삭제 ({selectedProjects.size})
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleSelectMode}
                      className="flex items-center gap-1"
                    >
                      <X className="h-4 w-4" />
                      취소
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground">
                    {filteredProjects.length}개의 프로젝트
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectMode}
                    className="flex items-center gap-2 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    프로젝트 삭제
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Error state */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive"
            >
              {error}
            </motion.div>
          )}

          {/* Project grid */}
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProjects.map((project) => {
                // Find template for this project (normalize path for comparison)
                const templateId = Object.entries(projectTemplates).find(
                  ([path]) => path.replace(/\\/g, '/').toLowerCase() === project.path.replace(/\\/g, '/').toLowerCase()
                )?.[1] as TemplateId | undefined;
                
                return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => handleProjectClick(project)}
                  onDelete={handleDeleteProject}
                  isSelectMode={isSelectMode}
                  isSelected={selectedProjects.has(project.id)}
                  onToggleSelect={() => toggleProjectSelection(project.id)}
                  templateId={templateId}
                />
              );
              })}
            </div>
          ) : projects.length > 0 && searchQuery ? (
            /* No search results */
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                <p className="text-sm text-muted-foreground">
                  No projects match "{searchQuery}"
                </p>
              </div>
            </Card>
          ) : (
            /* Empty state */
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <FolderOpen className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Open a folder to get started with Claude Code
                </p>
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                >
                  <Button
                    onClick={handleOpenFolder}
                    disabled={isOpeningFolder || isInstallingAnyon}
                    className="flex items-center gap-2"
                  >
                    {isOpeningFolder ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isInstallingAnyon ? (
                      <>
                        <Download className="h-4 w-4 animate-pulse" />
                        Installing...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Open Your First Project
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectListView;
