import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  ShoppingCart,
  BarChart3,
  History,
  Settings,
  LogIn,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Zap,
  CheckCircle2,
  Play,
} from 'lucide-react';
import { Card, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  details: string[];
  route?: string;
  badge?: { label: string; tone: 'neutral' | 'success' | 'accent' | 'warning' };
}

const WALKTHROUGH_STEPS: Step[] = [
  {
    id: 1,
    title: 'Login / Register',
    description: 'Authenticate with your credentials or create a new account to access the platform.',
    icon: LogIn,
    details: [
      'Sign up with your name, email, and password.',
      'Log in with your credentials to access the platform.',
      'Your session stays active so you don\'t have to log in every time.',
      'All your data is private and tied to your account.',
    ],
    route: '/login',
    badge: { label: 'Get Started', tone: 'neutral' },
  },
  {
    id: 2,
    title: 'Dashboard',
    description: 'Get a bird\'s-eye view of your procurement activity with real-time KPIs and insights.',
    icon: BarChart3,
    details: [
      'Total searches, procurement requests, and estimated savings at a glance.',
      'Preferred supplier and top category identification.',
      'Recent search history with quick re-run capability.',
      'AI-generated procurement insights and recommendations.',
    ],
    route: '/',
    badge: { label: 'Analytics', tone: 'accent' },
  },
  {
    id: 3,
    title: 'Single Product Search',
    description: 'Search for any product across multiple suppliers simultaneously.',
    icon: Search,
    details: [
      'Pick a category — Electronics, Fashion, Groceries, and more.',
      'Select which suppliers you want to compare (Amazon, Flipkart, etc.).',
      'Type in the product you\'re looking for and hit Search.',
      'Instantly see side-by-side results from all suppliers.',
      'Our AI recommends the best option based on your priorities.',
      'Compare price, delivery time, ratings, warranty, and return policy at a glance.',
    ],
    route: '/search',
    badge: { label: 'Core Feature', tone: 'success' },
  },
  {
    id: 4,
    title: 'Basket Optimization',
    description: 'Add multiple items and let the AI find the optimal supplier split.',
    icon: ShoppingCart,
    details: [
      'Switch to "Basket" mode on the Search page.',
      'Add all the items you need to purchase with quantities.',
      'The AI searches every item across all your selected suppliers.',
      'See the smartest way to split your order — or buy everything from one supplier.',
      'Shipping costs are factored in so the recommendation is realistic.',
      'View your total cost, potential savings, and the recommended buying plan.',
    ],
    route: '/search',
    badge: { label: 'Core Feature', tone: 'success' },
  },
  {
    id: 5,
    title: 'Weight Profiles',
    description: 'Customize how the AI ranks suppliers based on what matters most to you.',
    icon: Zap,
    details: [
      'Balanced — Considers all factors equally for a well-rounded pick.',
      'Cost Saver — Finds you the absolute cheapest option.',
      'Speed Priority — Picks the supplier that delivers fastest.',
      'Quality First — Focuses on top ratings, best warranty, and easy returns.',
      'Switch profiles anytime — results update instantly.',
    ],
    route: '/search',
    badge: { label: 'Smart Picks', tone: 'warning' },
  },
  {
    id: 6,
    title: 'Search History',
    description: 'Review every comparison you\'ve run with full pagination support.',
    icon: History,
    details: [
      'Browse through all your past searches, organized by date.',
      'See the product searched, category, suppliers compared, and savings found.',
      'Re-run any previous search with a single click.',
      'Delete entries you no longer need.',
      'Navigate through pages with simple Prev/Next controls.',
    ],
    route: '/history',
    badge: { label: 'Activity', tone: 'neutral' },
  },
  {
    id: 7,
    title: 'Analytics',
    description: 'Deep-dive into spend patterns, supplier usage, and savings trends.',
    icon: BarChart3,
    details: [
      'Monthly spend trend — track procurement costs over time.',
      'Category spend breakdown — see where your budget goes.',
      'Supplier usage distribution — identify vendor concentration.',
      'Savings trend — visualize cumulative savings from AI recommendations.',
    ],
    route: '/analytics',
    badge: { label: 'Insights', tone: 'accent' },
  },
  {
    id: 8,
    title: 'Settings',
    description: 'Configure your default preferences and notification settings.',
    icon: Settings,
    details: [
      'Set default product category for quick searches.',
      'Choose preferred currency format.',
      'Toggle notification preferences.',
      'User profile management.',
    ],
    route: '/settings',
    badge: { label: 'Config', tone: 'neutral' },
  },
];


