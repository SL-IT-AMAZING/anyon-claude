/**
 * API Module - Main entry point
 * Re-exports all API modules for backward compatibility
 */

// Re-export all types
export * from './types';

// Import individual API modules
import { projectsApi } from './projects';
import { agentsApi } from './agents';
import { sessionsApi } from './sessions';
import { mcpApi } from './mcp';
import { storageApi } from './storage';
import { usageApi } from './usage';
import { claudeApi, claudeAuthApi as _claudeAuthApi, planningApi as _planningApi } from './claude';
import { gitApi } from './git';
import { bmadApi } from './bmad';

// Re-export ANYON API types
export type { AnyonApiUsage } from './claude';

// Re-export individual APIs for granular imports
export { projectsApi } from './projects';
export { agentsApi } from './agents';
export { sessionsApi } from './sessions';
export { mcpApi } from './mcp';
export { storageApi } from './storage';
export { usageApi } from './usage';
export { claudeApi } from './claude';
export { gitApi } from './git';
export type { GitDiffSummary } from './git';
export { environmentApi } from './environment';
export type { DependencyStatus, EnvironmentStatus } from './environment';
export { bmadApi } from './bmad';

// Compose the main api object for backward compatibility
// This maintains the same interface as the original api.ts
export const api = {
  // Projects
  ...projectsApi,

  // Agents
  ...agentsApi,

  // Sessions
  ...sessionsApi,

  // MCP
  ...mcpApi,

  // Storage
  ...storageApi,

  // Usage
  ...usageApi,

  // Claude (settings, files, hooks, commands)
  ...claudeApi,

  // Git operations
  ...gitApi,

  // BMAD
  ...bmadApi,

  // Registered Projects (uses storage internally)
  async getRegisteredProjects(): Promise<string[]> {
    try {
      const setting = await storageApi.getSetting('registered_projects');
      if (!setting || setting === '""' || setting === 'null') {
        return [];
      }
      const parsed = JSON.parse(setting) as string[];
      const filtered = parsed.filter(p => p && p.trim().length > 0);
      return filtered;
    } catch (error) {
      console.error('Failed to get registered projects:', error);
      return [];
    }
  },

  async registerProject(projectPath: string): Promise<void> {
    const normalizeProjectPath = (p: string): string =>
      p.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();

    try {
      const registered = await this.getRegisteredProjects();
      const normalizedProjectPath = normalizeProjectPath(projectPath);
      const registeredNormalized = registered.map(normalizeProjectPath);

      if (!registeredNormalized.includes(normalizedProjectPath)) {
        registered.push(projectPath);
        await storageApi.saveSetting('registered_projects', JSON.stringify(registered));
      }
    } catch (error) {
      console.error('Failed to register project:', error);
      throw error;
    }
  },

  async unregisterProject(projectPath: string): Promise<void> {
    const normalizeProjectPath = (p: string): string =>
      p.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();

    try {
      const registered = await this.getRegisteredProjects();
      const normalizedProjectPath = normalizeProjectPath(projectPath);
      const filtered = registered.filter(
        p => normalizeProjectPath(p) !== normalizedProjectPath
      );
      await storageApi.saveSetting('registered_projects', JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to unregister project:', error);
      throw error;
    }
  },

  async listRegisteredProjects() {
    const normalizeProjectPath = (p: string): string =>
      p.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();

    try {
      const registeredPaths = await this.getRegisteredProjects();
      if (registeredPaths.length === 0) {
        return [];
      }
      const allProjects = await projectsApi.listProjects();
      const registeredNormalized = registeredPaths.map(normalizeProjectPath);
      return allProjects.filter(p => registeredNormalized.includes(normalizeProjectPath(p.path)));
    } catch (error) {
      console.error('Failed to list registered projects:', error);
      return [];
    }
  },

  // Project Templates (uses storage internally)
  async getProjectTemplates(): Promise<Record<string, string>> {
    try {
      const setting = await storageApi.getSetting('project_templates');
      if (!setting || setting === '""' || setting === 'null') {
        return {};
      }
      return JSON.parse(setting) as Record<string, string>;
    } catch (error) {
      console.error('Failed to get project templates:', error);
      return {};
    }
  },

  async getProjectTemplate(projectPath: string): Promise<string | null> {
    const normalizeProjectPath = (p: string): string =>
      p.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();

    try {
      const templates = await this.getProjectTemplates();
      const normalizedPath = normalizeProjectPath(projectPath);

      for (const [path, templateId] of Object.entries(templates)) {
        if (normalizeProjectPath(path) === normalizedPath) {
          return templateId;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get project template:', error);
      return null;
    }
  },

  async setProjectTemplate(projectPath: string, templateId: string): Promise<void> {
    try {
      const templates = await this.getProjectTemplates();
      templates[projectPath] = templateId;
      await storageApi.saveSetting('project_templates', JSON.stringify(templates));
    } catch (error) {
      console.error('Failed to set project template:', error);
      throw error;
    }
  },
};

// Re-export auth and planning APIs
export const claudeAuthApi = _claudeAuthApi;
export const planningApi = _planningApi;
