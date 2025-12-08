import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Search, Loader2, Plus, Download, CheckCircle, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ProjectCard } from '@/components/ProjectCard';
import { useProjects, useProjectsNavigation } from '@/components/ProjectRoutes';
import { api, type Project } from '@/lib/api';

// Cross-platform project name extractor (handles / and \\)
const getProjectName = (path: string): string => {
  const segments = path.split(/[/\\\\]+/);
  return segments[segments.length - 1] || '';
};

/**
 * ProjectListView - Grid card view of all projects
 *
 * Features:
 * - Grid layout (responsive: 1-4 columns)
 * - Search functionality
 * - Open folder button
 * - Empty state
 * - Project deletion
 */
export const ProjectListView: React.FC = () => {
  const { goToProject } = useProjectsNavigation();
  const { projects, loading, error, refreshProjects } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpeningFolder, setIsOpeningFolder] = useState(false);
  const [isInstallingAnyon, setIsInstallingAnyon] = useState(false);
  const [installStatus, setInstallStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Filter projects by search query
  const filteredProjects = projects.filter((project) => {
    const projectName = getProjectName(project.path);
    return projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           project.path.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleProjectClick = (project: Project) => {
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
          
          // Navigate to the project
          console.log('[ProjectListView] Navigating to project:', project.id);
          goToProject(project.id);
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
        
        // Run npx anyon-agents@latest automatically
        setInstallStatus({ type: 'info', text: 'Installing ANYON agents...' });

        try {
          const result = await api.runNpxAnyonAgents(selected);
          if (result.success) {
            setInstallStatus({ type: 'success', text: 'ANYON agents installed successfully!' });
            setTimeout(() => setInstallStatus(null), 3000);
          } else {
            setInstallStatus({ type: 'error', text: result.stderr || 'Installation completed with warnings' });
            setTimeout(() => setInstallStatus(null), 5000);
          }
        } catch (installErr) {
          console.error('Failed to install anyon-agents:', installErr);
          setInstallStatus({ type: 'error', text: 'Installation failed. You can install later from project settings.' });
          setTimeout(() => setInstallStatus(null), 5000);
        } finally {
          setIsInstallingAnyon(false);
        }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Installation Status Toast */}
      <AnimatePresence>
        {installStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50"
          >
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
              installStatus.type === 'error' 
                ? 'bg-destructive/10 border-destructive/20 text-destructive' 
                : installStatus.type === 'success'
                ? 'bg-green-500/10 border-green-500/20 text-green-600'
                : 'bg-primary/10 border-primary/20 text-primary'
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

        {/* Search */}
        {projects.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
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
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleProjectClick(project)}
                onDelete={handleDeleteProject}
              />
            ))}
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
  );
};

export default ProjectListView;
