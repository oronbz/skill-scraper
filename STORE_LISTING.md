# Chrome Web Store Listing

## Store Listing

### Name
Skill Scraper — Claude Code Skill Installer

### Summary (132 char max)
Detect and install Claude Code skills from GitHub repos with one click. Copies a ready-to-run install command to your clipboard.

### Description
Skill Scraper makes it effortless to discover and install Claude Code skills directly from GitHub.

HOW IT WORKS
1. Browse any GitHub repo containing SKILL.md files
2. Click the extension icon — detected skills appear instantly
3. Hit "Copy Install Command" and paste it in your terminal
4. Done — the skill is installed to ~/.claude/skills/

SUPPORTED PAGES
• Direct SKILL.md file pages — install a single skill
• Skill directories — detects SKILL.md automatically
• Repo root — lists all available skills with checkboxes for batch install

FEATURES
• Auto-detects skills on GitHub pages
• Shows skill name and description from YAML frontmatter
• Batch install — select multiple skills and get one command
• No authentication required for public repos
• Dark themed popup UI
• Zero dependencies, lightweight

WHAT ARE CLAUDE CODE SKILLS?
Skills are markdown instruction files that extend Claude Code's capabilities. Each skill is a SKILL.md file installed to ~/.claude/skills/ that teaches Claude Code new behaviors, workflows, and domain expertise.

PRIVACY
This extension only activates on github.com pages. It reads GitHub page URLs and fetches public file contents from the GitHub API. No data is collected, stored, or sent to any third party.

### Category
Developer Tools

### Language
English

---

## Privacy

### Single purpose description
Detects Claude Code skill files (SKILL.md) on GitHub pages and generates clipboard install commands.

### Permission justifications

| Permission | Justification |
|---|---|
| `activeTab` | Read the current GitHub page URL to detect skill files |
| `clipboardWrite` | Copy the install command to the user's clipboard |
| `storage` | Cache detected skills per tab for the popup to display |
| `host_permissions: github.com` | Detect skill files on GitHub pages |
| `host_permissions: raw.githubusercontent.com` | Fetch raw SKILL.md file contents |
| `host_permissions: api.github.com` | List directory contents to discover available skills |

### Data use disclosures
- Does NOT collect personally identifiable information
- Does NOT collect health information
- Does NOT collect financial information
- Does NOT collect authentication information
- Does NOT collect personal communications
- Does NOT collect location data
- Does NOT collect web history
- Does NOT collect user activity
- Does NOT collect website content

---

## Graphics Needed

| Asset | Size | What to show |
|---|---|---|
| Screenshot 1 | 1280x800 | The popup showing a single detected skill on a SKILL.md page |
| Screenshot 2 | 1280x800 | The popup showing multi-skill checklist on a repo root |
| Screenshot 3 | 1280x800 | The "Command copied!" success state |
| Small promo tile | 440x280 | Logo + "Skill Scraper" + tagline |
| Marquee (optional) | 1400x560 | Wider banner version |
