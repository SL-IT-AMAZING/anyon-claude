import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lightbulb, Wrench, Loader2, Download, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SelectionCard } from '@/components/ui/selection-card';
import { useProjects, useProjectsNavigation } from '@/components/ProjectRoutes';
import { api } from '@/lib/api';
import type { Project } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
 * Displays two large cards for selecting the workspace type:
 * - MVP Development: For building new features with AI-assisted planning
 * - Maintenance: For fixing bugs and maintaining existing code
 */
export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({ projectId }) => {
  const { goToProjectList, goToMvp, goToMaintenance } = useProjectsNavigation();
  const { projects, loading, getProjectById } = useProjects();
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installMessage, setInstallMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

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

  // Check git repo and anyon installation when project is loaded
  useEffect(() => {
    const checkProjectSetup = async () => {
      if (project?.path) {
        // First, check if it's a git repository and initialize if not
        try {
          const isGitRepo = await api.checkIsGitRepo(project.path);
          
          if (!isGitRepo) {
            setInstallMessage({ type: 'info', text: 'Initializing git repository...' });
            const gitResult = await api.initGitRepo(project.path);
            
            if (gitResult.success) {
              setInstallMessage({ type: 'success', text: 'Git repository initialized!' });
              setTimeout(() => setInstallMessage(null), 2000);
            } else {
              console.warn('Git init failed:', gitResult.stderr);
              setInstallMessage({ type: 'info', text: 'Git initialization failed, but continuing...' });
              setTimeout(() => setInstallMessage(null), 2000);
            }
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        } catch (gitErr) {
          console.error('Failed to check/init git repo:', gitErr);
          // Continue even if git check/init fails
        }
        
        // Then check anyon installation
        const status = await api.checkAnyonInstalled(project.path);
        if (!status.is_installed) {
          setShowInstallDialog(true);
        }
      }
    };
    checkProjectSetup();
  }, [project?.path]);

  const handleInstallAnyon = async () => {
    if (!project?.path) return;
    
    setIsInstalling(true);
    setShowInstallDialog(false);
    setInstallMessage({ type: 'info', text: 'Installing ANYON agents...' });
    
    try {
      const result = await api.runNpxAnyonAgents(project.path);
      if (result.success) {
        setInstallMessage({ type: 'success', text: 'ANYON agents installed successfully!' });
        setTimeout(() => setInstallMessage(null), 3000);
      } else {
        setInstallMessage({ type: 'error', text: result.stderr || 'Installation completed with warnings' });
        setTimeout(() => setInstallMessage(null), 5000);
      }
    } catch (err) {
      console.error('Failed to install anyon-agents:', err);
      setInstallMessage({ type: 'error', text: 'Installation failed. Please try again or install manually.' });
      setTimeout(() => setInstallMessage(null), 5000);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleBack = () => {
    goToProjectList();
  };

  const handleSelectMvp = () => {
    if (projectId) {
      goToMvp(projectId);
    }
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
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* ANYON Installation Dialog */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              ANYON Agents Not Installed
            </DialogTitle>
            <DialogDescription>
              This project doesn't have ANYON agents installed. ANYON agents provide enhanced AI-assisted development workflows.
              <br /><br />
              Would you like to install them now?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInstallDialog(false)}>
              Later
            </Button>
            <Button onClick={handleInstallAnyon}>
              <Download className="mr-2 h-4 w-4" />
              Install Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Installing indicator / Status message */}
          {(isInstalling || installMessage) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-4 p-3 rounded-lg flex items-center gap-3 ${
                installMessage?.type === 'error' 
                  ? 'bg-destructive/10 border border-destructive/20' 
                  : installMessage?.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/20'
                  : 'bg-primary/10 border border-primary/20'
              }`}
            >
              {isInstalling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm">Installing ANYON agents...</span>
                </>
              ) : installMessage && (
                <span className={`text-sm ${
                  installMessage.type === 'error' ? 'text-destructive' : 
                  installMessage.type === 'success' ? 'text-green-500' : ''
                }`}>
                  {installMessage.text}
                </span>
              )}
            </motion.div>
          )}

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{projectName}</h1>
                <p className="text-sm text-muted-foreground">
                  {project?.path}
                </p>
              </div>
            </div>
          </motion.div>

        {/* Selection prompt */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, delay: 0.05 }}
          className="text-center mb-8"
        >
          <h2 className="text-xl font-medium text-muted-foreground">
            What would you like to do?
          </h2>
        </motion.div>

        {/* Selection cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.1 }}
          >
            <SelectionCard
              icon={Lightbulb}
              title="MVP Development"
              description="Build new features with AI-assisted planning and documentation"
              onClick={handleSelectMvp}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.15 }}
          >
            <SelectionCard
              icon={Wrench}
              title="Maintenance"
              description="Fix bugs, refactor code, and maintain existing features"
              onClick={handleSelectMaintenance}
            />
          </motion.div>
        </div>
      </div>
    </div>
    </>
  );
};

export default WorkspaceSelector;
