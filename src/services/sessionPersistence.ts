/**
 * Session Persistence Service
 * Handles saving and restoring session data for chat tabs
 */

import { api, type Session } from '@/lib/api';

const STORAGE_KEY_PREFIX = 'anyon_session_';
const SESSION_INDEX_KEY = 'anyon_session_index';
const TAB_SESSIONS_PREFIX = 'anyon_tab_sessions_';
const LAST_SESSION_PREFIX = 'anyon_last_session_';

export type TabType = 'mvp' | 'maintenance';

export interface SessionRestoreData {
  sessionId: string;
  projectId: string;
  projectPath: string;
  tabType?: TabType;
  firstMessage?: string;
  lastMessageCount?: number;
  scrollPosition?: number;
  timestamp: number;
}

export class SessionPersistenceService {
  /**
   * Save session data for later restoration
   */
  static saveSession(sessionId: string, projectId: string, projectPath: string, messageCount?: number, scrollPosition?: number): void {
    try {
      const sessionData: SessionRestoreData = {
        sessionId,
        projectId,
        projectPath,
        lastMessageCount: messageCount,
        scrollPosition,
        timestamp: Date.now()
      };

      // Save individual session data
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${sessionId}`, JSON.stringify(sessionData));

      // Update session index
      const index = this.getSessionIndex();
      if (!index.includes(sessionId)) {
        index.push(sessionId);
        localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(index));
      }
    } catch (error) {
      console.error('Failed to save session data:', error);
    }
  }

  /**
   * Load session data for restoration
   */
  static loadSession(sessionId: string): SessionRestoreData | null {
    try {
      const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${sessionId}`);
      if (!data) return null;

      const sessionData = JSON.parse(data) as SessionRestoreData;
      
      // Validate the data
      if (!sessionData.sessionId || !sessionData.projectId || !sessionData.projectPath) {
        return null;
      }

      return sessionData;
    } catch (error) {
      console.error('Failed to load session data:', error);
      return null;
    }
  }

  /**
   * Remove session data from storage
   */
  static removeSession(sessionId: string): void {
    try {
      // Remove session data
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${sessionId}`);

      // Update session index
      const index = this.getSessionIndex();
      const newIndex = index.filter(id => id !== sessionId);
      localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(newIndex));
    } catch (error) {
      console.error('Failed to remove session data:', error);
    }
  }

  /**
   * Get all saved session IDs
   */
  static getSessionIndex(): string[] {
    try {
      const index = localStorage.getItem(SESSION_INDEX_KEY);
      return index ? JSON.parse(index) : [];
    } catch (error) {
      console.error('Failed to get session index:', error);
      return [];
    }
  }

  /**
   * Clear all session data
   */
  static clearAllSessions(): void {
    try {
      const index = this.getSessionIndex();
      
      // Remove all session data
      index.forEach(sessionId => {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${sessionId}`);
      });

      // Clear the index
      localStorage.removeItem(SESSION_INDEX_KEY);
    } catch (error) {
      console.error('Failed to clear session data:', error);
    }
  }

  /**
   * Clean up old session data (older than 30 days)
   */
  static cleanupOldSessions(): void {
    try {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const index = this.getSessionIndex();
      const activeIndex: string[] = [];

      index.forEach(sessionId => {
        const data = this.loadSession(sessionId);
        if (data && data.timestamp > thirtyDaysAgo) {
          activeIndex.push(sessionId);
        } else {
          localStorage.removeItem(`${STORAGE_KEY_PREFIX}${sessionId}`);
        }
      });

      localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(activeIndex));
    } catch (error) {
      console.error('Failed to cleanup old sessions:', error);
    }
  }

  /**
   * Check if session exists on disk and is restorable
   */
  static async isSessionRestorable(sessionId: string, projectId: string): Promise<boolean> {
    try {
      // First check if we have the session metadata
      const sessionData = this.loadSession(sessionId);
      if (!sessionData) return false;

      // Try to verify the session exists on disk by loading its history
      const history = await api.loadSessionHistory(sessionId, projectId);
      return history && history.length > 0;
    } catch (error) {
      console.error('Failed to check session restorability:', error);
      return false;
    }
  }

  /**
   * Create Session object from restore data
   */
  static createSessionFromRestoreData(data: SessionRestoreData): Session {
    return {
      id: data.sessionId,
      project_id: data.projectId,
      project_path: data.projectPath,
      created_at: data.timestamp / 1000, // Convert to seconds
      first_message: data.firstMessage || "Restored session"
    };
  }

  // ============================================
  // Tab-specific session management
  // ============================================

  /**
   * Generate storage key for tab sessions
   */
  private static getTabSessionsKey(projectPath: string, tabType: TabType): string {
    const sanitizedPath = projectPath.replace(/[^a-zA-Z0-9]/g, '-');
    return `${TAB_SESSIONS_PREFIX}${sanitizedPath}_${tabType}`;
  }

  /**
   * Generate storage key for last session
   */
  private static getLastSessionKey(projectPath: string, tabType: TabType): string {
    const sanitizedPath = projectPath.replace(/[^a-zA-Z0-9]/g, '-');
    return `${LAST_SESSION_PREFIX}${sanitizedPath}_${tabType}`;
  }

  /**
   * Save session for a specific tab
   */
  static saveSessionForTab(
    sessionId: string,
    projectId: string,
    projectPath: string,
    tabType: TabType,
    firstMessage?: string,
    messageCount?: number
  ): void {
    try {
      const sessionData: SessionRestoreData = {
        sessionId,
        projectId,
        projectPath,
        tabType,
        firstMessage,
        lastMessageCount: messageCount,
        timestamp: Date.now()
      };

      // Save individual session data
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${sessionId}`, JSON.stringify(sessionData));

      // Update tab sessions list
      const sessions = this.getSessionsForTab(projectPath, tabType);
      const existingIndex = sessions.findIndex(s => s.sessionId === sessionId);

      if (existingIndex >= 0) {
        // Update existing session
        sessions[existingIndex] = sessionData;
      } else {
        // Add new session at the beginning
        sessions.unshift(sessionData);
      }

      // Keep only last 20 sessions per tab
      const trimmedSessions = sessions.slice(0, 20);
      localStorage.setItem(this.getTabSessionsKey(projectPath, tabType), JSON.stringify(trimmedSessions));

      // Also save to general index
      const index = this.getSessionIndex();
      if (!index.includes(sessionId)) {
        index.push(sessionId);
        localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(index));
      }
    } catch (error) {
      console.error('Failed to save tab session:', error);
    }
  }

  /**
   * Get all sessions for a specific tab
   */
  static getSessionsForTab(projectPath: string, tabType: TabType): SessionRestoreData[] {
    try {
      const key = this.getTabSessionsKey(projectPath, tabType);
      const data = localStorage.getItem(key);
      if (!data) return [];

      const sessions = JSON.parse(data) as SessionRestoreData[];
      // Sort by timestamp descending (newest first)
      return sessions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get tab sessions:', error);
      return [];
    }
  }

  /**
   * Save last used session for a tab
   */
  static saveLastSessionForTab(projectPath: string, tabType: TabType, sessionId: string): void {
    try {
      const key = this.getLastSessionKey(projectPath, tabType);
      localStorage.setItem(key, sessionId);
    } catch (error) {
      console.error('Failed to save last session:', error);
    }
  }

  /**
   * Get last used session for a tab
   */
  static getLastSessionForTab(projectPath: string, tabType: TabType): string | null {
    try {
      const key = this.getLastSessionKey(projectPath, tabType);
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Failed to get last session:', error);
      return null;
    }
  }

  /**
   * Get last session data for a tab (full data)
   */
  static getLastSessionDataForTab(projectPath: string, tabType: TabType): SessionRestoreData | null {
    const sessionId = this.getLastSessionForTab(projectPath, tabType);
    if (!sessionId) return null;
    return this.loadSession(sessionId);
  }

  /**
   * Remove a session from tab list
   */
  static removeSessionFromTab(projectPath: string, tabType: TabType, sessionId: string): void {
    try {
      const sessions = this.getSessionsForTab(projectPath, tabType);
      const filtered = sessions.filter(s => s.sessionId !== sessionId);
      localStorage.setItem(this.getTabSessionsKey(projectPath, tabType), JSON.stringify(filtered));

      // If this was the last session, clear it
      const lastSession = this.getLastSessionForTab(projectPath, tabType);
      if (lastSession === sessionId) {
        localStorage.removeItem(this.getLastSessionKey(projectPath, tabType));
      }
    } catch (error) {
      console.error('Failed to remove session from tab:', error);
    }
  }

  /**
   * Update first message for a session
   */
  static updateSessionFirstMessage(sessionId: string, firstMessage: string): void {
    try {
      const data = this.loadSession(sessionId);
      if (data) {
        data.firstMessage = firstMessage;
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${sessionId}`, JSON.stringify(data));

        // Also update in tab sessions if present
        if (data.tabType && data.projectPath) {
          const sessions = this.getSessionsForTab(data.projectPath, data.tabType);
          const index = sessions.findIndex(s => s.sessionId === sessionId);
          if (index >= 0) {
            sessions[index].firstMessage = firstMessage;
            localStorage.setItem(this.getTabSessionsKey(data.projectPath, data.tabType), JSON.stringify(sessions));
          }
        }
      }
    } catch (error) {
      console.error('Failed to update session first message:', error);
    }
  }
}
