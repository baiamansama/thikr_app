/**
 * Clears a project's Root Directory setting via Vercel REST API.
 *
 * Requires:
 * - VERCEL_TOKEN
 * Optional:
 * - VERCEL_TEAM_ID
 * - VERCEL_PROJECT (project name or id)
 *
 * Usage:
 * - Dry run:  tsx scripts/vercel-fix-root.ts
 * - Apply:    tsx scripts/vercel-fix-root.ts --apply
 */

type VercelProject = {
  id: string;
  name: string;
  rootDirectory?: string | null;
  link?: { repo?: string } | null;
};

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}.`);
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

async function vfetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = requiredEnv("VERCEL_TOKEN");
  const url = withTeamId(new URL(path, apiBase()));
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Vercel API ${res.status} ${res.statusText}: ${text}`);
  }
  return (await res.json()) as T;
}

async function listProjects(): Promise<VercelProject[]> {
  const data = await vfetch<{ projects: VercelProject[] }>("/v9/projects?limit=100");
  return data.projects ?? [];
}

function pickProject(projects: VercelProject[]): VercelProject | null {
  const explicit = process.env.VERCEL_PROJECT;
  if (explicit) {
    return projects.find((p) => p.id === explicit || p.name === explicit) ?? null;
  }
  const repo = process.env.VERCEL_REPO ?? "baiamansama/thikr_app";
  return (
    projects.find((p) => p.link?.repo === repo) ??
    projects.find((p) => p.name === "thikr_app" || p.name === "thikr-app") ??
    null
  );
}

async function patchRootDirectory(projectId: string, rootDirectory: null): Promise<VercelProject> {
  return await vfetch<VercelProject>(`/v9/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify({ rootDirectory }),
  });
}

async function main() {
  const apply = process.argv.includes("--apply");
  const projects = await listProjects();
  const project = pickProject(projects);
  if (!project) {
    console.log("Could not find a matching Vercel project.");
    console.log("Set VERCEL_PROJECT=<name> and re-run.");
    process.exit(2);
  }

  console.log("Target project:");
  console.log(`- id: ${project.id}`);
  console.log(`- name: ${project.name}`);
  console.log(`- current rootDirectory: ${project.rootDirectory ?? "(not set)"}`);

  if (!apply) {
    console.log("");
    console.log("Dry run only. Re-run with --apply to actually clear rootDirectory.");
    return;
  }

  const updated = await patchRootDirectory(project.id, null);
  console.log("");
  console.log("Updated project:");
  console.log(`- rootDirectory: ${updated.rootDirectory ?? "(not set)"}`);
}

main().catch((err) => {
  console.error(String(err?.message ?? err));
  process.exit(1);
});

