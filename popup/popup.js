const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

let detectedSkills = [];

function showState(id) {
  $$(".state").forEach((el) => el.classList.add("hidden"));
  $(`#${id}`).classList.remove("hidden");
}

function showStatus(msg, type = "success") {
  const el = $("#status");
  el.textContent = msg;
  el.className = `status ${type}`;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 3000);
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showStatus("Command copied to clipboard!");
  } catch {
    showStatus("Failed to copy", "error");
  }
}

function getSelectedSkills() {
  const checkboxes = $$("#skills-list input[type='checkbox']:checked");
  return Array.from(checkboxes).map((cb) => {
    const idx = parseInt(cb.dataset.index);
    return detectedSkills[idx];
  });
}

function updateMultiButton() {
  const selected = getSelectedSkills();
  const btn = $("#copy-multi");
  btn.textContent = `Copy Install Command (${selected.length})`;
  btn.disabled = selected.length === 0;
}

function renderSkillsList(skills) {
  const list = $("#skills-list");
  list.innerHTML = "";
  skills.forEach((skill, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <input type="checkbox" checked data-index="${i}">
      <div class="skill-item-info">
        <span class="skill-item-name">${skill.displayName || skill.name}</span>
        ${skill.description ? `<span class="skill-item-desc" title="${skill.description}">${skill.description}</span>` : ""}
      </div>
    `;
    li.addEventListener("click", (e) => {
      if (e.target.tagName !== "INPUT") {
        const cb = li.querySelector("input");
        cb.checked = !cb.checked;
      }
      updateMultiButton();
    });
    list.appendChild(li);
  });
  updateMultiButton();
}

async function init() {
  // Get detection from service worker
  const detection = await chrome.runtime.sendMessage({ type: "GET_DETECTION" });

  if (!detection) {
    showState("no-skills");
    return;
  }

  const { pageType, owner, repo, branch, path, skillName } = detection;

  if (pageType === "skill_file") {
    // Single skill — fetch its content for metadata
    showState("single-skill");
    $("#skill-name").textContent = skillName;
    $("#skill-source").textContent = `${owner}/${repo}`;

    try {
      const meta = await chrome.runtime.sendMessage({
        type: "FETCH_SKILL_CONTENT",
        owner,
        repo,
        branch,
        path,
      });
      if (meta.name) $("#skill-name").textContent = meta.name;
      if (meta.description) {
        $("#skill-description").textContent = meta.description;
        $("#skill-description").classList.remove("hidden");
      }
    } catch {
      // Metadata fetch failed, keep using skillName from URL
    }

    $("#copy-single").addEventListener("click", () => {
      const resp = chrome.runtime.sendMessage({
        type: "GET_INSTALL_COMMAND",
        owner,
        repo,
        branch,
        skills: [{ name: skillName, path }],
      });
      resp.then((r) => copyToClipboard(r.command));
    });
    return;
  }

  if (pageType === "directory" && detection.hasSkillMd) {
    // Single skill from directory
    const skillPath = path.endsWith("/")
      ? `${path}SKILL.md`
      : `${path}/SKILL.md`;

    showState("single-skill");
    $("#skill-name").textContent = skillName;
    $("#skill-source").textContent = `${owner}/${repo}`;

    try {
      const meta = await chrome.runtime.sendMessage({
        type: "FETCH_SKILL_CONTENT",
        owner,
        repo,
        branch,
        path: skillPath,
      });
      if (meta.name) $("#skill-name").textContent = meta.name;
      if (meta.description) {
        $("#skill-description").textContent = meta.description;
      }
    } catch {
      // Keep URL-based name
    }

    $("#copy-single").addEventListener("click", () => {
      chrome.runtime
        .sendMessage({
          type: "GET_INSTALL_COMMAND",
          owner,
          repo,
          branch,
          skills: [{ name: skillName, path: skillPath }],
        })
        .then((r) => copyToClipboard(r.command));
    });
    return;
  }

  if (pageType === "repo_root" || pageType === "directory") {
    // Multiple skills — fetch list
    showState("loading");

    try {
      // For directory pages without SKILL.md, treat the path as the skills base
      const basePath =
        pageType === "directory" ? path : "skills";

      const result = await chrome.runtime.sendMessage({
        type: "FETCH_SKILLS",
        owner,
        repo,
        branch,
        basePath,
      });

      if (result.error) {
        showState("no-skills");
        showStatus(result.error, "error");
        return;
      }

      detectedSkills = result.skills;

      if (detectedSkills.length === 0) {
        showState("no-skills");
        return;
      }

      showState("multi-skills");
      $("#skills-count").textContent = detectedSkills.length;
      $("#multi-source").textContent = `${owner}/${repo}`;
      renderSkillsList(detectedSkills);
    } catch (err) {
      showState("no-skills");
      showStatus(err.message, "error");
    }

    return;
  }

  showState("no-skills");
}

// Event listeners
document.addEventListener("DOMContentLoaded", init);

$("#select-all")?.addEventListener("click", () => {
  $$("#skills-list input[type='checkbox']").forEach((cb) => (cb.checked = true));
  updateMultiButton();
});

$("#select-none")?.addEventListener("click", () => {
  $$("#skills-list input[type='checkbox']").forEach(
    (cb) => (cb.checked = false)
  );
  updateMultiButton();
});

$("#copy-multi")?.addEventListener("click", () => {
  const selected = getSelectedSkills();
  if (selected.length === 0) return;

  // Get detection info to build command
  chrome.runtime.sendMessage({ type: "GET_DETECTION" }, (detection) => {
    if (!detection) return;
    chrome.runtime
      .sendMessage({
        type: "GET_INSTALL_COMMAND",
        owner: detection.owner,
        repo: detection.repo,
        branch: detection.branch,
        skills: selected,
      })
      .then((r) => copyToClipboard(r.command));
  });
});
