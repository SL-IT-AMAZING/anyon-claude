import React, { Suspense, useEffect, useState, useCallback, createContext, useContext } from 'react';
import { Loader2 } from "lucide-react";
import { api, type Project } from '@/lib/api';
import { useTabContext } from '@/contexts/TabContext';

// Lazy load components
const ProjectListView = React.lazy(() => import('@/components/ProjectListView'));
const WorkspaceSelector = React.lazy(() => import('@/components/WorkspaceSelector'));
const MvpWorkspace = React.lazy(() => import('@/components/MvpWorkspace'));
const MaintenanceWorkspace = React.lazy(() => import('@/components/MaintenanceWorkspace'));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

// Route types for internal navigation
type ProjectsRouteType =
  | { type: 'list' }
  | { type: 'workspace-selector'; projectId: string }
  | { type: 'mvp'; projectId: string }
  | { type: 'maintenance'; projectId: string };

// Navigation context for internal routing within a projects tab
interface ProjectsNavigationContextType {
  currentRoute: ProjectsRouteType;
  navigate: (route: ProjectsRouteType) => void;
  goToProjectList: () => void;
  goToProject: (projectId: string) => void;
  goToMvp: (projectId: string) => void;
  goToMaintenance: (projectId: string) => void;
}

const ProjectsNavigationContext = createContext<ProjectsNavigationContextType | null>(null);

// Default navigation functions for when context is not available
const defaultNavigationContext: ProjectsNavigationContextType = {
  currentRoute: { type: 'list' },
  navigate: () => console.warn('Navigation not available outside ProjectRoutes'),
  goToProjectList: () => console.warn('Navigation not available outside ProjectRoutes'),
  goToProject: () => console.warn('Navigation not available outside ProjectRoutes'),
  goToMvp: () => console.warn('Navigation not available outside ProjectRoutes'),
  goToMaintenance: () => console.warn('Navigation not available outside ProjectRoutes'),
};

export const useProjectsNavigation = () => {
  const context = useContext(ProjectsNavigationContext);
  // Return default context if not within provider (e.g., during lazy loading)
  return context || defaultNavigationContext;
};

// Context for sharing projects data across routes
export const ProjectsContext = createContext<{
  projects: Project[];
  loading: boolean;
  error: string | null;
  refreshProjects: () => Promise<Project[]>;
  getProjectById: (id: string) => Project | undefined;
}>({
  projects: [],
  loading: false,
  error: null,
  refreshProjects: async () => [],
  getProjectById: () => undefined,
});

export const useProjects = () => useContext(ProjectsContext);

interface ProjectRoutesProps {
  /** The tab ID this ProjectRoutes belongs to */
  tabId: string;
}

/**
 * ProjectRoutes - Handles routing within the projects tab
 *
 * Uses internal state management instead of React Router to ensure
 * each projects tab has independent navigation state.
 *
 * Routes:
 * - list                           → Project list (grid cards)
 * - workspace-selector/:projectId  → Workspace type selection
 * - mvp/:projectId                 → MVP workspace
 * - maintenance/:projectId         → Maintenance workspace
 */
export const ProjectRoutes: React.FC<ProjectRoutesProps> = ({ tabId }) => {
  const { getTabById, updateTab } = useTabContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current tab to read/write route state
  const tab = getTabById(tabId);

  // Parse route from tab state or default to list
  const getCurrentRoute = useCallback((): ProjectsRouteType => {
    if (!tab?.projectsRoute) {
      return { type: 'list' };
    }

    const route = tab.projectsRoute;
    const params = tab.projectsRouteParams || {};

    switch (route) {
      case 'workspace-selector':
        return { type: 'workspace-selector', projectId: params.projectId || '' };
      case 'mvp':
        return { type: 'mvp', projectId: params.projectId || '' };
      case 'maintenance':
        return { type: 'maintenance', projectId: params.projectId || '' };
      default:
        return { type: 'list' };
    }
  }, [tab?.projectsRoute, tab?.projectsRouteParams]);

  const [currentRoute, setCurrentRoute] = useState<ProjectsRouteType>(getCurrentRoute);

  // Sync local state with tab state
  useEffect(() => {
    setCurrentRoute(getCurrentRoute());
  }, [getCurrentRoute]);

  // Navigation functions
  const navigate = useCallback((route: ProjectsRouteType) => {
    setCurrentRoute(route);

    // Persist to tab state
    let routeName: string;
    let params: Record<string, string> = {};

    switch (route.type) {
      case 'list':
        routeName = 'list';
        break;
      case 'workspace-selector':
        routeName = 'workspace-selector';
        params = { projectId: route.projectId };
        break;
      case 'mvp':
        routeName = 'mvp';
        params = { projectId: route.projectId };
        break;
      case 'maintenance':
        routeName = 'maintenance';
        params = { projectId: route.projectId };
        break;
    }

    updateTab(tabId, {
      projectsRoute: routeName,
      projectsRouteParams: params
    });
  }, [tabId, updateTab]);

  const goToProjectList = useCallback(() => {
    navigate({ type: 'list' });
  }, [navigate]);

  const goToProject = useCallback((projectId: string) => {
    navigate({ type: 'workspace-selector', projectId });
  }, [navigate]);

  const goToMvp = useCallback((projectId: string) => {
    navigate({ type: 'mvp', projectId });
  }, [navigate]);

  const goToMaintenance = useCallback((projectId: string) => {
    navigate({ type: 'maintenance', projectId });
  }, [navigate]);

  const loadProjects = useCallback(async (): Promise<Project[]> => {
    try {
      setLoading(true);
      setError(null);
      // Only load registered projects (user-added projects)
      const projectList = await api.listRegisteredProjects();
      setProjects(projectList);
      return projectList;
    } catch (err) {
      console.error("Failed to load projects:", err);
      setError("Failed to load projects. Please ensure ~/.claude directory exists.");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getProjectById = (id: string): Project | undefined => {
    return projects.find(p => p.id === id);
  };

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const projectsContextValue = {
    projects,
    loading,
    error,
    refreshProjects: loadProjects,
    getProjectById,
  };

  const navigationContextValue: ProjectsNavigationContextType = {
    currentRoute,
    navigate,
    goToProjectList,
    goToProject,
    goToMvp,
    goToMaintenance,
  };

  // Render the appropriate component based on current route
  const renderContent = () => {
    switch (currentRoute.type) {
      case 'list':
        return <ProjectListView />;
      case 'workspace-selector':
        return <WorkspaceSelector projectId={currentRoute.projectId} />;
      case 'mvp':
        return <MvpWorkspace projectId={currentRoute.projectId} />;
      case 'maintenance':
        return <MaintenanceWorkspace projectId={currentRoute.projectId} />;
      default:
        return <ProjectListView />;
    }
  };

  return (
    <ProjectsContext.Provider value={projectsContextValue}>
      <ProjectsNavigationContext.Provider value={navigationContextValue}>
        <Suspense fallback={<LoadingFallback />}>
          {renderContent()}
        </Suspense>
      </ProjectsNavigationContext.Provider>
    </ProjectsContext.Provider>
  );
};

export default ProjectRoutes;
