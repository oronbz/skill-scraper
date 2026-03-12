import {
  parseGitHubUrl,
  getRawUrl,
  getApiContentsUrl,
  buildInstallCommand,
  buildBatchInstallCommand,
} from "../utils/github.js";
import { parseSkillMd } from "../utils/skill.js";

// Cache for API responses
const apiCache = new Map();

async function fetchWithCache(url) {
  if (apiCache.has(url)) {
    const cached = apiCache.get(url);
    if (Date.now() - cached.time < 5 * 60 * 1000) {
      return cached.data;
    }
  }
  const resp = await fetch(url);
  if (resp.status === 404) return null;
  if (!resp.ok) throw new Error(`GitHub API error: ${resp.status}`);
  const data = await resp.json();
  apiCache.set(url, { data, time: Date.now() });
  return data;
}

async function fetchRaw(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Fetch error: ${resp.status}`);
  return resp.text();
}

// List all skills in a repo's skills/ directory
async function listSkills(owner, repo, branch, basePath = "skills") {
  const apiUrl = getApiContentsUrl(owner, repo, basePath);
  const entries = await fetchWithCache(apiUrl);
  if (!entries) return [];

  const skills = [];
  for (const entry of entries) {
    if (entry.type === "dir") {
      // Check if this directory has a SKILL.md
      try {
        const subEntries = await fetchWithCache(
          getApiContentsUrl(owner, repo, `${basePath}/${entry.name}`)
        );
        if (!subEntries) continue;
        const hasSkillMd = subEntries.some(
          (e) => e.name === "SKILL.md" && e.type === "file"
        );
        if (hasSkillMd) {
          // Fetch the content to get metadata
          const rawUrl = getRawUrl(
            owner,
            repo,
            branch,
            `${basePath}/${entry.name}/SKILL.md`
          );
          try {
            const content = await fetchRaw(rawUrl);
            const meta = parseSkillMd(content);
            skills.push({
              name: entry.name,
              path: `${basePath}/${entry.name}/SKILL.md`,
              displayName: meta.name || entry.name,
              description: meta.description || "",
            });
          } catch {
            skills.push({
              name: entry.name,
              path: `${basePath}/${entry.name}/SKILL.md`,
              displayName: entry.name,
              description: "",
            });
          }
        }
      } catch {
        // Skip directories we can't read
      }
    }
  }
  return skills;
}

// Handle messages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "PAGE_DETECTED") {
    const tabId = sender.tab?.id;
    if (tabId) {
      chrome.storage.session.set({ [`tab-${tabId}`]: msg });
      chrome.action.setBadgeText({ text: "✦", tabId });
      chrome.action.setBadgeBackgroundColor({ color: "#6366f1", tabId });
    }
    return;
  }

  if (msg.type === "PAGE_CLEARED") {
    const tabId = sender.tab?.id;
    if (tabId) {
      chrome.storage.session.remove(`tab-${tabId}`);
      chrome.action.setBadgeText({ text: "", tabId });
    }
    return;
  }

  if (msg.type === "GET_DETECTION") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) return sendResponse(null);
      chrome.storage.session.get(`tab-${tabId}`, (result) => {
        sendResponse(result[`tab-${tabId}`] || null);
      });
    });
    return true; // async
  }

  if (msg.type === "FETCH_SKILLS") {
    const { owner, repo, branch, basePath } = msg;
    listSkills(owner, repo, branch, basePath || "skills")
      .then((skills) => sendResponse({ skills }))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (msg.type === "FETCH_SKILL_CONTENT") {
    const { owner, repo, branch, path } = msg;
    const rawUrl = getRawUrl(owner, repo, branch, path);
    fetchRaw(rawUrl)
      .then((content) => {
        const meta = parseSkillMd(content);
        sendResponse({ content, ...meta });
      })
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (msg.type === "GET_INSTALL_COMMAND") {
    const { owner, repo, branch, skills } = msg;
    const command = buildBatchInstallCommand(owner, repo, branch, skills);
    sendResponse({ command });
    return;
  }
});

// Clean up session storage when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.session.remove(`tab-${tabId}`);
});
