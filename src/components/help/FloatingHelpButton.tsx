import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { open } from '@tauri-apps/plugin-shell';
import { MessageCircle } from '@/lib/icons';
import { SUPPORT_CONFIG } from '@/constants/support';
import { cn } from '@/lib/utils';

interface FloatingHelpButtonProps {
  className?: string;
  bottomOffset?: number;
}

export function FloatingHelpButton({ className, bottomOffset }: FloatingHelpButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(async () => {
    await open(SUPPORT_CONFIG.KAKAO_CHANNEL_URL);
  }, []);

  return (
    <div
      className={cn('fixed z-50', className)}
      style={{
        bottom: bottomOffset ?? SUPPORT_CONFIG.UI.FLOATING_BUTTON_OFFSET,
        right: SUPPORT_CONFIG.UI.FLOATING_BUTTON_OFFSET,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.button
        onClick={handleClick}
        className="flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg focus:outline-none overflow-hidden"
        animate={{
          width: isHovered ? 250 : 32,
          height: isHovered ? 52 : 32,
          padding: isHovered ? '16px 28px' : '0px',
        }}
        whileHover={{
          boxShadow: '0 8px 30px rgba(217, 119, 87, 0.4)',
        }}
        whileTap={{ scale: 0.95 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 25,
        }}
        aria-label="외주 신청 또는 도움 요청"
      >
        {!isHovered && <span className="text-base">🎧</span>}
        {isHovered && (
          <motion.div
            className="flex items-center gap-2 text-sm font-medium whitespace-nowrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <MessageCircle size={18} />
            <span>외주 신청 or 도움 요청</span>
          </motion.div>
        )}
      </motion.button>
    </div>
  );
}
