import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Wrench,
  Save,
  Trash2,
  HardDrive,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SelectComponent, type SelectOption } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { api, type CheckpointStrategy } from "@/lib/api";
import { cn } from "@/lib/utils";

interface CheckpointSettingsProps {
  sessionId: string;
  projectId: string;
  projectPath: string;
  onClose?: () => void;
  className?: string;
}

/**
 * CheckpointSettings component for managing checkpoint configuration
 * 
 * @example
 * <CheckpointSettings 
 *   sessionId={session.id}
 *   projectId={session.project_id}
 *   projectPath={projectPath}
 * />
 */
export const CheckpointSettings: React.FC<CheckpointSettingsProps> = ({
  sessionId,
  projectId,
  projectPath,
  className,
}) => {
  const [autoCheckpointEnabled, setAutoCheckpointEnabled] = useState(true);
  const [checkpointStrategy, setCheckpointStrategy] = useState<CheckpointStrategy>("smart");
  const [totalCheckpoints, setTotalCheckpoints] = useState(0);
  const [keepCount, setKeepCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const strategyOptions: SelectOption[] = [
    { value: "manual", label: "수동으로만" },
    { value: "per_prompt", label: "질문할 때마다" },
    { value: "per_tool_use", label: "도구 사용할 때마다" },
    { value: "smart", label: "자동 (권장)" },
  ];

  useEffect(() => {
    loadSettings();
  }, [sessionId, projectId, projectPath]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const settings = await api.getCheckpointSettings(sessionId, projectId, projectPath);
      setAutoCheckpointEnabled(settings.auto_checkpoint_enabled);
      setCheckpointStrategy(settings.checkpoint_strategy);
      setTotalCheckpoints(settings.total_checkpoints);
    } catch (err) {
      console.error("Failed to load checkpoint settings:", err);
      setError("설정을 불러오는 데 실패했어요");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      await api.updateCheckpointSettings(
        sessionId,
        projectId,
        projectPath,
        autoCheckpointEnabled,
        checkpointStrategy
      );
      
      setSuccessMessage("설정이 저장되었어요");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to save checkpoint settings:", err);
      setError("설정 저장에 실패했어요");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCleanup = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      const removed = await api.cleanupOldCheckpoints(
        sessionId,
        projectId,
        projectPath,
        keepCount
      );
      
      setSuccessMessage(`오래된 저장 시점 ${removed}개를 삭제했어요`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Reload settings to get updated count
      await loadSettings();
    } catch (err) {
      console.error("Failed to cleanup checkpoints:", err);
      setError("정리하는 중 오류가 발생했어요");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className={cn("space-y-4", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Wrench className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-heading-4 font-semibold">자동 저장 설정</h3>
            <p className="text-caption text-muted-foreground mt-0.5">작업 히스토리 저장 및 복구 관리</p>
          </div>
        </div>
      </div>

      {/* Experimental Feature Warning */}
      <div className="rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-3">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="space-y-0.5">
            <p className="text-caption font-medium text-amber-900 dark:text-amber-100">베타 기능</p>
            <p className="text-caption text-amber-700 dark:text-amber-300">
              이 기능은 아직 테스트 중이에요. 파일이 예상치 못하게 변경될 수 있으니 중요한 작업 전에 백업해 두세요.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
            <span className="text-caption text-destructive">{error}</span>
          </div>
        </motion.div>
      )}

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="rounded-md border border-green-600/50 bg-green-50 dark:bg-green-950/20 p-3"
        >
          <span className="text-caption text-green-700 dark:text-green-400">{successMessage}</span>
        </motion.div>
      )}

      {/* Main Settings Card */}
      <Card className="p-5 space-y-4">
        {/* Auto-checkpoint toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-checkpoint" className="text-label">자동 저장</Label>
            <p className="text-caption text-muted-foreground">
              선택한 방식에 따라 작업 상태를 자동으로 저장해요
            </p>
          </div>
          <Switch
            id="auto-checkpoint"
            checked={autoCheckpointEnabled}
            onCheckedChange={setAutoCheckpointEnabled}
            disabled={isLoading}
          />
        </div>

        {/* Checkpoint strategy */}
        <div className="space-y-2">
          <Label htmlFor="strategy" className="text-label">저장 방식</Label>
          <SelectComponent
            value={checkpointStrategy}
            onValueChange={(value: string) => setCheckpointStrategy(value as CheckpointStrategy)}
            options={strategyOptions}
            disabled={isLoading || !autoCheckpointEnabled}
          />
          <p className="text-caption text-muted-foreground">
            {checkpointStrategy === "manual" && "직접 저장 버튼을 눌러야 저장돼요"}
            {checkpointStrategy === "per_prompt" && "Claude에게 질문할 때마다 자동 저장돼요"}
            {checkpointStrategy === "per_tool_use" && "Claude가 파일을 수정할 때마다 자동 저장돼요"}
            {checkpointStrategy === "smart" && "파일 삭제 등 위험한 작업 후에만 자동 저장돼요"}
          </p>
        </div>

        {/* Save button */}
        <motion.div
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15 }}
        >
          <Button
            onClick={handleSaveSettings}
            disabled={isLoading || isSaving}
            className="w-full"
            size="default"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                설정 저장
              </>
            )}
          </Button>
        </motion.div>
      </Card>

      {/* Storage Management Card */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <Label className="text-label">저장 공간 관리</Label>
            </div>
            <p className="text-caption text-muted-foreground">
              총 저장된 시점: <span className="font-medium text-foreground">{totalCheckpoints}개</span>
            </p>
          </div>
        </div>

        {/* Cleanup settings */}
        <div className="space-y-2">
          <Label htmlFor="keep-count" className="text-label">최근 저장 유지 개수</Label>
          <div className="flex gap-2">
            <Input
              id="keep-count"
              type="number"
              min="1"
              max="100"
              value={keepCount}
              onChange={(e) => setKeepCount(parseInt(e.target.value) || 10)}
              disabled={isLoading}
              className="flex-1 h-9"
            />
            <motion.div
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                variant="outline"
                onClick={handleCleanup}
                disabled={isLoading || totalCheckpoints <= keepCount}
                size="sm"
                className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                정리하기
              </Button>
            </motion.div>
          </div>
          <p className="text-caption text-muted-foreground">
            오래된 저장 시점을 삭제하고 최근 {keepCount}개만 남겨요
          </p>
        </div>
      </Card>
    </motion.div>
  );
}; 