import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { SelectionCard } from '@/components/ui/selection-card';
import { TRACKS, type TrackId } from '@/types/track';

// Track icons (placeholder - can be replaced with actual images)
const TRACK_ICONS: Record<TrackId, string> = {
  mvp: '🚀',
  ownuun: '🎯',
  ownuun2: '⚡',
  bmad: '📋',
  'quick-flow': '⚡',
  'plan-only': '📋',
  wireframe: '🎨',
};

interface TrackSelectorProps {
  onTrackSelect: (trackId: TrackId) => void;
  onBack: () => void;
  projectName?: string;
}

/**
 * TrackSelector - Choose development track (MVP, ownuun, BMAD)
 *
 * Displayed after selecting MVP workspace type
 */
export const TrackSelector: React.FC<TrackSelectorProps> = ({
  onTrackSelect,
  onBack,
  projectName = 'Project',
}) => {
  const availableTracks = TRACKS.filter((t) => t.available);

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 pb-16">
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.15 }}
        className="absolute top-6 left-6"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          뒤로
        </Button>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, delay: 0.05 }}
        className="text-center mb-12"
      >
        <h2 className="text-2xl font-medium text-foreground mb-2">
          개발 트랙 선택
        </h2>
        <p className="text-muted-foreground">
          <span className="font-medium">{projectName}</span> 프로젝트의 개발 방법론을 선택하세요
        </p>
      </motion.div>

      {/* Track cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {availableTracks.map((track, index) => (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.1 + index * 0.05 }}
          >
            <SelectionCard
              iconEmoji={TRACK_ICONS[track.id]}
              title={track.name}
              description={track.description}
              onClick={() => onTrackSelect(track.id)}
              className={
                track.id === 'mvp'
                  ? 'border-primary/30 bg-primary/5'
                  : undefined
              }
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TrackSelector;
