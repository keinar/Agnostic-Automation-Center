import { useState, useCallback, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  X,
  Rocket,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useExecutions } from '../../hooks/useExecutions';
import {
  injectDriverGlowStyle,
  buildEmptyStateTour,
  buildTour,
  buildFeatureTour,
  waitForElement
} from './tourManager';

interface IChecklistItem {
  id: string;
  label: string;
  description: string;
}

const LS_DISMISSED_KEY = 'aac:onboarding-dismissed';
const LS_COMPLETED_KEY = 'aac:onboarding-completed';

const CHECKLIST_ITEMS: IChecklistItem[] = [
  {
    id: 'view-execution',
    label: 'View an Execution',
    description: 'Take a guided tour of the dashboard',
  },
  {
    id: 'platform-tour',
    label: 'Explore Platform Features',
    description: 'Discover Test Cases, Cycles & Team Settings',
  },
  {
    id: 'setup-connectors',
    label: 'Setup Connectors',
    description: 'Integrate with Slack, Jira, and more',
  },
];

export function OnboardingWidget() {
  const navigate = useNavigate();
  const { executions } = useExecutions();

  const [isDismissed, setIsDismissed] = useState(
    () => localStorage.getItem(LS_DISMISSED_KEY) === 'true',
  );
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(LS_COMPLETED_KEY);
      if (raw) return new Set(JSON.parse(raw) as string[]);
    } catch { /* ignore */ }
    return new Set();
  });

  // By using any here, we avoid needing to import and export the driver type across files.
  // The generic implementation handles .drive() and .destroy() successfully.
  const driverRef = useRef<any>(null);

  useEffect(() => {
    const cleanup = injectDriverGlowStyle();
    return cleanup;
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_COMPLETED_KEY, JSON.stringify([...completed]));
  }, [completed]);

  useEffect(() => {
    return () => { driverRef.current?.destroy(); };
  }, []);

  useEffect(() => {
    const handler = () => {
      localStorage.removeItem(LS_DISMISSED_KEY);
      setIsDismissed(false);
      setIsCollapsed(false);
    };
    window.addEventListener('agnox:open-onboarding', handler);
    return () => window.removeEventListener('agnox:open-onboarding', handler);
  }, []);

  const markCompleted = useCallback((id: string) => {
    setCompleted((prev) => new Set([...prev, id]));
  }, []);

  const handleDismiss = useCallback(() => {
    driverRef.current?.destroy();
    setIsDismissed(true);
    localStorage.setItem(LS_DISMISSED_KEY, 'true');
  }, []);

  const handleStartTour = useCallback(async () => {
    // Force reset starting context if user is deep in settings
    if (window.location.pathname !== '/' && window.location.pathname !== '/dashboard') {
      navigate('/dashboard');
    }

    if (executions.length === 0) {
      const el = await waitForElement('[data-testid="sidebar-nav-settings"]');
      if (!el) return;

      const tourDriver = buildEmptyStateTour(markCompleted, navigate);
      driverRef.current = tourDriver;
      tourDriver.drive();
      return;
    }

    // Ensure dashboard renders before driver binds
    const el = await waitForElement('[data-testid="sidebar-desktop"]');
    if (!el) return;

    const tourDriver = buildTour(markCompleted);
    driverRef.current = tourDriver;
    tourDriver.drive();
  }, [executions, markCompleted, navigate]);

  const handleFeatureTour = useCallback(async () => {
    // Force reset starting context if user is deep in settings
    if (window.location.pathname !== '/' && window.location.pathname !== '/dashboard') {
      navigate('/dashboard');
    }

    // Since the first step is Smart Filters, wait for it
    const el = await waitForElement('[data-testid="filter-bar"]');
    if (!el) return;

    const tourDriver = buildFeatureTour(markCompleted, navigate);
    driverRef.current = tourDriver;
    tourDriver.drive();
  }, [markCompleted, navigate]);

  const handleSetupConnectors = useCallback(() => {
    markCompleted('setup-connectors');
    navigate('/settings?tab=integrations&tour=connectors');
  }, [navigate, markCompleted]);

  const handleItemClick = useCallback(
    (id: string) => {
      if (id === 'view-execution') handleStartTour();
      else if (id === 'platform-tour') handleFeatureTour();
      else if (id === 'setup-connectors') handleSetupConnectors();
    },
    [handleStartTour, handleFeatureTour, handleSetupConnectors],
  );

  const completedCount = completed.size;
  const totalCount = CHECKLIST_ITEMS.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);
  const allDone = completedCount === totalCount;

  if (isDismissed) return null;

  return (
    <div
      data-testid="onboarding-widget"
      className="fixed bottom-6 right-6 z-50 w-72 rounded-2xl shadow-2xl border border-slate-200 dark:border-gh-border-dark bg-white dark:bg-gh-bg-dark overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white">
        <Rocket size={16} className="flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">Getting Started</p>
          <p className="text-[11px] text-blue-100 mt-0.5">
            {allDone ? 'All set! 🎉' : `${completedCount} of ${totalCount} complete`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsCollapsed((v) => !v)}
            aria-label={isCollapsed ? 'Expand checklist' : 'Collapse checklist'}
            className="p-1 rounded-md hover:bg-white/20 transition-colors cursor-pointer"
          >
            {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss onboarding"
            className="p-1 rounded-md hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Progress bar ── */}
      {!isCollapsed && (
        <div className="h-1 bg-slate-100 dark:bg-gh-bg-subtle-dark">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* ── Checklist ── */}
      {!isCollapsed && (
        <ul className="divide-y divide-slate-100 dark:divide-gh-border-dark">
          {CHECKLIST_ITEMS.map((item) => {
            const isDone = completed.has(item.id);
            const showExternalIcon = item.id === 'setup-connectors';
            return (
              <li key={item.id}>
                <button
                  type="button"
                  data-testid={`onboarding-item-${item.id}`}
                  onClick={() => handleItemClick(item.id)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-gh-bg-subtle-dark transition-colors group cursor-pointer"
                >
                  <ChecklistIcon done={isDone} />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium leading-tight ${isDone
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-700 dark:text-gh-text-dark group-hover:text-blue-600 dark:group-hover:text-blue-400'
                        }`}
                    >
                      {item.label}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">
                      {item.description}
                    </p>
                  </div>
                  {showExternalIcon ? (
                    <ExternalLink
                      size={12}
                      className="text-slate-300 dark:text-slate-600 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-0.5"
                    />
                  ) : (
                    <span className={`text-[10px] font-semibold uppercase tracking-wide flex-shrink-0 pt-0.5 ${isDone
                      ? 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                      : 'text-blue-600 dark:text-blue-400'
                      }`}>
                      {isDone ? 'Replay' : 'Start'}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* ── All-done footer ── */}
      {!isCollapsed && allDone && (
        <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 border-t border-emerald-100 dark:border-emerald-900/50">
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium text-center">
            You're all set! Dismiss whenever you're ready.
          </p>
        </div>
      )}
    </div>
  );
}

// ── ChecklistIcon helper ───────────────────────────────────────────────────────

function ChecklistIcon({ done }: { done: boolean }) {
  return done ? (
    <CheckCircle2
      size={18}
      className="flex-shrink-0 mt-0.5 text-emerald-500 dark:text-emerald-400"
    />
  ) : (
    <Circle
      size={18}
      className="flex-shrink-0 mt-0.5 text-slate-300 dark:text-slate-600"
    />
  );
}
