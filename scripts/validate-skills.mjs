#!/usr/bin/env node
// Valida la estructura y consistencia de las skills del proyecto.
// Uso: node scripts/validate-skills.mjs [--json]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS_DIR = path.join(ROOT, '.claude', 'skills');
const MIRROR_DIR = path.join(ROOT, '.agent', 'skills');
const JSON_OUT = process.argv.includes('--json');

const REQUIRED_SECTIONS = [
  '## Overview',
  '## When to Use',
  '## When Not to Use',
  '## Mandatory Workflow',
  '## Validation Ladder',
  '## Output Expectations',
  '## References'
];

const errors = [];
const warnings = [];
const fail = msg => errors.push(msg);
const warn = msg => warnings.push(msg);

if (!fs.existsSync(SKILLS_DIR)) {
  console.error(`No existe ${SKILLS_DIR}`);
  process.exit(1);
}

const skillDirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort();

const reportSkills = [];

for (const skillName of skillDirs) {
  const dir = path.join(SKILLS_DIR, skillName);
  const skillFile = path.join(dir, 'SKILL.md');
  const refsDir = path.join(dir, 'references');
  const scriptsDir = path.join(dir, 'scripts');
  const where = `skill "${skillName}"`;

  if (!fs.existsSync(skillFile)) {
    fail(`${where}: falta SKILL.md`);
    continue;
  }

  const src = fs.readFileSync(skillFile, 'utf8');
  const lines = src.split(/\r?\n/).length;
  if (lines > 300) fail(`${where}: SKILL.md tiene ${lines} líneas (máximo 300)`);
  if (src.includes('../')) fail(`${where}: SKILL.md contiene rutas parent-relative ("../")`);

  const frontmatter = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!frontmatter) {
    fail(`${where}: frontmatter YAML ausente o mal delimitado`);
    continue;
  }

  const nameLine = frontmatter[1].match(/^name:\s*(.+)$/m)?.[1]?.trim() || '';
  const descLine = frontmatter[1].match(/^description:\s*(.+)$/m)?.[1]?.trim() || '';
  const name = nameLine.replace(/^["']|["']$/g, '');
  const description = descLine.replace(/^["']|["']$/g, '');

  if (name !== skillName) fail(`${where}: name "${name}" no coincide con la carpeta`);
  if (!descLine) fail(`${where}: falta description`);
  if (descLine && !/^["'].*["']$/.test(descLine)) fail(`${where}: description debe ir entre comillas`);
  if (description.length > 1024) fail(`${where}: description tiene ${description.length} caracteres (máximo 1024)`);
  if (description.length < 40) warn(`${where}: description demasiado corta`);

  for (const section of REQUIRED_SECTIONS) {
    if (!src.includes(section)) fail(`${where}: falta la sección "${section}"`);
  }

  const mentionedRefs = new Set();
  for (const match of src.matchAll(/`references\/([^`]+\.md)`/g)) {
    mentionedRefs.add(match[1]);
    if (!fs.existsSync(path.join(refsDir, match[1]))) {
      fail(`${where}: referencia inexistente references/${match[1]}`);
    }
  }
  if (fs.existsSync(refsDir)) {
    for (const file of fs.readdirSync(refsDir)) {
      if (!file.endsWith('.md')) continue;
      if (!mentionedRefs.has(file)) fail(`${where}: referencia huérfana references/${file}`);
    }
  }

  const mentionedScripts = new Set();
  for (const match of src.matchAll(/`([^`]*?([A-Za-z0-9_-]+\.mjs))`/g)) {
    const file = match[2];
    mentionedScripts.add(file);
    if (!fs.existsSync(path.join(scriptsDir, file))) {
      fail(`${where}: script mencionado pero inexistente scripts/${file}`);
    }
  }
  if (fs.existsSync(scriptsDir)) {
    for (const file of fs.readdirSync(scriptsDir)) {
      if (!file.endsWith('.mjs')) continue;
      if (!mentionedScripts.has(file)) fail(`${where}: script huérfano scripts/${file}`);
    }
  }

  reportSkills.push({
    name: skillName,
    lines,
    references: mentionedRefs.size,
    scripts: mentionedScripts.size
  });
}

// Espejo .agent/skills
if (!fs.existsSync(MIRROR_DIR)) {
  warn('No existe .agent/skills; no se comprobó el espejo');
} else {
  const mirrorDirs = fs.readdirSync(MIRROR_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
  if (mirrorDirs.join('|') !== skillDirs.join('|')) {
    fail('.agent/skills no tiene las mismas carpetas que .claude/skills');
  } else {
    for (const skillName of skillDirs) {
      const source = path.join(SKILLS_DIR, skillName);
      const mirror = path.join(MIRROR_DIR, skillName);
      const sourceFiles = listFiles(source);
      const mirrorFiles = listFiles(mirror);
      if (sourceFiles.join('|') !== mirrorFiles.join('|')) {
        fail(`.agent/skills/${skillName} no tiene los mismos archivos que .claude/skills/${skillName}`);
        continue;
      }
      for (const file of sourceFiles) {
        const a = fs.readFileSync(path.join(source, file));
        const b = fs.readFileSync(path.join(mirror, file));
        if (!a.equals(b)) {
          fail(`.agent/skills/${skillName}/${file} difiere de .claude/skills/${skillName}/${file}`);
        }
      }
    }
  }
}

function listFiles(dir) {
  const out = [];
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      const rel = path.relative(dir, full).replace(/\\/g, '/');
      if (entry.isDirectory()) walk(full);
      else out.push(rel);
    }
  }
  walk(dir);
  return out.sort();
}

const report = {
  ok: errors.length === 0,
  skills: reportSkills,
  errors,
  warnings
};

if (JSON_OUT) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('Validación de skills — Traces of Rust');
  for (const skill of reportSkills) {
    console.log(`  OK ${skill.name}: ${skill.lines} líneas, ${skill.references} referencias, ${skill.scripts} scripts`);
  }
  for (const w of warnings) console.log(`  WARN  ${w}`);
  for (const e of errors) console.log(`  ERROR ${e}`);
  console.log(`\n${reportSkills.length} skill(s), ${errors.length} error(es), ${warnings.length} warning(s).`);
}

process.exit(errors.length === 0 ? 0 : 1);
