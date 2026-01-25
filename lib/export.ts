import { Project, getOverlapChips } from './types';

// ============================================
// Markdown Export
// ============================================

export function generateConceptMarkdown(project: Project): string {
  const lines: string[] = [];
  
  lines.push(`# ${project.finalTitle || 'Untitled Game Concept'}`);
  lines.push('');
  lines.push(`*Generated on ${new Date().toLocaleDateString()}*`);
  lines.push('');
  
  // Context
  lines.push('## Context');
  lines.push('');
  if (project.platform) lines.push(`- **Platform:** ${project.platform}`);
  if (project.teamSize) lines.push(`- **Team Size:** ${project.teamSize}`);
  if (project.timeHorizon) lines.push(`- **Timeline:** ${project.timeHorizon}`);
  lines.push('');
  
  // Concept
  lines.push('## Concept');
  lines.push('');
  lines.push(project.finalConcept || '*No concept written yet.*');
  lines.push('');
  
  // If structured idea exists
  if (project.structuredIdea) {
    lines.push('## Core Elements');
    lines.push('');
    if (project.structuredIdea.coreVerbs.length > 0) {
      lines.push(`**Core Verbs:** ${project.structuredIdea.coreVerbs.join(', ')}`);
    }
    if (project.structuredIdea.loopHook) {
      lines.push(`**Core Loop:** ${project.structuredIdea.loopHook}`);
    }
    lines.push('');
  }
  
  // If selected spark exists
  if (project.selectedSpark) {
    lines.push('## Selected Spark');
    lines.push('');
    lines.push(`**${project.selectedSpark.title}**`);
    lines.push('');
    lines.push(project.selectedSpark.hook);
    lines.push('');
    lines.push(`- **Core Loop:** ${project.selectedSpark.coreLoop}`);
    lines.push(`- **Unique Mechanic:** ${project.selectedSpark.uniqueMechanic}`);
    lines.push(`- **Win/Lose:** ${project.selectedSpark.winLoseCondition}`);
    lines.push(`- **Platform:** ${project.selectedSpark.targetPlatform}`);
    lines.push(`- **Scope:** ${project.selectedSpark.scopeLevel}`);
    if (project.selectedSpark.whyFun?.length > 0) {
      lines.push('');
      lines.push('**Why It\'s Fun:**');
      project.selectedSpark.whyFun.forEach(reason => {
        lines.push(`- ${reason}`);
      });
    }
    if (project.selectedSpark.prototypePlan) {
      lines.push('');
      lines.push(`**Prototype Plan:** ${project.selectedSpark.prototypePlan}`);
    }
    lines.push('');
  }
  
  // Ikigai summary
  const overlapChips = getOverlapChips(project.ikigai.chips);
  if (overlapChips.length > 0) {
    lines.push('## Ikigai Overlaps');
    lines.push('');
    lines.push('These elements span multiple categories:');
    lines.push('');
    overlapChips.forEach(chip => {
      lines.push(`- ${chip.text} *(${chip.categories.join(', ')})*`);
    });
    lines.push('');
  }
  
  // Vibes
  if (project.vibeChips.length > 0) {
    lines.push('## Vibes');
    lines.push('');
    lines.push(project.vibeChips.join(', '));
    lines.push('');
  }
  
  lines.push('---');
  lines.push('');
  lines.push('*Created with Artify — CREATE*');
  
  return lines.join('\n');
}

// ============================================
// JSON Export
// ============================================

export function exportProjectJSON(project: Project): void {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadFile(blob, `${sanitizeFilename(project.finalTitle || 'concept')}.json`);
}

export function exportConceptMarkdown(project: Project): void {
  const markdown = generateConceptMarkdown(project);
  const blob = new Blob([markdown], { type: 'text/markdown' });
  downloadFile(blob, `${sanitizeFilename(project.finalTitle || 'concept')}.md`);
}

// ============================================
// Helpers
// ============================================

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'concept';
}

function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
