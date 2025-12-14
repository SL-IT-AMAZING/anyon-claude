import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Folder } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { api, type Project } from '@/lib/api';

export interface DropdownOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
  description?: string;
}

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  /** If true, show project dropdown on this item */
  isProjectSelector?: boolean;
  /** Current project path for highlighting active project */
  currentProjectPath?: string;
  /** Callback when a project is selected from dropdown */
  onProjectSelect?: (project: Project) => void;
  /** Generic dropdown options (alternative to project selector) */
  dropdownOptions?: DropdownOption[];
  /** Currently selected dropdown value */
  dropdownValue?: string;
  /** Callback when dropdown option is selected */
  onDropdownSelect?: (value: string) => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumb - Navigation breadcrumb component with optional project dropdown
 *
 * Usage:
 * <Breadcrumb
 *   items={[
 *     { label: 'Projects', onClick: () => goToProjectList(), icon: <Home /> },
 *     {
 *       label: 'my-project',
 *       isProjectSelector: true,
 *       currentProjectPath: '/path/to/project',
 *       onProjectSelect: (project) => switchProject(project)
 *     },
 *     { label: 'MVP' }
 *   ]}
 * />
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load projects when dropdown opens
  useEffect(() => {
    if (openDropdownIndex !== null) {
      const loadProjects = async () => {
        try {
          const projectList = await api.listRegisteredProjects();
          if (projectList && Array.isArray(projectList)) {
            setProjects(projectList);
          } else {
            console.warn('[Breadcrumb] Invalid project list received:', projectList);
            setProjects([]);
          }
        } catch (err) {
          console.error('[Breadcrumb] Failed to load projects:', err);
          setProjects([]);
        }
      };
      loadProjects();
    }
  }, [openDropdownIndex]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownIndex(null);
      }
    };

    if (openDropdownIndex !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openDropdownIndex]);

  const hasDropdown = (item: BreadcrumbItem) =>
    item.isProjectSelector || (item.dropdownOptions && item.dropdownOptions.length > 0);

  // Early return if items is not valid
  if (!items || !Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <nav className={cn('flex items-center gap-1.5 text-sm', className)}>
      {items.map((item, index) => {
        // Skip invalid items
        if (!item || typeof item.label !== 'string') {
          return null;
        }
        const isLast = index === items.length - 1;
        const isClickable = !!item.onClick || hasDropdown(item);
        const isDropdownOpen = openDropdownIndex === index;

        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
            )}

            {hasDropdown(item) ? (
              // Dropdown selector (project or generic)
              <div className="relative" ref={isDropdownOpen ? dropdownRef : undefined}>
                <button
                  onClick={() => setOpenDropdownIndex(isDropdownOpen ? null : index)}
                  className={cn(
                    'flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-all max-w-[220px]',
                    'hover:bg-muted/60 cursor-pointer border border-transparent',
                    isDropdownOpen && 'bg-muted/60 border-border/50',
                    isLast
                      ? 'font-semibold text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {item.icon && (
                    <span className="flex-shrink-0">{item.icon}</span>
                  )}
                  <span className="truncate">{item.label}</span>
                  <ChevronDown className={cn(
                    'w-3.5 h-3.5 flex-shrink-0 transition-transform text-muted-foreground',
                    isDropdownOpen && 'rotate-180'
                  )} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-1.5 min-w-[160px] max-w-[240px] bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50"
                    >
                      <div className="max-h-56 overflow-y-auto py-1">
                        {item.isProjectSelector ? (
                          // Project dropdown
                          projects.length === 0 ? (
                            <div className="px-3 py-3 text-xs text-muted-foreground text-center">
                              프로젝트 로딩 중...
                            </div>
                          ) : (
                            projects.map((project) => {
                              const name = project.path.split('/').pop() || project.path;
                              const isActive = project.path === item.currentProjectPath;
                              return (
                                <button
                                  key={project.id}
                                  onClick={() => {
                                    setOpenDropdownIndex(null);
                                    if (!isActive && item.onProjectSelect && project) {
                                      try {
                                        item.onProjectSelect(project);
                                      } catch (err) {
                                        console.error('[Breadcrumb] Error in onProjectSelect:', err);
                                      }
                                    }
                                  }}
                                  className={cn(
                                    'w-full flex items-center gap-2 px-2.5 py-2 text-sm text-left transition-colors',
                                    isActive
                                      ? 'bg-primary/10 text-primary font-medium'
                                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                  )}
                                >
                                  <Folder className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate">{name}</span>
                                </button>
                              );
                            })
                          )
                        ) : (
                          // Generic dropdown options
                          item.dropdownOptions?.map((option) => {
                            const isActive = option.value === item.dropdownValue;
                            return (
                              <button
                                key={option.value}
                                onClick={() => {
                                  setOpenDropdownIndex(null);
                                  if (!isActive && item.onDropdownSelect && option?.value) {
                                    try {
                                      item.onDropdownSelect(option.value);
                                    } catch (err) {
                                      console.error('[Breadcrumb] Error in onDropdownSelect:', err);
                                    }
                                  }
                                }}
                                className={cn(
                                  'w-full flex items-center gap-2 px-2.5 py-2 text-left transition-colors',
                                  isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                )}
                              >
                                {option.icon && (
                                  <span className="flex-shrink-0">{option.icon}</span>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className={cn('text-sm truncate', isActive && 'font-medium')}>
                                    {option.label}
                                  </div>
                                  {option.description && (
                                    <div className="text-xs text-muted-foreground/70 truncate">
                                      {option.description}
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              // Regular breadcrumb item
              <button
                onClick={item.onClick}
                disabled={!isClickable}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-colors max-w-[220px]',
                  isClickable
                    ? 'hover:bg-muted/60 text-muted-foreground hover:text-foreground cursor-pointer'
                    : 'text-foreground cursor-default',
                  isLast && 'font-semibold'
                )}
              >
                {item.icon && (
                  <span className="flex-shrink-0">{item.icon}</span>
                )}
                <span className="truncate">{item.label}</span>
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
