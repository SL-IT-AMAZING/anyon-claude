import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key,
  RefreshCw,
  Terminal,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  Shield,
  Trash2,
  User,
  Info,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { claudeAuthApi, type ClaudeAuthStatus } from "@/lib/api";
import { useTranslation } from "@/hooks";

interface ClaudeAuthSettingsProps {
  className?: string;
  setToast?: (toast: { message: string; type: 'success' | 'error' } | null) => void;
}

type AuthMethod = "oauth" | "api-key";

export const ClaudeAuthSettings: React.FC<ClaudeAuthSettingsProps> = ({
  className,
  setToast,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<ClaudeAuthStatus | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod>("oauth");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [openingTerminal, setOpeningTerminal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isWebMode, setIsWebMode] = useState(false);
  const [isWindows, setIsWindows] = useState(false);

  // Check platform
  useEffect(() => {
    const checkPlatform = async () => {
      // Check if running in web mode (no Tauri)
      // More robust check for Tauri environment
      const isTauri = !!(
        window.__TAURI__ ||
        (window as any).__TAURI_INTERNALS__ ||
        (window as any).__TAURI_METADATA__ ||
        window.location.protocol === 'tauri:' ||
        window.location.hostname === 'tauri.localhost'
      );

      console.log("[ClaudeAuthSettings] Platform check:");
      console.log("  - window.__TAURI__:", !!window.__TAURI__);
      console.log("  - __TAURI_INTERNALS__:", !!(window as any).__TAURI_INTERNALS__);
      console.log("  - __TAURI_METADATA__:", !!(window as any).__TAURI_METADATA__);
      console.log("  - protocol:", window.location.protocol);
      console.log("  - hostname:", window.location.hostname);
      console.log("  - isTauri:", isTauri);

      setIsWebMode(!isTauri);

      // Check if Windows (for API key helper note)
      const platform = navigator.platform.toLowerCase();
      setIsWindows(platform.includes('win'));
    };
    checkPlatform();
  }, []);

  // Load auth status
  const loadAuthStatus = useCallback(async () => {
    try {
      setLoading(true);
      const status = await claudeAuthApi.check();
      setAuthStatus(status);

      // Auto-select method based on current auth
      if (status.is_authenticated) {
        setSelectedMethod(status.auth_method === "api_key" ? "api-key" : "oauth");
      }
    } catch (err) {
      console.error("Failed to load auth status:", err);
      setAuthStatus({
        is_authenticated: false,
        auth_method: "none",
        is_expired: false,
        error: "Failed to check authentication status",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuthStatus();
  }, [loadAuthStatus]);

  // Handle terminal login
  const handleTerminalLogin = async () => {
    console.log("[ClaudeAuthSettings] handleTerminalLogin called");
    console.log("[ClaudeAuthSettings] isWebMode:", isWebMode);
    console.log("[ClaudeAuthSettings] window.__TAURI__:", !!window.__TAURI__);

    try {
      setOpeningTerminal(true);
      console.log("[ClaudeAuthSettings] Calling claudeAuthApi.openTerminal()...");
      await claudeAuthApi.openTerminal();
      console.log("[ClaudeAuthSettings] Terminal opened successfully");
      setToast?.({ message: t('settings.claudeAuth.terminalOpened') || "Terminal opened - please complete login", type: "success" });
    } catch (err) {
      console.error("[ClaudeAuthSettings] Failed to open terminal:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setToast?.({ message: `Failed to open terminal: ${errorMessage}`, type: "error" });
    } finally {
      setOpeningTerminal(false);
    }
  };

  // Handle API key save
  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;

    try {
      setSaving(true);

      // Validate first
      const validationResult = await claudeAuthApi.validateApiKey(apiKeyInput.trim());
      if (!validationResult.valid) {
        setToast?.({ message: validationResult.error || "Invalid API key", type: "error" });
        return;
      }

      // Save
      await claudeAuthApi.saveApiKey(apiKeyInput.trim());
      setToast?.({ message: t('settings.claudeAuth.connectionSuccess'), type: "success" });
      setApiKeyInput("");
      await loadAuthStatus();
    } catch (err) {
      console.error("Failed to save API key:", err);
      setToast?.({ message: "Failed to save API key", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Handle API key delete
  const handleDeleteApiKey = async () => {
    try {
      setDeleting(true);
      await claudeAuthApi.deleteApiKey();
      setToast?.({ message: "API key deleted", type: "success" });
      await loadAuthStatus();
    } catch (err) {
      console.error("Failed to delete API key:", err);
      setToast?.({ message: "Failed to delete API key", type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  // Handle OAuth logout
  const handleLogout = async () => {
    // Confirm before logout
    if (!window.confirm(t('settings.claudeAuth.logoutConfirm'))) {
      return;
    }

    try {
      setLoggingOut(true);
      await claudeAuthApi.logout();
      setToast?.({ message: t('settings.claudeAuth.logoutSuccess'), type: "success" });
      await loadAuthStatus();
    } catch (err) {
      console.error("Failed to logout:", err);
      setToast?.({ message: t('settings.claudeAuth.logoutFailed'), type: "error" });
    } finally {
      setLoggingOut(false);
    }
  };

  // Render status badge
  const renderStatusBadge = () => {
    if (!authStatus) return null;

    if (authStatus.is_authenticated) {
      const isExpired = authStatus.expires_at && new Date(authStatus.expires_at) < new Date();

      if (isExpired) {
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
              {t('settings.claudeAuth.expired')}
            </span>
          </div>
        );
      }

      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            {t('settings.claudeAuth.authenticated')}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
        <XCircle className="h-4 w-4 text-red-500" />
        <span className="text-sm font-medium text-red-600 dark:text-red-400">
          {t('settings.claudeAuth.notAuthenticated')}
        </span>
      </div>
    );
  };

  // Render auth details
  const renderAuthDetails = () => {
    if (!authStatus?.is_authenticated) return null;

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="p-4 rounded-xl bg-muted/40 space-y-3"
      >
        {authStatus.auth_method === "oauth" && (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                {authStatus.display_info && (
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Plan:</span>
                    <span className="text-sm font-medium">{authStatus.display_info}</span>
                  </div>
                )}
                {authStatus.subscription_type && !authStatus.display_info && (
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Plan:</span>
                    <span className="text-sm font-medium capitalize">{authStatus.subscription_type}</span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={loggingOut}
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
              >
                {loggingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    {t('settings.claudeAuth.loggingOut')}
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-1" />
                    {t('settings.claudeAuth.logout')}
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('settings.claudeAuth.oauthBilling')}
            </p>
          </>
        )}

        {authStatus.auth_method === "api_key" && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">API Key</span>
                <span className="text-sm text-muted-foreground font-mono">
                  sk-ant-***...****
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteApiKey}
                disabled={deleting}
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-1" />
                    {t('settings.claudeAuth.delete')}
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('settings.claudeAuth.apiKeyBilling')}
            </p>
          </>
        )}
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          {t('settings.claudeAuth.checking')}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10">
            <Key className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{t('settings.claudeAuth.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('settings.claudeAuth.desc')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {renderStatusBadge()}
          <Button
            variant="ghost"
            size="sm"
            onClick={loadAuthStatus}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            {t('settings.claudeAuth.refresh')}
          </Button>
        </div>
      </div>

      {/* Auth Details (if authenticated) */}
      {renderAuthDetails()}

      {/* Web Mode Note */}
      {isWebMode && (
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {t('settings.claudeAuth.webModeNote')}
            </p>
          </div>
        </div>
      )}

      {/* CLI Not Found Warning */}
      {authStatus?.error?.includes("CLI not found") && (
        <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">
              {t('settings.claudeAuth.cliNotFound')}
            </p>
          </div>
        </div>
      )}

      {/* Auth Method Tabs */}
      <div className="flex gap-2 p-1 rounded-lg bg-muted/50">
        <button
          onClick={() => setSelectedMethod("oauth")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
            selectedMethod === "oauth"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <User className="h-4 w-4" />
          {t('settings.claudeAuth.claudeAccount')}
        </button>
        <button
          onClick={() => setSelectedMethod("api-key")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
            selectedMethod === "api-key"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Key className="h-4 w-4" />
          {t('settings.claudeAuth.apiKey')}
        </button>
      </div>

      {/* Method Content */}
      <AnimatePresence mode="wait">
        {selectedMethod === "oauth" ? (
          <motion.div
            key="oauth"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Terminal Login */}
            <div className="p-4 rounded-xl bg-muted/40 space-y-4">
              <div className="flex items-center gap-3">
                <Terminal className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="text-sm font-semibold">{t('settings.claudeAuth.terminalLogin')}</h4>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.claudeAuth.terminalLoginDesc')}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleTerminalLogin}
                disabled={openingTerminal || isWebMode}
                className="w-full gap-2"
              >
                {openingTerminal ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('settings.claudeAuth.openingTerminal')}
                  </>
                ) : (
                  <>
                    <Terminal className="h-4 w-4" />
                    {t('settings.claudeAuth.terminalLogin')}
                  </>
                )}
              </Button>
            </div>

            {/* Login Steps */}
            <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
              <h4 className="text-sm font-semibold">{t('settings.claudeAuth.loginSteps')}</h4>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">1</span>
                  {t('settings.claudeAuth.step1')}
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">2</span>
                  {t('settings.claudeAuth.step2')}
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">3</span>
                  {t('settings.claudeAuth.step3')}
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">4</span>
                  {t('settings.claudeAuth.step4')}
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">5</span>
                  {t('settings.claudeAuth.step5')}
                </li>
              </ol>
            </div>

            {/* Recommendation */}
            <p className="text-xs text-muted-foreground px-1">
              ✨ {t('settings.claudeAuth.recommended')}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="api-key"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* API Key Input */}
            <div className="space-y-3">
              <Label>{t('settings.claudeAuth.apiKey')}</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder={t('settings.claudeAuth.apiKeyPlaceholder')}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="flex-1 font-mono"
                />
                <Button
                  onClick={handleSaveApiKey}
                  disabled={!apiKeyInput.trim() || saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      {t('settings.claudeAuth.saving')}
                    </>
                  ) : (
                    t('settings.claudeAuth.connect')
                  )}
                </Button>
              </div>
            </div>

            {/* Get API Key Link */}
            <p className="text-sm text-muted-foreground">
              {t('settings.claudeAuth.getApiKey')}{' '}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                {t('settings.claudeAuth.getApiKeyLink')}
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>

            {/* Security Info */}
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20 space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  {t('settings.claudeAuth.securityInfo')}
                </h4>
              </div>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 ml-6">
                <li>• {t('settings.claudeAuth.securityNote1')}</li>
                <li>• {t('settings.claudeAuth.securityNote2')}</li>
              </ul>

              {/* Windows Note */}
              {isWindows && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  ⚠️ {t('settings.claudeAuth.windowsNote')}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
