import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, Crown, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface UserProfileDropdownProps {
  onSettingsClick?: () => void;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ onSettingsClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const handleAccountSettings = () => {
    onSettingsClick?.();
    setIsOpen(false);
  };

  // Get user initials for avatar


  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-2 p-1.5 pr-2.5 rounded-md hover:bg-accent transition-colors"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-border">
          <User className="w-4 h-4 text-primary" />
        </div>

        {/* Chevron */}
        <ChevronDown
          size={12}
          className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 bg-popover border border-border rounded-lg shadow-lg z-[250] overflow-hidden"
          >
            {/* User Info Section */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-border">
                  <User className="w-5 h-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Subscription Info */}
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">구독 플랜</span>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted">
                  <Crown size={10} className="text-yellow-500" />
                  <span className="text-xs font-medium">출시 예정</span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={handleAccountSettings}
                className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-3"
              >
                <User size={14} />
                <span>계정 설정</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm hover:bg-accent text-destructive hover:text-destructive transition-colors flex items-center gap-3"
              >
                <LogOut size={14} />
                <span>로그아웃</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
