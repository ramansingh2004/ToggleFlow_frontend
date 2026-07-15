'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  CircleCheck,
  Code2,
  Copy,
  Flag,
  Gauge,
  KeyRound,
  Rocket,
  ShieldAlert,
  Terminal,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:5000/api/v1';

const examples = {
  install: `npm install @toggleflow/node`,

  environment: `# Add these to your application's server environment
TOGGLEFLOW_API_URL=${apiUrl}
TOGGLEFLOW_API_KEY=tf_your_secret_api_key`,

  client: `import 'server-only';
import { ToggleFlow } from '@toggleflow/node';

const apiKey = process.env.TOGGLEFLOW_API_KEY;

if (!apiKey) {
  throw new Error('TOGGLEFLOW_API_KEY is not configured');
}

export const toggleflow = new ToggleFlow({
  apiKey,
  ...(process.env.TOGGLEFLOW_API_URL
    ? { baseUrl: process.env.TOGGLEFLOW_API_URL }
    : {}),
  cacheTtlMs: 30_000,
  timeoutMs: 5_000,
});`,

  evaluate: `import { toggleflow } from '@/lib/toggleflow';

export async function canSeeNewCheckout(userId: string) {
  return toggleflow.isEnabled(
    'new_checkout',
    { userId },
    false // safe fallback when ToggleFlow is unavailable
  );
}`,

  serverComponent: `import { toggleflow } from '@/lib/toggleflow';

export default async function DashboardPage() {
  // Read this from your own authentication/session system.
  const userId = 'your-stable-application-user-id';

  const showNewCheckout = await toggleflow.isEnabled(
    'new_checkout',
    { userId },
    false
  );

  return showNewCheckout
    ? <NewCheckout />
    : <CurrentCheckout />;
}`,

  attributes: `const enabled = await toggleflow.isEnabled(
  'new_checkout',
  {
    userId: user.id,
    attributes: {
      plan: user.plan,       // e.g. "pro"
      country: user.country, // e.g. "IN"
      betaTester: true,
    },
  },
  false
);`,

  allFlags: `const flags = await toggleflow.getAllFlags({
  userId: user.id,
  attributes: {
    plan: user.plan,
    country: user.country,
  },
});

if (flags.new_checkout) {
  // Render or execute the new feature.
}`,

  curl: `curl --get "${apiUrl}/sdk/flags" \\
  --data-urlencode "userId=user_123" \\
  --header "Authorization: Bearer tf_your_secret_api_key"`,
};

