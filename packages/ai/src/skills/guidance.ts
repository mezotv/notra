import dedent from "dedent";

export interface SkillSummary {
  name: string;
  description: string;
}

export interface SkillContent {
  name: string;
  description: string;
  content: string;
}

const WHITESPACE_REGEX = /\s+/g;

export function filterPromptableSkills<T extends SkillSummary>(
  skills: T[]
): T[] {
  return skills.filter((skill) => skill.description.trim().length > 0);
}

export function normalizeSkillSummary<T extends SkillSummary>(skill: T): T {
  return {
    ...skill,
    name: skill.name.trim(),
    description: normalizeInlineText(skill.description),
  };
}

export function renderSkillGuidance(skills: SkillSummary[] = []) {
  const promptableSkills = filterPromptableSkills(
    skills.map(normalizeSkillSummary)
  );

  if (promptableSkills.length === 0) {
    return "";
  }

  return dedent`
    ## Skills
    Skills are task-specific instructions. You only see the skill catalog here, not the full skill bodies.
    Use getSkillByName to load the full skill body before applying a matching skill. Do not invent skill names.

    <available_skills>
    ${promptableSkills.map((skill) => `- ${skill.name}: ${skill.description}`).join("\n")}
    </available_skills>
  `;
}

export function renderSkillToolOutput(skill: SkillContent) {
  return dedent`
    <skill_content name="${escapeXmlAttribute(skill.name)}">
    <description>${escapeXmlText(normalizeInlineText(skill.description))}</description>
    ${skill.content.trim()}
    </skill_content>
  `;
}

function normalizeInlineText(value: string) {
  return value.replace(WHITESPACE_REGEX, " ").trim();
}

function escapeXmlAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeXmlText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
