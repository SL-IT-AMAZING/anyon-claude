import React from 'react';
import { motion } from 'framer-motion';
import { IconComponent } from '@/lib/icons';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SelectionCardProps {
  icon?: IconComponent;
  iconImage?: string;
  iconEmoji?: string;
  title: string;
  description: string;
  onClick: () => void;
  className?: string;
}

/**
 * SelectionCard - A large clickable card for selecting options
 *
 * Used for workspace type selection (MVP vs Maintenance)
 */
export const SelectionCard: React.FC<SelectionCardProps> = ({
  icon: Icon,
  iconImage,
  iconEmoji,
  title,
  description,
  onClick,
  className,
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      <Card
        onClick={onClick}
        className={cn(
          "cursor-pointer",
          "p-12 min-h-[400px]",
          "flex flex-col items-center justify-center text-center",
          "transition-all duration-200",
          "hover:shadow-lg hover:border-primary/50",
          "group",
          className
        )}
      >
        {/* Icon */}
        <div className={cn(
          "rounded-xl",
          "flex items-center justify-center",
          "mb-8 transition-colors duration-200",
          iconImage ? "w-56 h-56" : iconEmoji ? "w-24 h-24" : "w-24 h-24 bg-primary/10 group-hover:bg-primary/20"
        )}>
          {iconImage ? (
            <img src={iconImage} alt={title} className="w-52 h-52 object-contain logo-invert" />
          ) : iconEmoji ? (
            <span className="text-6xl">{iconEmoji}</span>
          ) : Icon ? (
            <Icon className="w-12 h-12 text-primary" />
          ) : null}
        </div>

        {/* Title */}
        <h3 className="text-2xl font-semibold mb-3">
          {title}
        </h3>

        {/* Description */}
        <p className="text-base text-muted-foreground leading-relaxed max-w-[280px]">
          {description}
        </p>
      </Card>
    </motion.div>
  );
};

export default SelectionCard;
