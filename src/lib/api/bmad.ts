import { apiCall } from '../apiAdapter';

/**
 * BMAD API
 * For managing BMAD track resources
 */
export const bmadApi = {
  /**
   * Check if _bmad folder exists in the project
   * @param projectPath - The project path to check
   * @returns Promise resolving to true if _bmad folder exists
   */
  async checkBmadFolder(projectPath: string): Promise<boolean> {
    return apiCall<boolean>('check_bmad_folder', { projectPath });
  },

  /**
   * Copy _bmad folder from anyon-claude to target project
   * @param targetProjectPath - The project path to copy _bmad folder to
   * @returns Promise resolving when copy is complete
   */
  async copyBmadFolder(targetProjectPath: string): Promise<void> {
    return apiCall<void>('copy_bmad_folder', { targetProjectPath });
  },
};
