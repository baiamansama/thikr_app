/**
 * Creates `.vercel/project.json` non-interactively (so CLI commands work).
 *
 * Requires:
 * - VERCEL_TOKEN
 * Optional:
 * - VERCEL_TEAM_ID (recommended if project is under a Team)
 * - VERCEL_PROJECT (project name or id)
 * - VERCEL_REPO (defaults to baiamansama/thikr_app)
 */

import { mkdirSync, writeFileSync } from "node:fs";

type VercelProject = {
  id: string;
  name: string;
  link?: { repo?: string } | null;
};

type VercelUser = {
  user: { id: string };
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

async function vfetch<T>(path: string): Promise<T> {
  const token = requiredEnv("VERCEL_TOKEN");
  const url = withTeamId(new URL(path, apiBase()));
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
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

async function getOrgId(): Promise<string> {
  const teamId = process.env.VERCEL_TEAM_ID;
  if (teamId) return teamId;
  const me = await vfetch<VercelUser>("/v2/user");
  return me.user.id;
}

async function main() {
  const projects = await listProjects();
  const project = pickProject(projects);
  if (!project) {
    console.log("Could not find a matching Vercel project.");
    console.log("Set VERCEL_PROJECT=<name> and re-run.");
    process.exit(2);
  }

  const orgId = await getOrgId();
  const projectId = project.id;

  mkdirSync(".vercel", { recursive: true });
  writeFileSync(
    ".vercel/project.json",
    JSON.stringify({ orgId, projectId }, null, 2) + "\n",
    "utf8"
  );

  console.log("Linked local repo to Vercel project by writing .vercel/project.json");
  console.log(`- orgId: ${orgId}`);
  console.log(`- projectId: ${projectId}`);
  console.log(`- project name: ${project.name}`);
}

main().catch((err) => {
  console.error(String(err?.message ?? err));
  process.exit(1);
});

