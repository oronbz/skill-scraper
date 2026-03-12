export function parseGitHubUrl(url) {
  let urlObj;
  try {
    urlObj = new URL(url);
  } catch {
    return null;
  }

  if (urlObj.hostname !== "github.com") return null;

  const parts = urlObj.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const result = { owner: parts[0], repo: parts[1], branch: "main" };

  // Repo root: github.com/{owner}/{repo}
  if (parts.length === 2) {
    result.pageType = "repo_root";
    result.path = "";
    return result;
  }

  // Blob (file view): github.com/{owner}/{repo}/blob/{branch}/...
  if (parts[2] === "blob" && parts.length >= 4) {
    result.branch = parts[3];
    result.path = parts.slice(4).join("/");
    result.pageType = result.path.endsWith("SKILL.md")
      ? "skill_file"
      : "other";
    result.skillName = extractSkillName(result.path);
    return result;
  }

  // Tree (directory view): github.com/{owner}/{repo}/tree/{branch}/...
  if (parts[2] === "tree" && parts.length >= 4) {
    result.branch = parts[3];
    result.path = parts.slice(4).join("/");
    result.pageType = "directory";
    result.skillName = extractSkillName(result.path);
    return result;
  }

  return null;
}

export function extractSkillName(path) {
  const cleaned = path.replace(/\/SKILL\.md$/, "");
  const segments = cleaned.split("/").filter(Boolean);
  return segments[segments.length - 1] || null;
}

export function getRawUrl(owner, repo, branch, path) {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

export function getApiContentsUrl(owner, repo, path) {
  return `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
}

export function buildInstallCommand(owner, repo, branch, skillName, skillPath) {
  const rawUrl = getRawUrl(owner, repo, branch, skillPath);
  return `mkdir -p ~/.claude/skills/${skillName} && curl -sL "${rawUrl}" > ~/.claude/skills/${skillName}/SKILL.md`;
}

export function buildBatchInstallCommand(owner, repo, branch, skills) {
  if (skills.length === 1) {
    return buildInstallCommand(
      owner,
      repo,
      branch,
      skills[0].name,
      skills[0].path
    );
  }
  const base = getRawUrl(owner, repo, branch, "");
  const lines = skills.map((s) => {
    const rawUrl = `${base}${s.path}`;
    return `mkdir -p ~/.claude/skills/${s.name} && curl -sL "${rawUrl}" > ~/.claude/skills/${s.name}/SKILL.md && echo "Installed ${s.name}"`;
  });
  return lines.join(" && \\\n");
}
