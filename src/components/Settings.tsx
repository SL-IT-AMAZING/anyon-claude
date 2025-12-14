import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  AlertCircle,
  Shield,
  User,
  Mail,
  Crown,
  LogOut,
  Sparkles,
  Moon,
  Sun,
  Languages,
  Palette,
  FolderOpen,
  Bot,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Terminal,
  FileText,
  Edit3,
  HelpCircle,
  Settings2,
  Wifi,
  Database,
  Zap,
  Clock,
  MessageSquare,
  GitBranch,
  Loader2,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  api,
  type ClaudeSettings,
  type ClaudeInstallation
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { Toast, ToastContainer } from "@/components/ui/toast";
import { ClaudeVersionSelector } from "./ClaudeVersionSelector";
import { HooksEditor } from "./HooksEditor";
import { ProxySettings } from "./ProxySettings";
import { CCAgents } from "./CCAgents";
import { useTheme, useTrackEvent, useTranslation } from "@/hooks";
import { analytics } from "@/lib/analytics";
import { TabPersistenceService } from "@/services/tabPersistence";
import { useAuthStore } from "@/stores/authStore";

interface SettingsProps {
  className?: string;
  onBack?: () => void;
}

interface PermissionRule {
  id: string;
  value: string;
}

interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
}

type SettingsSection =
  | "appearance"
  | "privacy"
  | "ai-version"
  | "ai-behavior"
  | "ai-permissions"
  | "ai-env"
  | "ai-hooks"
  | "ai-proxy"
  | "ai-advanced"
  | "ai-agents"
  | "account"
  | "subscription";

interface NavItem {
  id: SettingsSection;
  label: string;
  icon: React.ElementType;
  category: "general" | "ai" | "account";
}

