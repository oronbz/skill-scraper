// Content script — detects GitHub page type and notifies service worker

function parseCurrentPage() {
  const url = location.href;
  const parts = new URL(url).pathname.split("/").filter(Boolean);

  if (parts.length < 2) return null;

  const result = { owner: parts[0], repo: parts[1], branch: "main" };

  // Repo root
  if (parts.length === 2) {
    // Check if there's a "skills" directory in the file listing
    const hasSkillsDir = checkFileListingFor("skills");
    return {
      ...result,
      pageType: "repo_root",
      path: "",
      hasSkillsDir,
    };
  }

  // Blob (file view)
  if (parts[2] === "blob" && parts.length >= 4) {
    result.branch = parts[3];
    result.path = parts.slice(4).join("/");
    if (result.path.endsWith("SKILL.md")) {
      result.pageType = "skill_file";
      result.skillName = extractSkillName(result.path);
      return result;
    }
    return null;
  }

  // Tree (directory view)
  if (parts[2] === "tree" && parts.length >= 4) {
    result.branch = parts[3];
    result.path = parts.slice(4).join("/");
    result.skillName = extractSkillName(result.path);
    result.pageType = "directory";
    result.hasSkillMd = checkFileListingFor("SKILL.md");
    return result;
  }

  return null;
}

function extractSkillName(path) {
  const cleaned = path.replace(/\/SKILL\.md$/, "");
  const segments = cleaned.split("/").filter(Boolean);
  return segments[segments.length - 1] || null;
}

function checkFileListingFor(filename) {
  // GitHub renders directory contents with links — search for an anchor with the target filename
  const links = document.querySelectorAll(
    'a[href], div[role="rowheader"] a, td.content a'
  );
  for (const link of links) {
    const text = link.textContent.trim();
    if (text === filename) return true;
  }
  return false;
}

function detectAndNotify() {
  const detection = parseCurrentPage();
  if (detection) {
    chrome.runtime.sendMessage({ type: "PAGE_DETECTED", ...detection });
  } else {
    chrome.runtime.sendMessage({ type: "PAGE_CLEARED" });
  }
}

// Also detect the default branch from the DOM branch selector
function detectBranch() {
  // GitHub shows the branch name in various selectors
  const branchButton = document.querySelector(
    '[data-hotkey="w"] span, #branch-select-menu summary span'
  );
  return branchButton?.textContent?.trim() || null;
}

// Run on initial load
detectAndNotify();

// Re-run on SPA navigation (GitHub uses Turbo)
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    // Small delay to let the DOM update after navigation
    setTimeout(detectAndNotify, 500);
  }
}).observe(document.body, { childList: true, subtree: true });