export function SdkQuickstartPage() {
  return (
    <main className="p-5 sm:p-7 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-indigo-300">
              Developer integration
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">
              Node.js SDK quickstart
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500">
              Create a flag in ToggleFlow, connect your server,
              and safely change production behavior without
              rebuilding or redeploying your application.
            </p>
          </div>

          <Link
            href="/api-keys"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 text-sm font-medium text-white hover:bg-indigo-400"
          >
            <KeyRound className="size-4" />
            Create API key
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <ConceptCard
            number="01"
            icon={Flag}
            title="Configure in ToggleFlow"
            description="Create projects, flags, rollouts, and segments in the control panel."
          />
          <ConceptCard
            number="02"
            icon={Code2}
            title="Evaluate on your server"
            description="Install the SDK and evaluate flags with a stable application user ID."
          />
          <ConceptCard
            number="03"
            icon={Rocket}
            title="Change without redeploying"
            description="After the first integration, flag changes reach production at runtime."
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-6">
            <GuideSection
              number="1"
              area="ToggleFlow dashboard"
              title="Create or select a project"
              description="A project groups its flags, environments, API keys, segments, and analytics."
            >
              <InstructionList
                items={[
                  'Open Projects in ToggleFlow.',
                  'Create a project for the application you want to control.',
                  'Select that project from the project selector in the sidebar.',
                ]}
              />

              <DashboardLink href="/projects">
                Open projects
              </DashboardLink>
            </GuideSection>

            <GuideSection
              number="2"
              area="ToggleFlow dashboard"
              title="Create your first feature flag"
              description="The flag key is the permanent identifier your application will evaluate."
            >
              <InstructionList
                items={[
                  'Open Feature flags and choose New flag.',
                  'Give it a readable name, such as New checkout.',
                  'Use a key such as new_checkout. Copy it exactly into your code.',
                  'Enable the flag when you want it to be eligible for users.',
                ]}
              />

              <InfoBox>
                Disabling the master flag disables the feature for
                everyone, even if a rollout or segment is configured.
              </InfoBox>

              <DashboardLink href="/flags">
                Open feature flags
              </DashboardLink>
            </GuideSection>

            <GuideSection
              number="3"
              area="ToggleFlow dashboard"
              title="Create a server API key"
              description="The API key connects your application to the currently selected ToggleFlow project."
            >
              <InstructionList
                items={[
                  'Open API keys and choose New API key.',
                  'Use a descriptive name such as Production server.',
                  'Copy the complete key immediately—it is displayed only once.',
                  'Keep the key for the next step and never commit it to Git.',
                ]}
              />

              <DashboardLink href="/api-keys">
                Open API keys
              </DashboardLink>
            </GuideSection>

            <GuideSection
              number="4"
              area="Your application"
              title="Install the official Node.js SDK"
              description="Run this command in the root of the application where you want to use ToggleFlow."
            >
              <CodeBlock
                language="Terminal"
                code={examples.install}
              />

              <p className="mt-3 text-xs leading-5 text-zinc-600">
                The SDK supports Node.js 20 or newer and can be
                used with Next.js, Express, Fastify, NestJS, and
                other server-side Node.js applications.
              </p>
            </GuideSection>

            <GuideSection
              number="5"
              area="Your application"
              title="Configure server environment variables"
              description="Add these values to .env.local for development and to your hosting provider for production."
            >
              <CodeBlock
                language=".env.local"
                code={examples.environment}
              />

              <InfoBox>
                On Vercel, add them under Project Settings →
                Environment Variables and redeploy once. Future
                flag changes do not require another deployment.
              </InfoBox>
            </GuideSection>

            <GuideSection
              number="6"
              area="Your application"
              title="Create one reusable server client"
              description="For a Next.js application, create src/lib/toggleflow.ts. The server-only import prevents accidental browser use."
            >
              <CodeBlock
                language="src/lib/toggleflow.ts"
                code={examples.client}
              />

              <p className="mt-3 text-xs leading-5 text-zinc-600">
                For a non-Next.js Node application, remove the
                <code className="mx-1 text-zinc-400">
                  import &apos;server-only&apos;
                </code>
                line.
              </p>
            </GuideSection>

            <GuideSection
              number="7"
              area="Your application"
              title="Evaluate a flag"
              description="Use the exact flag key and pass the same stable userId for the same application user."
            >
              <CodeBlock
                language="TypeScript"
                code={examples.evaluate}
              />

              <div className="mt-4">
                <CodeBlock
                  language="Next.js server component"
                  code={examples.serverComponent}
                />
              </div>

              <InfoBox>
                The final false is a safe fallback. If ToggleFlow
                cannot be reached, the existing feature remains in
                control instead of breaking the page.
              </InfoBox>
            </GuideSection>

            <GuideSection
              number="8"
              area="ToggleFlow + your application"
              title="Use percentage rollouts"
              description="Release a flag to a deterministic percentage of users while keeping each user’s result stable."
            >
              <InstructionList
                items={[
                  'In ToggleFlow, open the flag rollout control and choose a percentage.',
                  'Keep the master flag enabled; otherwise the rollout is inactive.',
                  'In your application, always pass a stable userId such as your database user ID.',
                  'Increase or decrease the percentage from ToggleFlow—no application redeploy is needed.',
                ]}
              />

              <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/20 p-4">
                <div className="flex items-center gap-2">
                  <Gauge className="size-4 text-cyan-300" />
                  <p className="text-xs font-medium text-zinc-300">
                    Deterministic assignment
                  </p>
                </div>
                <p className="mt-2 text-xs leading-5 text-zinc-600">
                  A 50% rollout does not mean every user alternates
                  between on and off. The same user ID consistently
                  receives the same result until targeting changes.
                </p>
              </div>
            </GuideSection>

            <GuideSection
              number="9"
              area="ToggleFlow + your application"
              title="Target segments with user attributes"
              description="Segments let you target groups such as Pro customers, beta testers, or users in a country."
            >
              <InstructionList
                items={[
                  'Create a segment in ToggleFlow and add its matching rules.',
                  'Open the flag target control and select the segment.',
                  'Pass matching attributes from your application during evaluation.',
                  'Attribute names and values must match the segment rules exactly.',
                ]}
              />

              <div className="mt-4">
                <CodeBlock
                  language="TypeScript"
                  code={examples.attributes}
                />
              </div>

              <DashboardLink href="/segments">
                Open segments
              </DashboardLink>
            </GuideSection>

            <GuideSection
              number="10"
              area="Your application"
              title="Deploy and verify the integration"
              description="Deploy once with the server environment variables, then verify runtime changes from ToggleFlow."
            >
              <InstructionList
                items={[
                  'Add TOGGLEFLOW_API_URL and TOGGLEFLOW_API_KEY to your production host.',
                  'Deploy or redeploy the application so it receives those variables.',
                  'Open the production application as a test user.',
                  'Disable and enable the flag in ToggleFlow and confirm the application changes.',
                  'Allow up to the configured cache TTL (30 seconds in this guide) for an existing server instance to refresh.',
                ]}
              />

              <div className="mt-4">
                <CodeBlock
                  language="Optional API test"
                  code={examples.curl}
                />
              </div>
            </GuideSection>

            <GuideSection
              number="11"
              area="Your application"
              title="Optional: evaluate all flags at once"
              description="Use getAllFlags when one request needs several feature decisions."
            >
              <CodeBlock
                language="TypeScript"
                code={examples.allFlags}
              />
            </GuideSection>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
            <div className="rounded-2xl border border-amber-400/15 bg-amber-500/[0.05] p-5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-amber-300" />
                <h2 className="text-sm font-medium text-amber-200">
                  Server-side only
                </h2>
              </div>

              <p className="mt-3 text-xs leading-5 text-amber-200/50">
                Never put the API key in a Client Component,
                browser bundle, mobile application, or a variable
                prefixed with NEXT_PUBLIC_.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <h2 className="text-sm font-medium text-zinc-200">
                Integration checklist
              </h2>

              <div className="mt-4 space-y-3">
                {[
                  'Project selected',
                  'Flag key copied',
                  'Master flag enabled',
                  'API key stored securely',
                  'SDK runs on the server',
                  'Stable user ID supplied',
                  'Production variables added',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-2"
                  >
                    <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                    <span className="text-xs leading-5 text-zinc-500">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2">
                <UserRound className="size-4 text-indigo-300" />
                <h2 className="text-sm font-medium text-zinc-200">
                  Choosing a userId
                </h2>
              </div>

              <p className="mt-3 text-xs leading-5 text-zinc-600">
                Use your application&apos;s database user ID. For
                anonymous visitors, create a random ID once, save
                it in a cookie, and reuse it. Do not generate a new
                ID on every request.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <h2 className="text-sm font-medium text-zinc-200">
                Troubleshooting
              </h2>

              <ul className="mt-3 space-y-2 text-xs leading-5 text-zinc-600">
                <li>• Confirm the key belongs to the selected project.</li>
                <li>• Match the flag key exactly.</li>
                <li>• Enable the flag before testing rollout.</li>
                <li>• Pass segment attributes with matching types.</li>
                <li>• Wait for the cache TTL after a change.</li>
                <li>• A free backend may need time to wake up.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <h2 className="text-sm font-medium text-zinc-200">
                SDK package
              </h2>
              <code className="mt-3 block rounded-lg bg-black/30 p-3 text-xs text-cyan-300">
                @toggleflow/node
              </code>
              <p className="mt-3 text-xs leading-5 text-zinc-600">
                This guide targets SDK version 0.2.0 or newer.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function ConceptCard({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex items-center justify-between">
        <div className="flex size-9 items-center justify-center rounded-xl border border-indigo-400/15 bg-indigo-500/10">
          <Icon className="size-4 text-indigo-300" />
        </div>
        <span className="font-mono text-[10px] text-zinc-700">
          {number}
        </span>
      </div>
      <h2 className="mt-5 text-sm font-medium text-zinc-200">
        {title}
      </h2>
      <p className="mt-2 text-xs leading-5 text-zinc-600">
        {description}
      </p>
    </div>
  );
}

function GuideSection({
  number,
  area,
  title,
  description,
  children,
}: {
  number: string;
  area: 'ToggleFlow dashboard' | 'Your application' | 'ToggleFlow + your application';
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const isDashboard = area === 'ToggleFlow dashboard';
  const isBoth = area === 'ToggleFlow + your application';

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
      <div className="flex items-start gap-4 border-b border-white/[0.07] p-5">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-indigo-400/15 bg-indigo-500/10 font-mono text-xs text-indigo-300">
          {number}
        </div>

        <div className="min-w-0 flex-1">
          <span
            className={
              isBoth
                ? 'inline-flex rounded-full border border-violet-400/15 bg-violet-500/10 px-2 py-1 text-[10px] font-medium text-violet-300'
                : isDashboard
                  ? 'inline-flex rounded-full border border-indigo-400/15 bg-indigo-500/10 px-2 py-1 text-[10px] font-medium text-indigo-300'
                  : 'inline-flex rounded-full border border-cyan-400/15 bg-cyan-500/10 px-2 py-1 text-[10px] font-medium text-cyan-300'
            }
          >
            {area}
          </span>
          <h2 className="mt-3 text-sm font-medium text-zinc-200">
            {title}
          </h2>
          <p className="mt-1 text-xs leading-5 text-zinc-600">
            {description}
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function InstructionList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li key={item} className="flex items-start gap-3">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-white/[0.05] font-mono text-[10px] text-zinc-500">
            {index + 1}
          </span>
          <span className="text-xs leading-5 text-zinc-500">
            {item}
          </span>
        </li>
      ))}
    </ol>
  );
}

function DashboardLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="mt-4 inline-flex h-8 items-center rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-xs font-medium text-zinc-300 hover:bg-white/[0.06] hover:text-white"
    >
      {children}
    </Link>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-xl border border-indigo-400/10 bg-indigo-500/[0.04] px-4 py-3 text-xs leading-5 text-indigo-200/60">
      {children}
    </div>
  );
}

function CodeBlock({
  language,
  code,
}: {
  language: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copied');
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Unable to copy code.');
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#07090f]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="size-3.5 text-zinc-600" />
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-600">
            {language}
          </span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-zinc-600 hover:text-zinc-300"
          onClick={copyCode}
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-400" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      <pre className="overflow-x-auto p-4 text-xs leading-6 text-zinc-400">
        <code>{code}</code>
      </pre>
    </div>
  );
}