export const Settings: React.FC<SettingsProps> = ({
  className,
}) => {
  const [settings, setSettings] = useState<ClaudeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSection>("appearance");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Claude binary path
  const [currentBinaryPath, setCurrentBinaryPath] = useState<string | null>(null);
  const [selectedInstallation, setSelectedInstallation] = useState<ClaudeInstallation | null>(null);
  const [binaryPathChanged, setBinaryPathChanged] = useState(false);

  // Permission rules
  const [allowRules, setAllowRules] = useState<PermissionRule[]>([]);
  const [denyRules, setDenyRules] = useState<PermissionRule[]>([]);

  // Environment variables
  const [envVars, setEnvVars] = useState<EnvironmentVariable[]>([]);

  // Hooks state
  const [userHooksChanged, setUserHooksChanged] = useState(false);
  const getUserHooks = React.useRef<(() => any) | null>(null);

  // Proxy state
  const [proxySettingsChanged, setProxySettingsChanged] = useState(false);
  const saveProxySettings = React.useRef<(() => Promise<void>) | null>(null);

  // Theme hook
  const { theme, toggleTheme } = useTheme();

  // Translation hook
  const { t, language, setLanguage } = useTranslation();

  // Analytics state
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const trackEvent = useTrackEvent();

  // Tab persistence state
  const [tabPersistenceEnabled, setTabPersistenceEnabled] = useState(true);

  // Startup intro preference
  const [startupIntroEnabled, setStartupIntroEnabled] = useState(true);

  // Auth store
  const { user, logout, getUserSettings, saveUserSettings, updateUserSetting } = useAuthStore();

  // Navigation items
  const navItems: NavItem[] = [
    { id: "appearance", label: t('settings.simple.appearance'), icon: Palette, category: "general" },
    { id: "privacy", label: t('settings.simple.privacy'), icon: Shield, category: "general" },
    { id: "ai-version", label: t('settings.ai.version'), icon: Bot, category: "ai" },
    { id: "ai-behavior", label: t('settings.ai.behavior'), icon: MessageSquare, category: "ai" },
    { id: "ai-permissions", label: t('settings.ai.permissions'), icon: Shield, category: "ai" },
    { id: "ai-env", label: t('settings.ai.envVars'), icon: Settings2, category: "ai" },
    { id: "ai-hooks", label: t('settings.ai.hooks'), icon: Zap, category: "ai" },
    { id: "ai-proxy", label: t('settings.ai.proxy'), icon: Wifi, category: "ai" },
    { id: "ai-advanced", label: t('settings.ai.advanced'), icon: Database, category: "ai" },
    { id: "ai-agents", label: "CC Agents", icon: Cpu, category: "ai" },
    { id: "account", label: t('settings.account.title'), icon: User, category: "account" },
    { id: "subscription", label: t('settings.account.subscription'), icon: Crown, category: "account" },
  ];

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      // Load Claude binary path
      try {
        const path = await api.getClaudeBinaryPath();
        setCurrentBinaryPath(path);
      } catch (err) {
        console.error("Failed to load Claude binary path:", err);
      }

      // Load analytics settings
      const analyticsSettings = analytics.getSettings();
      if (analyticsSettings) {
        setAnalyticsEnabled(analyticsSettings.enabled);
      }

      // Load tab persistence setting
      setTabPersistenceEnabled(TabPersistenceService.isEnabled());

      // Load startup intro setting
      const startupPref = await api.getSetting('startup_intro_enabled');
      setStartupIntroEnabled(startupPref === null ? true : startupPref === 'true');

      // Try to load from server
      try {
        const userSettings = await getUserSettings();
        if (userSettings && typeof userSettings === 'object') {
          setSettings(userSettings);

          // Parse permissions
          if (userSettings.permissions && typeof userSettings.permissions === 'object') {
            if (Array.isArray(userSettings.permissions.allow)) {
              setAllowRules(
                userSettings.permissions.allow.map((rule: string, index: number) => ({
                  id: `allow-${index}`,
                  value: rule,
                }))
              );
            }
            if (Array.isArray(userSettings.permissions.deny)) {
              setDenyRules(
                userSettings.permissions.deny.map((rule: string, index: number) => ({
                  id: `deny-${index}`,
                  value: rule,
                }))
              );
            }
          }

          // Parse environment variables
          if (userSettings.env && typeof userSettings.env === 'object' && !Array.isArray(userSettings.env)) {
            setEnvVars(
              Object.entries(userSettings.env).map(([key, value], index) => ({
                id: `env-${index}`,
                key,
                value: value as string,
              }))
            );
          }

          if (userSettings.startup_intro_enabled !== undefined) {
            setStartupIntroEnabled(userSettings.startup_intro_enabled === true);
          }
          if (userSettings.analytics_enabled !== undefined) {
            setAnalyticsEnabled(userSettings.analytics_enabled === true);
          }
          if (userSettings.tab_persistence_enabled !== undefined) {
            setTabPersistenceEnabled(userSettings.tab_persistence_enabled === true);
            TabPersistenceService.setEnabled(userSettings.tab_persistence_enabled === true);
          }
        }
      } catch (serverError) {
        console.warn('Failed to load from server, trying local:', serverError);

        // Fallback to local settings
        const loadedSettings = await api.getClaudeSettings();
        if (loadedSettings && typeof loadedSettings === 'object') {
          setSettings(loadedSettings);

          if (loadedSettings.permissions && typeof loadedSettings.permissions === 'object') {
            if (Array.isArray(loadedSettings.permissions.allow)) {
              setAllowRules(
                loadedSettings.permissions.allow.map((rule: string, index: number) => ({
                  id: `allow-${index}`,
                  value: rule,
                }))
              );
            }
            if (Array.isArray(loadedSettings.permissions.deny)) {
              setDenyRules(
                loadedSettings.permissions.deny.map((rule: string, index: number) => ({
                  id: `deny-${index}`,
                  value: rule,
                }))
              );
            }
          }

          if (loadedSettings.env && typeof loadedSettings.env === 'object' && !Array.isArray(loadedSettings.env)) {
            setEnvVars(
              Object.entries(loadedSettings.env).map(([key, value], index) => ({
                id: `env-${index}`,
                key,
                value: value as string,
              }))
            );
          }
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      const updatedSettings: ClaudeSettings = {
        ...settings,
        permissions: {
          allow: allowRules.map(rule => rule.value).filter(v => v && String(v).trim()),
          deny: denyRules.map(rule => rule.value).filter(v => v && String(v).trim()),
        },
        env: envVars.reduce((acc, { key, value }) => {
          if (key && String(key).trim() && value && String(value).trim()) {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>),
        analytics_enabled: analyticsEnabled,
        tab_persistence_enabled: tabPersistenceEnabled,
        startup_intro_enabled: startupIntroEnabled,
      };

      try {
        await saveUserSettings(updatedSettings);
      } catch (serverError) {
        await api.saveClaudeSettings(updatedSettings);
      }

      setSettings(updatedSettings);

      if (binaryPathChanged && selectedInstallation) {
        await api.setClaudeBinaryPath(selectedInstallation.path);
        setCurrentBinaryPath(selectedInstallation.path);
        setBinaryPathChanged(false);
      }

      // Save user hooks if changed
      if (userHooksChanged && getUserHooks.current) {
        const hooks = getUserHooks.current();
        await api.updateHooksConfig('user', hooks);
        setUserHooksChanged(false);
      }

      // Save proxy settings if changed
      if (proxySettingsChanged && saveProxySettings.current) {
        await saveProxySettings.current();
        setProxySettingsChanged(false);
      }

      setToast({ message: t('settings.saved'), type: "success" });
    } catch (err) {
      console.error("Failed to save settings:", err);
      setToast({ message: t('settings.saveFailed'), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const addPermissionRule = (type: "allow" | "deny") => {
    const newRule: PermissionRule = {
      id: `${type}-${Date.now()}`,
      value: "",
    };
    if (type === "allow") {
      setAllowRules(prev => [...prev, newRule]);
    } else {
      setDenyRules(prev => [...prev, newRule]);
    }
  };

  const updatePermissionRule = (type: "allow" | "deny", id: string, value: string) => {
    if (type === "allow") {
      setAllowRules(prev => prev.map(rule => rule.id === id ? { ...rule, value } : rule));
    } else {
      setDenyRules(prev => prev.map(rule => rule.id === id ? { ...rule, value } : rule));
    }
  };

  const removePermissionRule = (type: "allow" | "deny", id: string) => {
    if (type === "allow") {
      setAllowRules(prev => prev.filter(rule => rule.id !== id));
    } else {
      setDenyRules(prev => prev.filter(rule => rule.id !== id));
    }
  };

  const addEnvVar = () => {
    const newVar: EnvironmentVariable = {
      id: `env-${Date.now()}`,
      key: "",
      value: "",
    };
    setEnvVars(prev => [...prev, newVar]);
  };

  const updateEnvVar = (id: string, field: "key" | "value", value: string) => {
    setEnvVars(prev => prev.map(envVar =>
      envVar.id === id ? { ...envVar, [field]: value } : envVar
    ));
  };

  const removeEnvVar = (id: string) => {
    setEnvVars(prev => prev.filter(envVar => envVar.id !== id));
  };

  const handleClaudeInstallationSelect = (installation: ClaudeInstallation) => {
    setSelectedInstallation(installation);
    setBinaryPathChanged(installation.path !== currentBinaryPath);
  };

  // Render section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case "appearance":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t('settings.simple.appearance')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.simple.appearanceDesc')}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Language Selector */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-3">
                  <Languages className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="text-base font-medium">{t('settings.simple.language')}</Label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t('settings.simple.languageDesc')}
                    </p>
                  </div>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'en' | 'ko')}
                  className="h-10 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                >
                  <option value="en">{t('language.en')}</option>
                  <option value="ko">{t('language.ko')}</option>
                </select>
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Sun className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <Label className="text-base font-medium">{t('settings.simple.theme')}</Label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {theme === 'dark' ? t('settings.simple.themeDark') : t('settings.simple.themeLight')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                />
              </div>

              {/* Startup Animation */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="text-base font-medium">{t('settings.simple.welcomeAnimation')}</Label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t('settings.simple.welcomeAnimationDesc')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={startupIntroEnabled}
                  onCheckedChange={async (checked) => {
                    setStartupIntroEnabled(checked);
                    try {
                      await updateUserSetting('startup_intro_enabled', checked);
                      await api.saveSetting('startup_intro_enabled', checked ? 'true' : 'false');
                      trackEvent.settingsChanged('startup_intro_enabled', checked);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                />
              </div>

              {/* Tab Persistence */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="text-base font-medium">{t('settings.simple.rememberTabs')}</Label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t('settings.simple.rememberTabsDesc')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={tabPersistenceEnabled}
                  onCheckedChange={async (checked) => {
                    TabPersistenceService.setEnabled(checked);
                    setTabPersistenceEnabled(checked);
                    try {
                      await updateUserSetting('tab_persistence_enabled', checked);
                      trackEvent.settingsChanged('tab_persistence_enabled', checked);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        );

      case "privacy":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-green-500/10">
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t('settings.simple.privacy')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.simple.privacyDesc')}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Analytics Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="text-base font-medium">{t('settings.simple.helpImprove')}</Label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t('settings.simple.helpImproveDesc')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={analyticsEnabled}
                  onCheckedChange={async (checked) => {
                    try {
                      if (checked) {
                        await analytics.enable();
                        setAnalyticsEnabled(true);
                        await updateUserSetting('analytics_enabled', true);
                        trackEvent.settingsChanged('analytics_enabled', true);
                      } else {
                        await analytics.disable();
                        setAnalyticsEnabled(false);
                        await updateUserSetting('analytics_enabled', false);
                        trackEvent.settingsChanged('analytics_enabled', false);
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                />
              </div>

              {/* Privacy Note */}
              <AnimatePresence>
                {analyticsEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/20 p-4"
                  >
                    <div className="flex gap-3">
                      <Shield className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">{t('settings.simple.privacyProtected')}</p>
                        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                          <li>✓ {t('settings.simple.privacyPoint1')}</li>
                          <li>✓ {t('settings.simple.privacyPoint2')}</li>
                          <li>✓ {t('settings.simple.privacyPoint3')}</li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat History Retention */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="text-base font-medium">{t('settings.ai.chatRetention')}</Label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t('settings.ai.chatRetentionDesc')}
                    </p>
                  </div>
                </div>
                <Input
                  type="number"
                  min="1"
                  placeholder="30"
                  value={settings?.cleanupPeriodDays || ""}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : undefined;
                    updateSetting("cleanupPeriodDays", value);
                  }}
                  className="w-20 text-center"
                />
              </div>
            </div>
          </div>
        );

      case "ai-version":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-violet-500/10">
                <Bot className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t('settings.ai.version')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.ai.versionDesc')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <ClaudeVersionSelector
                selectedPath={currentBinaryPath}
                onSelect={handleClaudeInstallationSelect}
                simplified={true}
              />
              {binaryPathChanged && (
                <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {t('settings.ai.versionChanged')}
                </p>
              )}
            </div>

            {/* Info Card */}
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20">
              <div className="flex gap-3">
                <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">{t('settings.ai.infoTitle')}</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {t('settings.ai.infoDesc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "ai-behavior":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-blue-500/10">
                <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t('settings.ai.behavior')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.ai.behaviorDesc')}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Include Co-authored By */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-3">
                  <GitBranch className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="text-base font-medium">{t('settings.ai.coauthored')}</Label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t('settings.ai.coauthoredDesc')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings?.includeCoAuthoredBy !== false}
                  onCheckedChange={(checked) => updateSetting("includeCoAuthoredBy", checked)}
                />
              </div>

              {/* Verbose Output */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-3">
                  <Terminal className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="text-base font-medium">{t('settings.ai.verbose')}</Label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t('settings.ai.verboseDesc')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings?.verbose === true}
                  onCheckedChange={(checked) => updateSetting("verbose", checked)}
                />
              </div>
            </div>
          </div>
        );

      case "ai-permissions":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-emerald-500/10">
                <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t('settings.ai.permissions')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.ai.permissionsDesc')}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Allow Rules */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <Label className="text-base font-medium text-green-600 dark:text-green-400">
                      {t('settings.ai.allowRules')}
                    </Label>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addPermissionRule("allow")}
                    className="gap-2"
                  >
                    <Plus className="h-3 w-3" />
                    {t('settings.ai.addRule')}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('settings.ai.allowRulesDesc')}
                </p>
                <div className="space-y-2">
                  {allowRules.length === 0 ? (
                    <div className="p-4 rounded-xl bg-muted/40 text-center">
                      <p className="text-sm text-muted-foreground">
                        {t('settings.ai.noAllowRules')}
                      </p>
                    </div>
                  ) : (
                    allowRules.map((rule) => (
                      <div key={rule.id} className="flex items-center gap-2">
                        <Input
                          placeholder={t('settings.ai.allowPlaceholder')}
                          value={rule.value}
                          onChange={(e) => updatePermissionRule("allow", rule.id, e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePermissionRule("allow", rule.id)}
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Deny Rules */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <Label className="text-base font-medium text-red-600 dark:text-red-400">
                      {t('settings.ai.denyRules')}
                    </Label>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addPermissionRule("deny")}
                    className="gap-2"
                  >
                    <Plus className="h-3 w-3" />
                    {t('settings.ai.addRule')}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('settings.ai.denyRulesDesc')}
                </p>
                <div className="space-y-2">
                  {denyRules.length === 0 ? (
                    <div className="p-4 rounded-xl bg-muted/40 text-center">
                      <p className="text-sm text-muted-foreground">
                        {t('settings.ai.noDenyRules')}
                      </p>
                    </div>
                  ) : (
                    denyRules.map((rule) => (
                      <div key={rule.id} className="flex items-center gap-2">
                        <Input
                          placeholder={t('settings.ai.denyPlaceholder')}
                          value={rule.value}
                          onChange={(e) => updatePermissionRule("deny", rule.id, e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePermissionRule("deny", rule.id)}
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Examples */}
              <div className="p-4 rounded-xl bg-muted/40 space-y-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{t('settings.ai.examples')}</p>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Terminal className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <code className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs">Bash(npm run *)</code>
                      <span className="text-muted-foreground ml-2">{t('settings.ai.exampleNpm')}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <code className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs">Read(docs/*)</code>
                      <span className="text-muted-foreground ml-2">{t('settings.ai.exampleRead')}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Edit3 className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <code className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs">Edit(src/*)</code>
                      <span className="text-muted-foreground ml-2">{t('settings.ai.exampleEdit')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "ai-env":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-orange-500/10">
                <Settings2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t('settings.ai.envVars')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.ai.envVarsDesc')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addEnvVar}
                  className="gap-2"
                >
                  <Plus className="h-3 w-3" />
                  {t('settings.ai.addEnvVar')}
                </Button>
              </div>

              <div className="space-y-2">
                {envVars.length === 0 ? (
                  <div className="p-4 rounded-xl bg-muted/40 text-center">
                    <p className="text-sm text-muted-foreground">
                      {t('settings.ai.noEnvVars')}
                    </p>
                  </div>
                ) : (
                  envVars.map((envVar) => (
                    <div key={envVar.id} className="flex items-center gap-2">
                      <Input
                        placeholder={t('settings.ai.envKeyPlaceholder')}
                        value={envVar.key}
                        onChange={(e) => updateEnvVar(envVar.id, "key", e.target.value)}
                        className="flex-1 font-mono text-sm"
                      />
                      <span className="text-muted-foreground">=</span>
                      <Input
                        placeholder={t('settings.ai.envValuePlaceholder')}
                        value={envVar.value}
                        onChange={(e) => updateEnvVar(envVar.id, "value", e.target.value)}
                        className="flex-1 font-mono text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEnvVar(envVar.id)}
                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* Common Variables Examples */}
              <div className="p-4 rounded-xl bg-muted/40 space-y-2">
                <p className="text-sm font-medium">{t('settings.ai.commonEnvVars')}</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><code className="px-1 py-0.5 rounded bg-primary/10 text-primary text-xs">ANTHROPIC_MODEL</code> - {t('settings.ai.envModelDesc')}</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case "ai-hooks":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-yellow-500/10">
                <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t('settings.ai.hooks')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.ai.hooksDesc')}</p>
              </div>
            </div>

            <HooksEditor
              scope="user"
              className="border-0"
              hideActions={true}
              onChange={(hasChanges, getHooks) => {
                setUserHooksChanged(hasChanges);
                getUserHooks.current = getHooks;
              }}
            />
          </div>
        );

      case "ai-proxy":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-cyan-500/10">
                <Wifi className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t('settings.ai.proxy')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.ai.proxyDesc')}</p>
              </div>
            </div>

            <ProxySettings
              setToast={setToast}
              onChange={(hasChanges, _getSettings, save) => {
                setProxySettingsChanged(hasChanges);
                saveProxySettings.current = save;
              }}
            />
          </div>
        );

      case "ai-advanced":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-slate-500/10">
                <Database className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t('settings.ai.advanced')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.ai.advancedDesc')}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* API Key Helper */}
              <div className="space-y-2">
                <Label>{t('settings.ai.apiKeyHelper')}</Label>
                <Input
                  placeholder="/path/to/script.sh"
                  value={settings?.apiKeyHelper || ""}
                  onChange={(e) => updateSetting("apiKeyHelper", e.target.value || undefined)}
                />
                <p className="text-xs text-muted-foreground">
                  {t('settings.ai.apiKeyHelperDesc')}
                </p>
              </div>

              {/* Raw JSON Preview */}
              <div className="space-y-2">
                <Label>{t('settings.ai.rawJson')}</Label>
                <div className="p-3 rounded-lg bg-muted font-mono text-xs overflow-x-auto max-h-48 overflow-y-auto">
                  <pre>{JSON.stringify(settings, null, 2)}</pre>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('settings.ai.rawJsonDesc')}
                </p>
              </div>
            </div>
          </div>
        );

      case "ai-agents":
        return (
          <CCAgents
            onBack={() => setActiveSection("ai-version")}
            className="h-full -m-6"
          />
        );

      case "account":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t('settings.account.title')}</h3>
              </div>
            </div>

            {user && (
              <div className="flex items-start gap-4 p-4 bg-muted/40 rounded-xl">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border border-border">
                  <User size={28} className="text-primary" />
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('settings.account.name')}</p>
                      <p className="text-sm font-medium">{user.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('settings.account.email')}</p>
                      <p className="text-sm font-medium">{user.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Logout */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-red-500/10">
                    <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">{t('settings.account.logout')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.account.logoutDescription')}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={logout}
                  variant="destructive"
                  size="default"
                  className="flex items-center gap-2"
                >
                  <LogOut size={16} />
                  {t('settings.account.logout')}
                </Button>
              </div>
            </div>
          </div>
        );

      case "subscription":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-yellow-500/10">
                <Crown className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t('settings.account.subscription')}</h3>
              </div>
            </div>

            <div className="p-4 bg-muted/40 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown size={18} className="text-yellow-500" />
                  <span className="font-medium">{t('settings.account.currentPlan')}</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-muted border border-border">
                  <span className="text-sm font-medium">{t('settings.account.comingSoon')}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  {t('settings.account.proDescription')}
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("h-full overflow-y-auto", className)}>
      {/* Centered Container */}
      <div className="max-w-5xl mx-auto h-full flex">
        {/* Left Navigation */}
        <div className="w-56 flex-shrink-0 border-r bg-muted/20 flex flex-col">
          {/* Header */}
          <div className="p-5 border-b">
            <h1 className="text-lg font-bold">{t('settings.title')}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('settings.subtitle')}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-5">
            {/* General Section */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                {t('settings.tab.general')}
              </p>
              <div className="space-y-0.5">
                {navItems.filter(item => item.category === "general").map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors",
                      activeSection === item.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Section */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                {t('settings.tab.ai')}
              </p>
              <div className="space-y-0.5">
                {navItems.filter(item => item.category === "ai").map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors",
                      activeSection === item.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Section */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                {t('settings.tab.account')}
              </p>
              <div className="space-y-0.5">
                {navItems.filter(item => item.category === "account").map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors",
                      activeSection === item.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          {/* Save Button */}
          <div className="p-3 border-t">
            <Button
              onClick={saveSettings}
              disabled={saving || loading}
              className="w-full"
              size="sm"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('settings.saving')}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t('settings.save')}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="p-6">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
              >
                {renderSectionContent()}
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      <ToastContainer>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast(null)}
          />
        )}
      </ToastContainer>
    </div>
  );
};
