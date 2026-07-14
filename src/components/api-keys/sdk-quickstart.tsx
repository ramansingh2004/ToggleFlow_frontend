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
    <section className="overflow-hidden rounded-2xl border border-indigo-400/15 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_35%),rgba(255,255,255,0.018)]">
      <div className="flex flex-col justify-between gap-5 border-b border-white/[0.07] p-5 sm:flex-row sm:items-start lg:p-6">
        <div className="flex gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 shadow-[0_0_28px_rgba(99,102,241,0.1)]">
            <Braces className="size-5 text-indigo-300" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-medium text-white">
                Node.js quick start
              </h2>

              <span className="rounded-full border border-emerald-400/15 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                Official SDK
              </span>
            </div>

            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
              Evaluate feature flags securely from your
              server using the selected project.
            </p>

            <p className="mt-2 font-mono text-[10px] text-zinc-700">
              Project {projectId}
            </p>
          </div>
        </div>

        <a
          href="https://www.npmjs.com/package/@toggleflow/node"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center gap-2 self-start rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 text-xs text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          View on npm
          <ExternalLink className="size-3" />
        </a>
      </div>

      <div className="grid gap-px bg-white/[0.06] lg:grid-cols-2">
        <div className="space-y-5 bg-[#090c13] p-5 lg:p-6">
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

        <div className="space-y-5 bg-[#090c13] p-5 lg:p-6">
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

          <div className="flex gap-3 rounded-xl border border-amber-400/15 bg-amber-500/[0.05] p-4">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-300" />

            <p className="text-xs leading-5 text-amber-100/55">
              Keep SDK keys on the server. Never expose
              them through variables beginning with{' '}
              <code className="text-amber-200">
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
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025]">
        <Icon className="size-3.5 text-indigo-300" />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-indigo-400">
            {number}
          </span>

          <h3 className="text-sm font-medium text-zinc-200">
            {title}
          </h3>
        </div>

        <p className="mt-1 text-xs leading-5 text-zinc-600">
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
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-black/30">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
        <span className="font-mono text-[10px] text-zinc-700">
          {label}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-zinc-600 hover:bg-white/[0.06] hover:text-white"
          aria-label={`Copy ${label}`}
          onClick={onCopy}
        >
          {copied ? (
            <Check className="size-3 text-emerald-400" />
          ) : (
            <Copy className="size-3" />
          )}
        </Button>
      </div>

      <pre
        className={
          multiline
            ? 'max-h-80 overflow-auto p-4 text-xs leading-6 text-zinc-400'
            : 'overflow-x-auto p-4 text-xs leading-6 text-zinc-400'
        }
      >
        <code>{value}</code>
      </pre>
    </div>
  );
}