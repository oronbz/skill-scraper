export function parseSkillMd(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { name: null, description: null, body: content };
  }

  const yaml = match[1];
  const body = match[2];

  const name = yaml.match(/^name:\s*["']?(.+?)["']?\s*$/m)?.[1]?.trim() || null;

  // Description can be a simple single-line or a quoted multi-line value
  let description =
    yaml.match(/^description:\s*["'](.+?)["']\s*$/m)?.[1]?.trim() ||
    yaml.match(/^description:\s*(.+)$/m)?.[1]?.trim() ||
    null;

  return { name, description, body };
}
