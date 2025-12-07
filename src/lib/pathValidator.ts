/**
 * Path validation utilities for ensuring files are within project boundaries
 */

/**
 * Check if a file path is within the project directory
 * @param filePath - The file path to check
 * @param projectPath - The project root directory
 * @returns true if the file is within the project
 */
export function isPathInProject(filePath: string, projectPath: string): boolean {
  if (!filePath || !projectPath) return false;

  const normalizedFile = normalizePath(filePath).toLowerCase();
  const normalizedProject = normalizePath(projectPath).toLowerCase();

  // Ensure project path ends with separator for accurate prefix matching
  const projectPrefix = normalizedProject.endsWith('/')
    ? normalizedProject
    : normalizedProject + '/';

  return normalizedFile.startsWith(projectPrefix) || normalizedFile === normalizedProject;
}

/**
 * Get the relative path from the project root
 * @param filePath - The absolute file path
 * @param projectPath - The project root directory
 * @returns The relative path, or the original path if not in project
 */
export function getRelativePath(filePath: string, projectPath: string): string {
  if (!filePath || !projectPath) return filePath || '';

  const normalizedFile = normalizePath(filePath);
  const normalizedProject = normalizePath(projectPath);

  // Ensure project path ends with separator
  const projectPrefix = normalizedProject.endsWith('/')
    ? normalizedProject
    : normalizedProject + '/';

  if (normalizedFile.toLowerCase().startsWith(projectPrefix.toLowerCase())) {
    return normalizedFile.slice(projectPrefix.length);
  }

  return filePath;
}

/**
 * Normalize a path to use forward slashes and remove trailing slashes
 * @param path - The path to normalize
 * @returns Normalized path with forward slashes
 */
export function normalizePath(path: string): string {
  if (!path) return '';
  return path.replace(/\\/g, '/').replace(/\/+$/, '');
}

/**
 * Check if a path contains potentially dangerous sequences like ".."
 * @param path - The path to check
 * @returns true if the path contains dangerous sequences
 */
export function hasPathTraversal(path: string): boolean {
  if (!path) return false;
  const normalized = normalizePath(path);
  return normalized.includes('/../') ||
         normalized.startsWith('../') ||
         normalized.endsWith('/..') ||
         normalized === '..';
}

/**
 * Validate a file path for safety and project membership
 * @param filePath - The file path to validate
 * @param projectPath - The project root directory
 * @returns Object with validation result and error message if invalid
 */
export function validateFilePath(
  filePath: string,
  projectPath: string
): { valid: boolean; error?: string } {
  if (!filePath) {
    return { valid: false, error: 'File path is empty' };
  }

  if (!projectPath) {
    return { valid: false, error: 'Project path is not set' };
  }

  if (hasPathTraversal(filePath)) {
    return { valid: false, error: 'Path contains traversal sequences' };
  }

  if (!isPathInProject(filePath, projectPath)) {
    return { valid: false, error: 'File is outside project directory' };
  }

  return { valid: true };
}
