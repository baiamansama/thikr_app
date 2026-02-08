/**
 * Non-interactive Vercel diagnostics using the REST API.
 *
 * Requires:
 * - VERCEL_TOKEN (personal access token)
 * Optional:
 * - VERCEL_TEAM_ID (for Team-scoped projects)
 * - VERCEL_PROJECT (project name or id to inspect)
 * - VERCEL_REPO (defaults to baiamansama/thikr_app)
 */

type VercelProject = {
  id: string;
  name: string;
  rootDirectory?: string | null;
  framework?: string | null;
  link?: {
    type?: string;
    repo?: string;
    org?: string;
    repoId?: number;
  } | null;
};

type VercelDomain = {
  name: string;
  apexName?: string;
  redirect?: string | null;
  verified?: boolean;
  primary?: boolean;
};

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing ${name}. Set it in your shell, e.g.:\n` +
        `  export ${name}="..."\n`
    );
  }
  return v;
}

function apiBase(): string {
  return "https://api.vercel.com";
}

function withTeamId(url: URL): URL {
  const teamId = process.env.VERCEL_TEAM_ID;
  if (teamId) url.searchParams.set("teamId", teamId);
  return url;
}

async function vfetch<T>(path: string): Promise<T> {
  const token = requiredEnv("VERCEL_TOKEN");
  const url = withTeamId(new URL(path, apiBase()));
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Vercel API ${res.status} ${res.statusText}: ${text}`);
  }
  return (await res.json()) as T;
}

async function listProjects(): Promise<VercelProject[]> {
  // limit=100 is usually enough; expand if needed.
  const data = await vfetch<{ projects: VercelProject[] }>("/v9/projects?limit=100");
  return data.projects ?? [];
}

function pickProject(projects: VercelProject[]): VercelProject | null {
  const explicit = process.env.VERCEL_PROJECT;
  if (explicit) {
    const byIdOrName = projects.find((p) => p.id === explicit || p.name === explicit);
    if (byIdOrName) return byIdOrName;
  }

  const repo = process.env.VERCEL_REPO ?? "baiamansama/thikr_app";
  const byRepo = projects.find((p) => p.link?.repo === repo);
  if (byRepo) return byRepo;

  const byName = projects.find((p) => p.name === "thikr_app" || p.name === "thikr-app");
  return byName ?? null;
}

async function getProjectDomains(projectId: string): Promise<VercelDomain[]> {
  // Vercel returns `domains` array.
  const data = await vfetch<{ domains: VercelDomain[] }>(`/v9/projects/${projectId}/domains?limit=100`);
  return data.domains ?? [];
}

function formatBool(v: unknown): string {
  if (v === true) return "yes";
  if (v === false) return "no";
  return "unknown";
}

async function main() {
  const projects = await listProjects();
  const project = pickProject(projects);

  if (!project) {
    const repo = process.env.VERCEL_REPO ?? "baiamansama/thikr_app";
    console.log("No matching Vercel project found.");
    console.log(`Checked VERCEL_PROJECT, then repo link (${repo}), then names thikr_app/thikr-app.`);
    console.log("Set VERCEL_PROJECT to your project name in Vercel and re-run.");
    process.exit(2);
  }

  const domains = await getProjectDomains(project.id).catch(() => []);

  console.log("Vercel Project");
  console.log(`- id: ${project.id}`);
  console.log(`- name: ${project.name}`);
  console.log(`- framework: ${project.framework ?? "unknown"}`);
  console.log(`- rootDirectory: ${project.rootDirectory ?? "(not set)"}`);
  console.log(`- git repo: ${project.link?.repo ?? "unknown"}`);

  if (project.rootDirectory && project.rootDirectory !== ".") {
    console.log("");
    console.log("Critical: rootDirectory is set and likely wrong for this repo refactor.");
    console.log(`- Current rootDirectory: ${project.rootDirectory}`);
    console.log("Fix in Vercel Project Settings or via API (I can add a fixer script next).");
  }

  if (domains.length) {
    console.log("");
    console.log("Domains");
    domains
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((d) => {
        console.log(
          `- ${d.name}` +
            (d.primary ? " (primary)" : "") +
            ` verified=${formatBool(d.verified)}` +
            (d.redirect ? ` redirect=${d.redirect}` : "")
        );
      });
  }

  console.log("");
  console.log("Notes");
  console.log("- If builds fail with 'No Next.js version detected', Vercel is reading the wrong Root Directory.");
  console.log("- For auth stability, set NEXT_PUBLIC_SITE_URL in Vercel env to your canonical domain (either https://azkar.link or https://www.azkar.link).");
}

main().catch((err) => {
  console.error(String(err?.message ?? err));
  process.exit(1);
});