function StepCard({ step, isOpen, onToggle, onNavigate }: {
  step: Step;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: (route: string) => void;
}) {
  try {
    const Icon = step.icon;
    return (
      <div className="group">
        <button
          onClick={onToggle}
          className="flex w-full items-center gap-4 rounded-xl border border-line bg-surface px-5 py-4 text-left transition-all hover:border-ink/30 hover:shadow-sm"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-white">
            <Icon size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted">STEP {step.id}</span>
              {step.badge && <Badge tone={step.badge.tone}>{step.badge.label}</Badge>}
            </div>
            <h3 className="mt-0.5 font-display text-lg font-semibold text-ink">{step.title}</h3>
            <p className="mt-0.5 text-sm text-muted">{step.description}</p>
          </div>
          <span className="shrink-0 text-muted">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
        </button>

        {isOpen && (
          <div className="mt-1 rounded-b-xl border border-t-0 border-line bg-bg px-5 py-4">
            <ul className="space-y-2">
              {step.details.map((detail, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-soft">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-success" />
                  {detail}
                </li>
              ))}
            </ul>
            {step.route && (
              <button
                onClick={() => onNavigate(step.route!)}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Try it now <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  } catch (e) {
    console.error('Failed to render StepCard', e);
    return null;
  }
}

export function WalkthroughPage() {
  const navigate = useNavigate();
  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set([1]));

  const toggleStep = (id: number) => {
    try {
      setOpenSteps((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    } catch (e) {
      console.error('Failed to toggle step', e);
    }
  };

  const expandAll = () => {
    try {
      setOpenSteps(new Set(WALKTHROUGH_STEPS.map((s) => s.id)));
    } catch (e) {
      console.error('Failed to expand all', e);
    }
  };

  const collapseAll = () => {
    try {
      setOpenSteps(new Set());
    } catch (e) {
      console.error('Failed to collapse all', e);
    }
  };

  return (
    <div className="space-y-9">
      {/* Header */}
      <div>
        <div className="label-eyebrow">Guide</div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">
          Product Walkthrough
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          A step-by-step guide to understanding and using ProcureAI. Follow the flow below to explore every feature,
          or click "Try it now" to jump directly to any section.
        </p>
        <button
          onClick={() => navigate('/docs')}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <BookOpen size={15} /> Learn More — Full Documentation
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Demo Video Section */}
      <Card>
        <CardBody className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Play size={28} />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Demo Video</h2>
            <p className="mt-1 max-w-md text-sm text-muted">
              Watch a complete walkthrough of ProcureAI covering single search, basket optimization,
              analytics, and more.
            </p>
          </div>
          <div className="mt-2 w-full max-w-3xl overflow-hidden rounded-xl border border-line bg-bg">
            <div className="flex aspect-video items-center justify-center text-muted">
              <div className="flex flex-col items-center gap-3">
                <Play size={40} className="text-ink/20" />
                <p className="text-sm font-medium text-ink/40">Demo video coming soon</p>
                <p className="text-xs text-muted">Record your walkthrough and embed it here</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Application Flow */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-ink flex items-center gap-2">
              <BookOpen size={20} /> Application Flow
            </h2>
            <p className="mt-0.5 text-sm text-muted">Follow these {WALKTHROUGH_STEPS.length} steps to master ProcureAI</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-ink/40 hover:text-ink"
            >
              Expand all
            </button>
            <button
              onClick={collapseAll}
              className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-ink/40 hover:text-ink"
            >
              Collapse all
            </button>
          </div>
        </div>

        {/* Step connector line */}
        <div className="space-y-3">
          {WALKTHROUGH_STEPS.map((step) => (
            <StepCard
              key={step.id}
              step={step}
              isOpen={openSteps.has(step.id)}
              onToggle={() => toggleStep(step.id)}
              onNavigate={(route) => navigate(route)}
            />
          ))}
        </div>
      </div>

      {/* How It Works — simple visual flow */}
      <Card>
        <CardBody>
          <h2 className="mb-4 font-display text-lg font-bold text-ink">How It Works</h2>
          <div className="overflow-x-auto">
            <div className="flex items-center gap-3 min-w-[600px] py-2">
              {[
                { label: 'Search', sub: 'Enter a product', color: 'bg-blue-600' },
                { label: 'Compare', sub: 'See all suppliers', color: 'bg-violet-600' },
                { label: 'AI Recommends', sub: 'Best option picked', color: 'bg-amber-600' },
                { label: 'Save', sub: 'Track your savings', color: 'bg-emerald-600' },
              ].map((node, i, arr) => (
                <React.Fragment key={node.label}>
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full text-white text-xs font-bold ${node.color}`}>
                      {i + 1}
                    </span>
                    <span className="text-xs font-semibold text-ink whitespace-nowrap">{node.label}</span>
                    <span className="text-[10px] text-muted whitespace-nowrap">{node.sub}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <ArrowRight size={16} className="shrink-0 text-muted" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardBody>
          <h2 className="mb-3 font-display text-lg font-bold text-ink">Quick Links</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Dashboard', route: '/', icon: BarChart3 },
              { label: 'Search & Compare', route: '/search', icon: Search },
              { label: 'Search History', route: '/history', icon: History },
              { label: 'Analytics', route: '/analytics', icon: BarChart3 },
            ].map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.route}
                  onClick={() => navigate(link.route)}
                  className="flex items-center gap-3 rounded-lg border border-line px-4 py-3 text-left transition-colors hover:border-ink/30 hover:bg-bg"
                >
                  <Icon size={18} className="text-accent" />
                  <span className="text-sm font-medium text-ink">{link.label}</span>
                  <ArrowRight size={14} className="ml-auto text-muted" />
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
