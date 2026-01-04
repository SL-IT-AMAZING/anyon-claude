import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { X, Code, MessageCircle, Sparkles, Tag, BookOpen, Rocket } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import type { TrackId } from '@/types/track';

interface PlanningCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedWithAI: () => void;
  onContactSupport: () => void;
  trackId?: TrackId;
}

// 트랙별 모달 텍스트 설정
const getTrackContent = (trackId?: TrackId) => {
  if (trackId === 'quick-flow') {
    return {
      title: '실행 계획 수립 완료!',
      description: (
        <>
          다음 단계는 <span className="font-medium text-foreground">빠른 개발 실행</span>입니다.<br />
          AI가 티켓을 순서대로 구현합니다.
        </>
      ),
      buttonText: '개발 시작하기',
      buttonIcon: Rocket,
    };
  }
  return {
    title: '기획문서 작성 완료!',
    description: (
      <>
        다음 단계는 <span className="font-medium text-foreground">개발문서 작성</span>입니다.<br />
        AI가 기획문서를 바탕으로 개발을 진행합니다.
      </>
    ),
    buttonText: '개발문서 작성하기',
    buttonIcon: Code,
  };
};

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.15 },
  },
};

export function PlanningCompleteModal({
  isOpen,
  onClose,
  onProceedWithAI,
  onContactSupport,
  trackId,
}: PlanningCompleteModalProps) {
  const content = getTrackContent(trackId);
  const ButtonIcon = content.buttonIcon;

  const handleProceed = () => {
    onProceedWithAI();
    onClose();
  };

  const handleContact = () => {
    onContactSupport();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-10 w-full max-w-md mx-4 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X size={20} />
            </button>

            {/* Content */}
            <div className="p-6 pt-8">
              {/* Success Icon */}
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Sparkles className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>

              {/* Title */}
              <h2 className="text-center text-xl font-semibold text-foreground mb-2">
                {content.title}
              </h2>

              {/* Description */}
              <p className="text-center text-muted-foreground text-sm mb-6">
                {content.description}
              </p>

              {/* Primary Action */}
              <Button
                onClick={handleProceed}
                className="w-full mb-3 h-12 text-base font-medium"
                size="lg"
              >
                <ButtonIcon className="mr-2 h-5 w-5" />
                {content.buttonText}
              </Button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    또는
                  </span>
                </div>
              </div>

              {/* Secondary Action - Outsourcing */}
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground mb-2">
                      전문 개발팀에 맡기고 싶으신가요?
                    </h3>

                    {/* Benefits */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Tag className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span>Anyon 앱 문의 고객 <span className="font-medium text-foreground">시중가 50% 할인</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span>유지보수를 위한 <span className="font-medium text-foreground">Anyon 활용 교육</span> 제공</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleContact}
                      className="w-full border-primary/30 hover:bg-primary/10"
                    >
                      카카오톡으로 상담하기
                    </Button>
                  </div>
                </div>
              </div>

              {/* Help text */}
              <p className="mt-4 text-center text-xs text-muted-foreground">
                언제든지 우측 하단{' '}
                <span className="inline-flex items-center">
                  <span className="mx-1 inline-block h-4 w-4 rounded-full bg-primary" />
                </span>
                버튼으로 도움을 요청할 수 있어요
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
