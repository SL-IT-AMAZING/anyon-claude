/**
 * Port management utilities
 *
 * Fixed port allocation strategy:
 * - Base port: 32100
 * - Port = 32100 + (projectId % 10000)
 *
 * This ensures deterministic port assignment and avoids port detection failures.
 */

/**
 * Calculate the fixed port for a given project
 * @param projectId - Numeric project identifier
 * @returns Port number in range 32100-42099
 */
export function getAppPort(projectId: number): number {
  return 32100 + (projectId % 10000);
}

/**
 * Convert project ID string to numeric ID for port calculation
 * Uses a simple hash function to convert string to consistent number
 * @param projectIdString - Project ID string (e.g., "home-user-projects-myapp")
 * @returns Numeric project ID
 */
export function projectIdToNumber(projectIdString: string): number {
  let hash = 0;
  for (let i = 0; i < projectIdString.length; i++) {
    const char = projectIdString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get port for a project given its string ID
 * @param projectIdString - Project ID string
 * @returns Port number
 */
export function getPortForProject(projectIdString: string): number {
  const numericId = projectIdToNumber(projectIdString);
  return getAppPort(numericId);
}
