import { useState, useCallback, useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  X,
  Rocket,
  ExternalLink,
} from 'lucide-react';
import { useNavigate, NavigateFunction } from 'react-router-dom';
import { useExecutions } from '../../hooks/useExecutions';

// ── Types ─────────────────────────────────────────────────────────────────────

interface IChecklistItem {
  id: string;
  label: string;
  description: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LS_DISMISSED_KEY = 'aac:onboarding-dismissed';
const LS_COMPLETED_KEY = 'aac:onboarding-completed';
const DRIVER_STYLE_ID  = 'agnox-driver-pulse-style';

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

// ── Shared driver.js base configuration ───────────────────────────────────────
//
// Common visual settings used by every tour in this file. Spread this into the
// driver() call and add tour-specific overrides (showProgress, button text, etc.)

const DRIVER_BASE_CONFIG = {
  animate: true,
  overlayColor: 'rgba(15, 23, 42, 0.7)',
  stagePadding: 8,
  stageRadius: 8,
  popoverClass: 'agnox-tour-popover',
  allowClose: false,
} as const;

// ── Global driver.js visual cue ───────────────────────────────────────────────
//
// Injected once per page lifecycle. Adds a glowing pulse ring to the element
// currently highlighted by driver.js so users clearly see what to interact with.

function injectDriverGlowStyle(): () => void {
  if (document.getElementById(DRIVER_STYLE_ID)) return () => {};

  const style = document.createElement('style');
  style.id = DRIVER_STYLE_ID;
  style.textContent = `
    @keyframes agnox-driver-glow {
      0%, 100% {
        box-shadow:
          0 0 0 3px rgba(59, 130, 246, 0.55),
          0 0 18px rgba(59, 130, 246, 0.28);
      }
      50% {
        box-shadow:
          0 0 0 6px rgba(99, 102, 241, 0.65),
          0 0 30px rgba(99, 102, 241, 0.4);
      }
    }
    .driver-active-element {
      animation: agnox-driver-glow 1.8s ease-in-out infinite !important;
      border-radius: 6px;
    }
  `;
  document.head.appendChild(style);

  return () => {
    document.getElementById(DRIVER_STYLE_ID)?.remove();
  };
}

// ── Dashboard tour (requires existing executions) ─────────────────────────────

function buildTour(onStepComplete: (id: string) => void): ReturnType<typeof driver> {
  let tableRowObserver: MutationObserver | null = null;

  const cleanupObserver = () => {
    tableRowObserver?.disconnect();
    tableRowObserver = null;
  };

  let tourDriver: ReturnType<typeof driver>;

  tourDriver = driver({
    ...DRIVER_BASE_CONFIG,
    showProgress: true,
    nextBtnText: 'Next →',
    prevBtnText: '← Back',
    doneBtnText: 'Done',

    onDestroyStarted: () => {
      cleanupObserver();
      onStepComplete('view-execution');
      tourDriver.destroy();
    },

    steps: [
      {
        element: '[data-testid="sidebar-desktop"]',
        popover: {
          title: 'Navigation Sidebar',
          description:
            'This is your command center. Switch between Dashboard, Test Cases, Test Cycles, and Settings from here. Collapse it to gain more screen space.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-testid="filter-bar"]',
        popover: {
          title: 'Smart Filters',
          description:
            'Slice your executions by status, environment, date range, or group. Combine filters for pinpoint precision — no more scrolling through hundreds of runs.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-testid="executions-table"]',
        popover: {
          title: 'Executions Table',
          description:
            'Every test run appears here in real-time. <strong>Click any row to continue the tour</strong> — the detail drawer will open with logs, AI triage, and artifact links.',
          side: 'top',
          align: 'start',
          showButtons: ['previous', 'close'],
        },
        onHighlightStarted: () => {
          cleanupObserver();

          if (document.querySelector('[data-testid="execution-drawer-tab-bar"]')) {
            tourDriver.moveNext();
            return;
          }

          tableRowObserver = new MutationObserver(() => {
            if (document.querySelector('[data-testid="execution-drawer-tab-bar"]')) {
              cleanupObserver();
              tourDriver.moveNext();
            }
          });
          tableRowObserver.observe(document.body, { childList: true, subtree: true });
        },
        onDeselected: () => {
          cleanupObserver();
        },
      },
      {
        element: '[data-testid="execution-drawer-tab-bar"]',
        popover: {
          title: 'Execution Detail Tabs',
          description:
            'Once you open an execution, explore tabs for live Logs, AI-powered Triage analysis, and downloadable Artifacts — all in one panel.',
          side: 'left',
          align: 'start',
        },
      },
    ],
  });

  return tourDriver;
}

// ── Zero-to-One empty state tour ──────────────────────────────────────────────
//
// Launched when executions.length === 0. Walks the user through the full
// first-run flow:
//   1.  Navigate to Settings
//   2.  Open Run Settings tab
//   3.  Configure Docker Image
//   4.  Configure Environment URLs
//   5.  Save Settings (auto-advances once user saves and lands back on /dashboard)
//   6.  Trigger a run via the Run button (modal opens)
//   7.  Modal: Target URL override
//   8.  Modal: Scheduled Runs tab
//   9.  Confirm & Launch
//   10. Observe live execution status in the table
//   11. Open the Execution Drawer to explore Logs, AI Triage, and Reports
//
// Cross-page navigation uses setInterval URL polling; DOM readiness uses
// MutationObserver. ALL observers and intervals are cleaned up via cleanupAll()
// on every onDeselected and onDestroyStarted handler to prevent leaks.

function buildEmptyStateTour(onStepComplete: (id: string) => void, navigate: NavigateFunction): ReturnType<typeof driver> {
  let activeObserver: MutationObserver | null = null;
  let urlPollInterval: ReturnType<typeof setInterval> | null = null;
  let saveBtn: HTMLElement | null = null;
  let saveBtnListener: (() => void) | null = null;

  const cleanupAll = () => {
    activeObserver?.disconnect();
    activeObserver = null;
    if (urlPollInterval !== null) {
      clearInterval(urlPollInterval);
      urlPollInterval = null;
    }
    if (saveBtnListener && saveBtn) {
      saveBtn.removeEventListener('click', saveBtnListener);
      saveBtnListener = null;
      saveBtn = null;
    }
  };

  let emptyTourDriver: ReturnType<typeof driver>;

  emptyTourDriver = driver({
    ...DRIVER_BASE_CONFIG,
    showProgress: true,
    nextBtnText: 'Next →',
    prevBtnText: '← Back',
    doneBtnText: 'Done',

    onDestroyStarted: () => {
      cleanupAll();
      onStepComplete('view-execution');
      emptyTourDriver.destroy();
    },

    steps: [
      // ── Step 1 ───────────────────────────────────────────────────────────
      // Highlight the sidebar Settings nav link.
      // Auto-advances once the URL changes to /settings (user clicked the link).
      {
        element: '[data-testid="sidebar-nav-settings"]',
        popover: {
          title: "🚀 Let's run your first test!",
          description:
            'First, we need to tell Agnox which Docker image to execute. Click <strong>Settings</strong> in the sidebar to get started.',
          side: 'right',
          align: 'center',
          showButtons: ['close'],
        },
        onHighlightStarted: () => {
          cleanupAll();

          // Already on /settings — skip straight to step 2.
          if (window.location.pathname.startsWith('/settings')) {
            emptyTourDriver.moveNext();
            return;
          }

          // Poll for the React Router navigation to /settings.
          urlPollInterval = setInterval(() => {
            if (window.location.pathname.startsWith('/settings')) {
              cleanupAll();
              emptyTourDriver.moveNext();
            }
          }, 150);
        },
        onDeselected: () => cleanupAll(),
      },

      // ── Step 2 ───────────────────────────────────────────────────────────
      // Highlight the Run Settings sidebar tab.
      // Auto-advances once the RunSettingsTab form mounts (Docker Image input appears).
      {
        element: '[data-testid="sidebar-settings-tab-run-settings"]',
        popover: {
          title: 'Run Settings',
          description:
            'Click the <strong>Run Settings</strong> tab. This is where you configure the Docker image and environment URLs that Agnox uses every time you trigger a test.',
          side: 'right',
          align: 'center',
          showButtons: ['close'],
        },
        onHighlightStarted: () => {
          cleanupAll();

          // Form already mounted (user navigated directly to Run Settings).
          if (document.querySelector('[data-testid="run-settings-docker-image"]')) {
            emptyTourDriver.moveNext();
            return;
          }

          // Watch for the Run Settings form to mount after the tab click.
          activeObserver = new MutationObserver(() => {
            if (document.querySelector('[data-testid="run-settings-docker-image"]')) {
              cleanupAll();
              emptyTourDriver.moveNext();
            }
          });
          activeObserver.observe(document.body, { childList: true, subtree: true });
        },
        onDeselected: () => cleanupAll(),
      },

      // ── Step 3 ───────────────────────────────────────────────────────────
      // Highlight the Docker Image input. Standard Next/Back step.
      // onDeselected ensures any lingering interval from step 5 back-navigation
      // is cancelled if the user reaches this step from the forward direction.
      {
        element: '[data-testid="run-settings-docker-image"]',
        popover: {
          title: 'Your Docker Image',
          description:
            'Enter the full Docker Hub image name for your test suite — for example, <code>myorg/playwright-tests:latest</code>. Agnox pulls this image and runs it in a secure, isolated container. No Git URL needed.',
          side: 'bottom',
          align: 'start',
        },
        onDeselected: () => cleanupAll(),
      },

      // ── Step 4 ───────────────────────────────────────────────────────────
      // Highlight the DEV URL input. Standard Next/Back step.
      {
        element: '[data-testid="run-settings-dev-url"]',
        popover: {
          title: 'Target Environment URLs',
          description:
            'Set the base URL for each environment (Dev, Staging, Prod). Agnox injects the selected URL as <code>BASE_URL</code> into your container at runtime — no hardcoded URLs in your tests required.',
          side: 'bottom',
          align: 'start',
        },
        onDeselected: () => cleanupAll(),
      },

      // ── Step 5 ───────────────────────────────────────────────────────────
      // Highlight the Save Settings button.
      // The app does NOT auto-redirect after saving, so we attach a one-time
      // click listener to the Save button that forces the navigation to
      // /dashboard after an 800 ms delay (giving the API call time to settle).
      // The setInterval below then detects the URL change and calls moveNext().
      {
        element: '[data-testid="run-settings-submit"]',
        popover: {
          title: 'Save & Head Back',
          description:
            'Hit <strong>Save Settings</strong> to lock in your configuration. The tour will automatically continue on the Dashboard once your settings are saved.',
          side: 'top',
          align: 'start',
          showButtons: ['previous', 'close'],
        },
        onHighlightStarted: () => {
          cleanupAll();

          // Attach a temporary redirect listener so saving settings brings the
          // user back to /dashboard. Removed in onDeselected via cleanupAll().
          saveBtn = document.querySelector<HTMLElement>('[data-testid="run-settings-submit"]');
          if (saveBtn) {
            saveBtnListener = () => {
              setTimeout(() => {
                navigate('/dashboard');
              }, 800);
            };
            saveBtn.addEventListener('click', saveBtnListener);
          }

          // Poll: advance once the browser lands on the dashboard.
          // Use startsWith to handle trailing-slash variants and sub-paths.
          urlPollInterval = setInterval(() => {
            const p = window.location.pathname;
            if (p.startsWith('/dashboard') || p === '/') {
              cleanupAll();
              emptyTourDriver.moveNext();
            }
          }, 150);
        },
        onDeselected: () => cleanupAll(),
      },

      // ── Step 6 ───────────────────────────────────────────────────────────
      // Highlight the Run button on the Dashboard.
      // Uses a MutationObserver on document.body to detect when the modal mounts
      // rather than intercepting the click — native addEventListener is unreliable
      // on React-controlled buttons because React delegates all events to the root.
      {
        element: '[data-testid="dashboard-run-button"]',
        popover: {
          title: 'Fire it up!',
          description:
            'Click <strong>Run</strong> to open the Launch Modal. Everything will be pre-filled with the image and URL you just configured.',
          side: 'bottom',
          align: 'end',
          showButtons: ['previous', 'close'],
        },
        onHighlightStarted: () => {
          cleanupAll();

          // Advance as soon as the modal button appears in the DOM — this fires
          // reliably regardless of how React batches or delegates the click event.
          activeObserver = new MutationObserver(() => {
            if (document.querySelector('[data-testid="modal-launch-button"]')) {
              cleanupAll();
              emptyTourDriver.moveNext();
            }
          });
          activeObserver.observe(document.body, { childList: true, subtree: true });
        },
        onDeselected: () => cleanupAll(),
      },

      // ── Step 7 ───────────────────────────────────────────────────────────
      // Highlight the Environment dropdown (label + select) inside the modal.
      // Standard Next/Back step — educates users about environment targeting.
      {
        element: '[data-testid="modal-environment-select"]',
        popover: {
          title: 'Choose Your Environment',
          description:
            'Select the target environment for this run (e.g., Staging, Production). You can also manually override the base URL below if you need to test a specific PR preview.',
          side: 'top',
          align: 'start',
        },
        onDeselected: () => cleanupAll(),
      },

      // ── Step 8 ───────────────────────────────────────────────────────────
      // Highlight the Schedule Run toggle tab inside the modal.
      // Standard Next/Back step — introduces cron scheduling.
      // The description explicitly tells users NOT to click the tab here,
      // because doing so would swap the submit button to "Save Schedule" and
      // break Step 9's target (modal-launch-button).
      {
        element: '[data-testid="modal-schedule-tab"]',
        popover: {
          title: 'Scheduled Runs',
          description:
            'Need to run this nightly? You can switch to this tab later to configure a Cron schedule.<br><br><strong>👉 Please click Next to continue (do not click the tab yet!).</strong>',
          side: 'bottom',
          align: 'center',
        },
        onDeselected: () => cleanupAll(),
      },

      // ── Step 9 (was 7) ───────────────────────────────────────────────────
      // Highlight the Launch Execution button inside the modal.
      // driver.js spotlights an element *inside* the modal, so the overlay no
      // longer sits on top of it. The MutationObserver advances to Step 10 once
      // the first execution row appears, confirming the run was dispatched.
      {
        element: '[data-testid="modal-launch-button"]',
        popover: {
          title: 'Confirm & Launch',
          description:
            'Everything is pre-filled. Hit <strong>Launch Execution</strong> to spin up the container and start streaming live logs immediately.',
          side: 'top',
          align: 'end',
          showButtons: ['previous', 'close'],
        },
        onHighlightStarted: () => {
          cleanupAll();

          // If an execution row already exists (e.g. tour was restarted), skip ahead.
          if (document.querySelector('[data-testid="executions-table"] tbody tr[data-execution-id]')) {
            emptyTourDriver.moveNext();
            return;
          }

          // Watch for the first execution row to appear after the modal submits.
          // Narrow the observer scope to the table's tbody to avoid firing on unrelated DOM changes.
          const tableBody =
            document.querySelector('[data-testid="executions-table"] tbody') ?? document.body;
          activeObserver = new MutationObserver(() => {
            if (document.querySelector('[data-testid="executions-table"] tbody tr[data-execution-id]')) {
              cleanupAll();
              emptyTourDriver.moveNext();
            }
          });
          activeObserver.observe(tableBody, { childList: true, subtree: true });
        },
        onDeselected: () => cleanupAll(),
      },

      // ── Step 10 (was 8) ──────────────────────────────────────────────────
      // Highlight the executions table.
      // Auto-advances once the Execution Drawer opens (user clicked a row).
      {
        element: '[data-testid="executions-table"]',
        popover: {
          title: 'Your Test is Running!',
          description:
            'Your execution just appeared in the table. The status badge updates in real-time from <strong>PENDING → RUNNING → PASSED / FAILED</strong> via WebSocket. <strong>Click any row</strong> to open the detail drawer and continue the tour.',
          side: 'top',
          align: 'start',
          showButtons: ['previous', 'close'],
        },
        onHighlightStarted: () => {
          cleanupAll();

          // Drawer already open (e.g. user clicked a row before reaching this step).
          if (document.querySelector('[data-testid="execution-drawer-tab-bar"]')) {
            emptyTourDriver.moveNext();
            return;
          }

          // Watch for the Execution Drawer to mount after a row click.
          activeObserver = new MutationObserver(() => {
            if (document.querySelector('[data-testid="execution-drawer-tab-bar"]')) {
              cleanupAll();
              emptyTourDriver.moveNext();
            }
          });
          activeObserver.observe(document.body, { childList: true, subtree: true });
        },
        onDeselected: () => cleanupAll(),
      },

      // ── Step 11 (was 9) ──────────────────────────────────────────────────
      // Final step — highlight the Execution Drawer tab bar.
      // Done button fires onDestroyStarted → cleanupAll + markCompleted.
      {
        element: '[data-testid="execution-drawer-tab-bar"]',
        popover: {
          title: 'Your Execution at a Glance',
          description:
            'The detail drawer gives you everything in one place:<br><br>' +
            '• <strong>Logs</strong> — live Docker stdout/stderr streamed in real-time<br>' +
            '• <strong>AI Triage</strong> — Gemini automatically analyses failures and suggests root causes<br>' +
            '• <strong>Artifacts</strong> — download HTML and Allure reports when the run completes<br><br>' +
            "You're all set. Happy testing! 🎉",
          side: 'left',
          align: 'start',
        },
      },
    ],
  });

  return emptyTourDriver;
}

// ── Platform feature tour ─────────────────────────────────────────────────────
//
// Launched from the "Explore Platform Features" checklist item.
// Walks the user through the key platform capabilities:
//   1. Test Cases — building a living test repository
//   2. Test Cycles — hybrid automated + manual runs
//   3. Navigate to Settings
//   4. Team Members & RBAC
//   5. Secure Environment Variables
//
// Cross-page navigation uses setInterval URL polling; DOM readiness uses
// MutationObserver. All resources are cleaned up via cleanupAll().

function buildFeatureTour(onStepComplete: (id: string) => void, navigate: NavigateFunction): ReturnType<typeof driver> {
  let activeObserver: MutationObserver | null = null;
  let urlPollInterval: ReturnType<typeof setInterval> | null = null;

  const cleanupAll = () => {
    activeObserver?.disconnect();
    activeObserver = null;
    if (urlPollInterval !== null) {
      clearInterval(urlPollInterval);
      urlPollInterval = null;
    }
  };

  // navigate is passed in but may be used in future steps; satisfy the linter.
  void navigate;

  let featureTourDriver: ReturnType<typeof driver>;

  featureTourDriver = driver({
    ...DRIVER_BASE_CONFIG,
    showProgress: true,
    nextBtnText: 'Next →',
    prevBtnText: '← Back',
    doneBtnText: 'Done',

    onDestroyStarted: () => {
      cleanupAll();
      onStepComplete('platform-tour');
      featureTourDriver.destroy();
    },

    steps: [
      // ── Step 1 ───────────────────────────────────────────────────────────
      // Highlight the Test Cases sidebar link.
      {
        element: '[data-testid="sidebar-nav-test-cases"]',
        popover: {
          title: 'Test Cases Repository',
          description:
            'Build and maintain a living library of manual and automated test cases. Organise them into suites, assign ownership, and link them to execution runs — your single source of truth for what gets tested.',
          side: 'right',
          align: 'center',
        },
        onDeselected: () => cleanupAll(),
      },

      // ── Step 2 ───────────────────────────────────────────────────────────
      // Highlight the Test Cycles sidebar link.
      {
        element: '[data-testid="sidebar-nav-test-cycles"]',
        popover: {
          title: 'Hybrid Test Cycles',
          description:
            'Combine automated Docker runs with manual test cases into a single test cycle. Track mixed execution results in one place — ideal for release sign-off where automation and exploratory testing run side-by-side.',
          side: 'right',
          align: 'center',
        },
        onDeselected: () => cleanupAll(),
      },

      // ── Step 3 ───────────────────────────────────────────────────────────
      // Highlight the Settings sidebar link.
      // Auto-advances via setInterval once the URL changes to /settings,
      // identical to Step 1 of the empty-state tour.
      {
        element: '[data-testid="sidebar-nav-settings"]',
        popover: {
          title: "Now let's check Team Settings",
          description:
            'Click <strong>Settings</strong> in the sidebar to continue the tour and explore team management and environment configuration.',
          side: 'right',
          align: 'center',
          showButtons: ['previous', 'close'],
        },
        onHighlightStarted: () => {
          cleanupAll();

          if (window.location.pathname.startsWith('/settings')) {
            featureTourDriver.moveNext();
            return;
          }

          urlPollInterval = setInterval(() => {
            if (window.location.pathname.startsWith('/settings')) {
              cleanupAll();
              featureTourDriver.moveNext();
            }
          }, 150);
        },
        onDeselected: () => cleanupAll(),
      },

      // ── Step 4 ───────────────────────────────────────────────────────────
      // Highlight the Team Members settings tab.
      // MutationObserver guards against a brief race between the URL poll
      // calling moveNext() and the settings sidebar panel finishing its
      // slide-in CSS animation.
      {
        element: '[data-testid="sidebar-settings-tab-members"]',
        popover: {
          title: 'Team Members & RBAC',
          description:
            'Invite colleagues, assign roles (Admin, Member, Viewer), and control who can trigger runs, manage integrations, or access billing — all from one place.',
          side: 'right',
          align: 'center',
        },
        onHighlightStarted: () => {
          cleanupAll();

          // The settings nav renders all tabs in the DOM immediately on /settings;
          // the observer is a safety net for any edge-case mount delay.
          if (document.querySelector('[data-testid="sidebar-settings-tab-members"]')) return;

          activeObserver = new MutationObserver(() => {
            if (document.querySelector('[data-testid="sidebar-settings-tab-members"]')) {
              cleanupAll();
            }
          });
          activeObserver.observe(document.body, { childList: true, subtree: true });
        },
        onDeselected: () => cleanupAll(),
      },

      // ── Step 5 ───────────────────────────────────────────────────────────
      // Final step — highlight the Env Variables settings tab.
      // Done button fires onDestroyStarted → cleanupAll + markCompleted.
      {
        element: '[data-testid="sidebar-settings-tab-env-vars"]',
        popover: {
          title: 'Secure Environment Variables',
          description:
            'Store API keys, tokens, and secrets here. All values are encrypted at rest with AES-256-GCM and injected into your containers at runtime — never exposed in logs or committed to source control.',
          side: 'right',
          align: 'center',
        },
        onDeselected: () => cleanupAll(),
      },
    ],
  });

  return featureTourDriver;
}

// ── Component ─────────────────────────────────────────────────────────────────

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
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);

  // Inject the glow-pulse CSS for .driver-active-element once on mount.
  useEffect(() => {
    const cleanup = injectDriverGlowStyle();
    return cleanup;
  }, []);

  // Persist completed set.
  useEffect(() => {
    localStorage.setItem(LS_COMPLETED_KEY, JSON.stringify([...completed]));
  }, [completed]);

  // Destroy any active tour when the widget unmounts.
  useEffect(() => {
    return () => { driverRef.current?.destroy(); };
  }, []);

  // Re-open the widget when the global 'agnox:open-onboarding' event fires.
  // Dispatched by the Sidebar "Getting Started" button so dismissed users can
  // recover the checklist without a hard reload.
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

  // When executions exist → standard dashboard tour.
  // When the list is empty → Zero-to-One setup tour instead of a toast.
  const handleStartTour = useCallback(() => {
    if (executions.length === 0) {
      const tourDriver = buildEmptyStateTour(markCompleted, navigate);
      driverRef.current = tourDriver;
      tourDriver.drive();
      return;
    }
    const tourDriver = buildTour(markCompleted);
    driverRef.current = tourDriver;
    tourDriver.drive();
  }, [executions, markCompleted]);

  const handleFeatureTour = useCallback(() => {
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
                      className={`text-sm font-medium leading-tight ${
                        isDone
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
                    <span className={`text-[10px] font-semibold uppercase tracking-wide flex-shrink-0 pt-0.5 ${
                      isDone
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
