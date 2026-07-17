'use client';

import { useState } from 'react';
import {
  Braces,
  Check,
  Copy,
  ExternalLink,
  Package,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

interface SdkQuickstartProps {
  projectId: string;
}

export function SdkQuickstart({
  projectId,
}: SdkQuickstartProps) {
  const [copiedSection, setCopiedSection] =
    useState<string | null>(null);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    'https://api.toggleflow.com/api/v1';

  const installCommand =
    'npm install @toggleflow/node';

  const environmentExample = [
    'TOGGLEFLOW_API_KEY=your_server_side_api_key',
    `TOGGLEFLOW_API_URL=${apiUrl}`,
  ].join('\n');

  const usageExample = `import { ToggleFlow } from '@toggleflow/node';

const toggleflow = new ToggleFlow({
  apiKey: process.env.TOGGLEFLOW_API_KEY!,
  baseUrl:
    process.env.TOGGLEFLOW_API_URL ??
    'https://api.toggleflow.com/api/v1',
});

const enabled = await toggleflow.isEnabled(
  'your_flag_key',
  { userId: 'user-123' },
  false
);

if (enabled) {
  // Run the feature
}`;

  const copy = async (
    section: string,
    value: string
  ) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedSection(section);
      toast.success('Copied to clipboard');

      window.setTimeout(() => {
        setCopiedSection((current) =>
          current === section ? null : current
        );
      }, 2000);
    } catch {
      toast.error('Unable to copy to clipboard.');
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-primary/30 bg-card">
      <div className="flex flex-col justify-between gap-5 border-b border-border p-5 sm:flex-row sm:items-start lg:p-6">
        <div className="flex gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary-subtle">
            <Braces className="size-5 text-primary" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-medium text-foreground">
                Node.js quick start
              </h2>

              <span className="rounded-full border border-success/30 bg-success-subtle px-2 py-0.5 text-[10px] font-medium text-success">
                Official SDK
              </span>
            </div>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Evaluate feature flags securely from your
              server using the selected project.
            </p>

            <p className="mt-2 font-mono text-[10px] text-muted-foreground">
              Project {projectId}
            </p>
          </div>
        </div>

        <a
          href="https://www.npmjs.com/package/@toggleflow/node"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center gap-2 self-start rounded-lg border border-border bg-card px-3 text-xs text-foreground-secondary transition-colors hover:bg-surface-elevated hover:text-foreground"
        >
          View on npm
          <ExternalLink className="size-3" />
        </a>
      </div>

      <div className="grid gap-px bg-surface-elevated lg:grid-cols-2">
        <div className="space-y-5 bg-surface p-5 lg:p-6">
          <QuickstartStep
            number="01"
            icon={Package}
            title="Install the SDK"
            description="Add the official server-side package."
          />

          <CodePanel
            label="Terminal"
            value={installCommand}
            copied={copiedSection === 'install'}
            onCopy={() =>
              copy('install', installCommand)
            }
          />

          <QuickstartStep
            number="02"
            icon={Terminal}
            title="Configure your environment"
            description="Store your key outside source control."
          />

          <CodePanel
            label=".env"
            value={environmentExample}
            copied={copiedSection === 'environment'}
            onCopy={() =>
              copy('environment', environmentExample)
            }
          />
        </div>

        <div className="space-y-5 bg-surface p-5 lg:p-6">
          <QuickstartStep
            number="03"
            icon={Braces}
            title="Evaluate a feature flag"
            description="Use a stable user identifier for deterministic rollouts."
          />

          <CodePanel
            label="toggleflow.ts"
            value={usageExample}
            copied={copiedSection === 'usage'}
            onCopy={() => copy('usage', usageExample)}
            multiline
          />

          <div className="flex gap-3 rounded-xl border border-warning/30 bg-warning-subtle p-4">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-warning" />

            <p className="text-xs leading-5 text-warning">
              Keep SDK keys on the server. Never expose
              them through variables beginning with{' '}
              <code className="text-warning">
                NEXT_PUBLIC_
              </code>{' '}
              or include them in browser bundles.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

interface QuickstartStepProps {
  number: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  description: string;
}

function QuickstartStep({
  number,
  icon: Icon,
  title,
  description,
}: QuickstartStepProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
        <Icon className="size-3.5 text-primary" />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-primary">
            {number}
          </span>

          <h3 className="text-sm font-medium text-foreground">
            {title}
          </h3>
        </div>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

interface CodePanelProps {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  multiline?: boolean;
}

function CodePanel({
  label,
  value,
  copied,
  onCopy,
  multiline = false,
}: CodePanelProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="font-mono text-[10px] text-muted-foreground">
          {label}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
          aria-label={`Copy ${label}`}
          onClick={onCopy}
        >
          {copied ? (
            <Check className="size-3 text-success" />
          ) : (
            <Copy className="size-3" />
          )}
        </Button>
      </div>

      <pre
        className={
          multiline
            ? 'max-h-80 overflow-auto p-4 text-xs leading-6 text-foreground-secondary'
            : 'overflow-x-auto p-4 text-xs leading-6 text-foreground-secondary'
        }
      >
        <code>{value}</code>
      </pre>
    </div>
  );
}
