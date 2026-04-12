export interface WorkflowStep {
  name: string;
  command: string; // CLI command or slash command
  description: string;
  dependsOn?: string;
}

export interface WorkflowPageTemplate {
  type: string;
  name: string;
  prompt: string;
}

export interface WorkflowDefinition {
  name: string;
  description: string;
  pages: WorkflowPageTemplate[];
}

export const WORKFLOWS: Record<string, WorkflowDefinition> = {
  'new-site': {
    name: 'New Website',
    description: 'Create a complete website from scratch',
    pages: [
      { type: 'hero', name: 'Home / Landing', prompt: 'Homepage with hero section, value proposition, and key CTAs' },
      { type: 'about', name: 'About', prompt: 'About page with company story, team, and mission' },
      { type: 'services', name: 'Services/Products', prompt: 'Services or products listing with descriptions and pricing hints' },
      { type: 'contact', name: 'Contact', prompt: 'Contact page with form, location map placeholder, and business hours' },
    ],
  },
  'redesign': {
    name: 'Website Redesign',
    description: 'Redesign an existing website with improved design quality',
    pages: [
      { type: 'hero', name: 'Home (Redesigned)', prompt: 'Redesigned homepage maintaining brand identity but modernizing layout and UX' },
      { type: 'key-page', name: 'Key Page (Redesigned)', prompt: 'Redesigned version of the most important inner page' },
    ],
  },
  'landing': {
    name: 'Landing Page',
    description: 'Create a single high-conversion landing page',
    pages: [
      { type: 'landing', name: 'Landing Page', prompt: 'Single-page landing with hero, features, social proof, pricing, and CTA sections' },
    ],
  },
};

export const WORKFLOW_TYPES = Object.keys(WORKFLOWS);

/** Legacy step-based workflows, kept for backward compat with dg tui */
export const WORKFLOW_REDESIGN: WorkflowStep[] = [
  { name: 'design', command: 'dg design', description: 'Define brand identity and design tokens -> Write DESIGN.md' },
  { name: 'import', command: 'manual', description: 'Import DESIGN.md into Stitch project (manual step in Stitch UI)' },
  { name: 'homepage', command: 'dg generate', description: 'Generate homepage first (establishes visual language)', dependsOn: 'import' },
  { name: 'refine-home', command: 'dg generate', description: 'Refine homepage with 3-5 incremental prompts', dependsOn: 'homepage' },
  { name: 'internal-pages', command: 'dg generate', description: 'Generate internal pages one at a time, referencing homepage style', dependsOn: 'refine-home' },
  { name: 'sync', command: 'dg sync', description: 'Sync all screens to local', dependsOn: 'internal-pages' },
  { name: 'build', command: 'dg build --auto', description: 'Build Astro site from screens', dependsOn: 'sync' },
];

export const WORKFLOW_NEW_APP: WorkflowStep[] = [
  { name: 'brainstorm', command: 'dg generate', description: 'Start with high-level prompt to brainstorm direction' },
  { name: 'pick-direction', command: 'manual', description: 'Pick best direction from brainstorm output' },
  { name: 'drill-screens', command: 'dg generate', description: 'Generate screens one by one from chosen direction', dependsOn: 'pick-direction' },
  { name: 'extract-design', command: 'dg sync', description: 'Extract DESIGN.md from established screens (Stitch auto-generates)', dependsOn: 'drill-screens' },
  { name: 'remaining-screens', command: 'dg generate', description: 'Use DESIGN.md for remaining screens', dependsOn: 'extract-design' },
  { name: 'build', command: 'dg build --auto', description: 'Build site from all screens', dependsOn: 'remaining-screens' },
];

export function getWorkflow(type: 'redesign' | 'new-app'): WorkflowStep[] {
  return type === 'redesign' ? WORKFLOW_REDESIGN : WORKFLOW_NEW_APP;
}
