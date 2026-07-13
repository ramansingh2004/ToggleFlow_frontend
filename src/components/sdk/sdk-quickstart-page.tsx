'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Copy,
  KeyRound,
  Server,
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
  environment: `TOGGLEFLOW_API_URL=${apiUrl}
TOGGLEFLOW_API_KEY=tf_live_your_api_key`,

  curl: `curl --get "$TOGGLEFLOW_API_URL/sdk/flags" \\
  --data-urlencode "userId=user_123" \\
  --header "Authorization: Bearer $TOGGLEFLOW_API_KEY"`,

  javascript: `const apiUrl = process.env.TOGGLEFLOW_API_URL;
const apiKey = process.env.TOGGLEFLOW_API_KEY;

export async function getFeatureFlags(userId) {
  const url = new URL(\`\${apiUrl}/sdk/flags\`);
  url.searchParams.set("userId", userId);

  const response = await fetch(url, {
    headers: {
      Authorization: \`Bearer \${apiKey}\`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      \`ToggleFlow request failed: \${response.status}\`
    );
  }

  const result = await response.json();
  return result.data;
}`,

  singleFlag: `const url = new URL(
  \`\${process.env.TOGGLEFLOW_API_URL}/sdk/flags/dark_mode\`
);

url.searchParams.set("userId", "user_123");

const response = await fetch(url, {
  headers: {
    Authorization: \`Bearer \${process.env.TOGGLEFLOW_API_KEY}\`,
  },
});

const result = await response.json();

if (result.data.enabled) {
  // Render the new experience
}`,

  response: `{
  "success": true,
  "data": {
    "dark_mode": true,
    "new_dashboard": false
  },
  "message": "Flags retrieved"
}`,
};

export function SdkQuickstartPage() {
  return (
    <main className="p-5 sm:p-7 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-indigo-300">
              Developer integration
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">
              SDK quickstart
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
              Evaluate ToggleFlow flags from your server using
              an API key and a stable application-user
              identifier.
            </p>
          </div>

          <Link
            href="/api-keys"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 text-sm font-medium text-white hover:bg-indigo-400"
          >
            <KeyRound className="size-4" />
            Manage API keys
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <ConceptCard
            number="01"
            icon={KeyRound}
            title="Authenticate"
            description="Send a project API key in the Bearer authorization header."
          />

          <ConceptCard
            number="02"
            icon={UserRound}
            title="Identify"
            description="Provide the same userId for the same application user."
          />

          <ConceptCard
            number="03"
            icon={Server}
            title="Evaluate"
            description="Read evaluated boolean flags from your trusted server."
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_280px]">
          <div className="space-y-6">
            <GuideSection
              number="1"
              title="Configure environment variables"
              description="Store the API URL and secret key in your server environment."
            >
              <CodeBlock
                language=".env"
                code={examples.environment}
              />
            </GuideSection>

            <GuideSection
              number="2"
              title="Evaluate flags"
              description="Use a stable user identifier so percentage rollout assignment remains deterministic."
            >
              <CodeBlock
                language="cURL"
                code={examples.curl}
              />

              <div className="mt-4">
                <CodeBlock
                  language="JavaScript"
                  code={examples.javascript}
                />
              </div>
            </GuideSection>

            <GuideSection
              number="3"
              title="Evaluate one flag"
              description="Fetch one flag when your application does not need the complete flag map."
            >
              <CodeBlock
                language="JavaScript"
                code={examples.singleFlag}
              />
            </GuideSection>

            <GuideSection
              number="4"
              title="Handle the response"
              description="The data object maps flag keys to their evaluated boolean value."
            >
              <CodeBlock
                language="JSON"
                code={examples.response}
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
                Never place a ToggleFlow API key in browser
                JavaScript or a variable prefixed with
                NEXT_PUBLIC_. Anyone could extract and reuse
                it.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <h2 className="text-sm font-medium text-zinc-200">
                API endpoint
              </h2>

              <code className="mt-3 block break-all rounded-lg bg-black/30 p-3 text-[11px] leading-5 text-cyan-300">
                {apiUrl}
              </code>

              <p className="mt-3 text-xs leading-5 text-zinc-600">
                Local development uses port 5000. Change
                NEXT_PUBLIC_API_URL when deploying the control
                panel.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <h2 className="text-sm font-medium text-zinc-200">
                Rollout identity
              </h2>

              <p className="mt-3 text-xs leading-5 text-zinc-600">
                The userId does not need to be a ToggleFlow
                account ID. Use your application&apos;s stable,
                non-sensitive user identifier.
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
  icon: React.ComponentType<{
    className?: string;
  }>;
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
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
      <div className="flex items-start gap-4 border-b border-white/[0.07] p-5">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-indigo-400/15 bg-indigo-500/10 font-mono text-xs text-indigo-300">
          {number}
        </div>

        <div>
          <h2 className="text-sm font-medium text-zinc-200">
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

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
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