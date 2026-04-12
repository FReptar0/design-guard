/**
 * Lint rule interface for modular output validation.
 *
 * Each rule is independently testable, configurable, and extensible.
 */

import type { CheerioAPI } from 'cheerio';
import type { ValidationIssue } from '../output-validator.js';

export interface LintContext {
  /** The full HTML string being validated */
  html: string;
  /** All CSS from <style> tags and inline styles, concatenated */
  allStyles: string;
  /** All class attribute values, concatenated */
  allClasses: string;
  /** Cheerio instance for DOM querying */
  $: CheerioAPI;
  /** Content of DESIGN.md if available, undefined otherwise */
  designMdContent?: string;
}

export interface LintRule {
  /** Unique identifier for the rule, e.g. 'no-default-fonts' */
  id: string;
  /** Human-readable name */
  name: string;
  /** What the rule checks for */
  description: string;
  /** Default severity */
  severity: 'error' | 'warning' | 'info';
  /** Category for grouping */
  category: 'color' | 'typography' | 'accessibility' | 'slop' | 'structure' | 'content' | 'layout';
  /** If true the rule requires a DESIGN.md to be useful */
  requiresDesign?: boolean;
  /** Run the check and return any issues found */
  check(context: LintContext): ValidationIssue[];
}
