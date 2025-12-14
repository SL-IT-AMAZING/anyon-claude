import React from 'react';
import { motion } from 'framer-motion';
import { Folder, MoreVertical, Trash2, Clock, CheckSquare, Square } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Project } from '@/lib/api';
import { getTemplateById, type TemplateId } from '@/types/template';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  onDelete?: (project: Project) => void;
  className?: string;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  /** Template ID for this project (optional) */
  templateId?: TemplateId | null;
}

/**
 * Extracts the project name from the full path
 */
const getProjectName = (path: string): string => {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] || path;
};

/**
 * Formats path to be home-relative
 */
const getDisplayPath = (path: string): string => {
  let displayPath = path;
  const homeIndicators = ['/Users/', '/home/'];
  for (const indicator of homeIndicators) {
    if (path.includes(indicator)) {
      const parts = path.split('/');
      const userIndex = parts.findIndex((_part, i) =>
        i > 0 && parts[i - 1] === indicator.split('/')[1]
      );
      if (userIndex > 0) {
        const relativePath = parts.slice(userIndex + 1).join('/');
        displayPath = `~/${relativePath}`;
        break;
      }
    }
  }
  return displayPath;
};

/**
 * Formats date relative to now
 */
const getRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp * 1000;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp * 1000).toLocaleDateString();
};

/**
 * ProjectCard - A card component for displaying a project
 *
 * Features:
 * - Project name and path display
 * - Last updated time
 * - Hover effects
 * - 3-dot menu for actions (delete)
 */
export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onClick,
  onDelete,
  className,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
  templateId,
}) => {
  const projectName = getProjectName(project.path);
  const displayPath = getDisplayPath(project.path);
  const lastUpdated = project.most_recent_session
    ? getRelativeTime(project.most_recent_session)
    : getRelativeTime(project.created_at);
  
  // Get template info for badge
  const template = templateId ? getTemplateById(templateId) : null;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(project);
  };

  const handleClick = () => {
    if (isSelectMode && onToggleSelect) {
      onToggleSelect();
    } else {
      onClick();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={className}
    >
      <Card
        className={cn(
          "relative group cursor-pointer",
          "p-4 h-[140px]",
          "transition-all duration-200",
          "hover:shadow-lg hover:border-primary/50",
          "flex flex-col justify-between",
          isSelectMode && isSelected && "border-primary bg-primary/5"
        )}
        onClick={handleClick}
      >
        {/* Top section - Icon and menu */}
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            {isSelectMode ? (
              isSelected ? (
                <CheckSquare className="w-5 h-5 text-primary" />
              ) : (
                <Square className="w-5 h-5 text-muted-foreground" />
              )
            ) : (
              <Folder className="w-5 h-5 text-primary" />
            )}
          </div>

          {/* 3-dot menu - hide in select mode */}
          {!isSelectMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Bottom section - Name and info */}
        <div className="space-y-1">
          <h3 className="font-semibold text-sm truncate" title={projectName}>
            {projectName}
          </h3>
          <p
            className="text-xs text-muted-foreground truncate"
            title={project.path}
          >
            {displayPath}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{lastUpdated}</span>
            </div>
            {/* Template badge */}
            {template && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                {template.name}
              </span>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default ProjectCard;
