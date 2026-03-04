import type { ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  return (
    <header className={styles.heroBanner}>
      <div className={styles.heroGlow} aria-hidden />
      <div className="container">
        <div className={styles.heroBadge}>AI Quality Orchestrator</div>
        <Heading as="h1" className={styles.heroTitle}>
          Ship with confidence.<br />
          <span className={styles.heroTitleAccent}>Debug at the speed of AI.</span>
        </Heading>
        <p className={styles.heroSubtitle}>
          Agnox unifies test execution, manual QA, and intelligent AI analysis
          into one platform — so your team stops guessing and starts shipping.
        </p>
        <div className={styles.buttons}>
          <Link className={clsx('button button--lg', styles.buttonPrimary)} to="/docs/getting-started/quick-start">
            Get Started Free →
          </Link>
          <Link className={clsx('button button--lg', styles.buttonSecondary)} to="/docs/getting-started/intro">
            Read the Docs
          </Link>
        </div>
      </div>
    </header>
  );
}

type QuickCard = {
  icon: string;
  title: string;
  description: string;
  href: string;
  color: string;
};

const QuickCards: QuickCard[] = [
  {
    icon: '🚀',
    title: 'Quick Start',
    description: 'Connect your CI or Docker image and run your first test in minutes.',
    href: '/docs/getting-started/quick-start',
    color: '#6778d6',
  },
  {
    icon: '🧠',
    title: 'AI Features',
    description: 'Auto-Bug Generator, Flakiness Detective, Smart Optimizer, and more.',
    href: '/docs/ai-capabilities/configuration',
    color: '#9b6dd6',
  },
  {
    icon: '⚙️',
    title: 'Integrations',
    description: 'Connect Playwright, GitHub Actions, Slack, Jira, and Docker.',
    href: '/docs/integrations/playwright-reporter',
    color: '#6db8d6',
  },
  {
    icon: '📚',
    title: 'API Reference',
    description: 'Complete REST API docs — authentication, organizations, users, and more.',
    href: '/docs/api-reference/api-overview',
    color: '#6dd69b',
  },
];

function QuickAccess(): ReactNode {
  return (
    <section className={styles.quickAccess}>
      <div className="container">
        <div className={styles.quickGrid}>
          {QuickCards.map((card) => (
            <Link key={card.title} to={card.href} className={styles.quickCard} style={{ '--card-color': card.color } as React.CSSProperties}>
              <div className={styles.quickCardIcon}>{card.icon}</div>
              <Heading as="h3" className={styles.quickCardTitle}>{card.title}</Heading>
              <p className={styles.quickCardDesc}>{card.description}</p>
              <span className={styles.quickCardArrow}>→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

type FeatureItem = {
  icon: string;
  title: string;
  description: string;
};

const FeatureList: FeatureItem[] = [
  {
    icon: '🔌',
    title: 'Dual Execution Modes',
    description:
      'Stream results from your existing GitHub Actions/GitLab pipelines using the native Playwright reporter, or let Agnox host and execute your containerized tests directly.',
  },
  {
    icon: '🔬',
    title: 'Investigation Hub',
    description:
      'Triage failures instantly with a real-time streaming terminal and visual artifact gallery. Drill into screenshots, traces, and logs from one unified interface.',
  },
  {
    icon: '🤖',
    title: 'AI-Powered Triage',
    description:
      'Dual-agent root-cause analysis delivers hallucination-resistant answers — an Analyzer generates the diagnosis, a Critic validates every claim against raw logs.',
  },
  {
    icon: '🎯',
    title: 'Quality Hub',
    description:
      'Build a living manual test repository with suite-grouped test cases. Generate structured BDD test steps instantly with AI.',
  },
  {
    icon: '🔄',
    title: 'Hybrid Test Cycles',
    description:
      'Combine manual and automated tests in unified cycles. Manual items get an interactive step-by-step player; automated items sync results in real time.',
  },
  {
    icon: '🔗',
    title: 'Enterprise Connectors',
    description:
      'Create Jira tickets from failed tests with one click. Keep your team informed with Slack notifications and custom webhook integrations.',
  },
];

function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2" className={styles.sectionTitle}>Everything your QA team needs</Heading>
          <p className={styles.sectionSubtitle}>
            From automated pipelines to manual test cycles — one platform for the entire quality lifecycle.
          </p>
        </div>
        <div className="row">
          {FeatureList.map((item) => (
            <div key={item.title} className={clsx('col col--4')}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>{item.icon}</div>
                <Heading as="h3" className={styles.featureTitle}>{item.title}</Heading>
                <p className={styles.featureDescription}>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

type StatItem = {
  value: string;
  label: string;
};

const Stats: StatItem[] = [
  { value: '5', label: 'AI-powered features' },
  { value: '3', label: 'LLM providers (BYOK)' },
  { value: '4', label: 'CI providers auto-detected' },
  { value: '∞', label: 'Test frameworks supported' },
];

function PlatformStats(): ReactNode {
  return (
    <section className={styles.stats}>
      <div className="container">
        <div className={styles.statsGrid}>
          {Stats.map((s) => (
            <div key={s.label} className={styles.statItem}>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureShowcase(): ReactNode {
  return (
    <section className={clsx('padding-vert--xl', styles.showcase)}>
      <div className="container">
        {/* Showcase 1 — Investigation Hub */}
        <div className={clsx('row', styles.showcaseRow)}>
          <div className="col col--6">
            <div className={styles.showcaseText}>
              <div className={styles.showcaseBadge}>Investigation Hub</div>
              <Heading as="h2" className={styles.showcaseHeading}>
                Debug failures in seconds, not hours
              </Heading>
              <p className={styles.showcaseBody}>
                Stop digging through raw CI logs. Agnox streams your test output in real time into a terminal built for debugging — so you see exactly what went wrong the moment it happens.
              </p>
              <ul className={styles.showcaseList}>
                <li><strong>Real-time streaming terminal</strong> — no more refreshing CI pages</li>
                <li><strong>Visual artifact gallery</strong> — screenshots, traces, and videos at a glance</li>
                <li><strong>Dual-agent AI analysis</strong> — surfaces the fix, not just the failure</li>
              </ul>
              <Link className={clsx('button', styles.buttonPrimary)} to="/docs/core-features/executions">
                Explore Executions →
              </Link>
            </div>
          </div>
          <div className="col col--6">
            <div className={styles.showcaseImageWrapper}>
              <img
                src="/img/dashboard-preview.png"
                alt="Agnox Investigation Hub"
                className={styles.showcaseImage}
              />
            </div>
          </div>
        </div>

        {/* Showcase 2 — AI Orchestrator */}
        <div className={clsx('row', styles.showcaseRow)}>
          <div className="col col--6">
            <div className={styles.showcaseImageWrapper}>
              <img
                src="/img/cycles-preview.png"
                alt="Agnox AI Quality Orchestrator"
                className={styles.showcaseImage}
              />
            </div>
          </div>
          <div className="col col--6">
            <div className={styles.showcaseText}>
              <div className={styles.showcaseBadge}>AI Quality Orchestrator</div>
              <Heading as="h2" className={styles.showcaseHeading}>
                Five AI features. One platform.
              </Heading>
              <p className={styles.showcaseBody}>
                Enable the AI features your team actually needs — from auto-generating Jira bugs from failed logs to querying your test data in plain English.
              </p>
              <ul className={styles.showcaseList}>
                <li><strong>Auto-Bug Generator</strong> — structured, Jira-ready reports from logs</li>
                <li><strong>Flakiness Detective</strong> — stability scores and actionable fixes</li>
                <li><strong>Quality Chatbot</strong> — natural-language queries over your test data</li>
              </ul>
              <Link className={clsx('button', styles.buttonPrimary)} to="/docs/ai-capabilities/configuration">
                Explore AI Features →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} — AI Quality Orchestrator`}
      description="Agnox is the AI Quality Orchestrator for modern engineering teams. Unified test execution, manual QA, and five AI-powered features in one platform.">
      <HomepageHeader />
      <main>
        <QuickAccess />
        <HomepageFeatures />
        <PlatformStats />
        <FeatureShowcase />
      </main>
    </Layout>
  );
}
