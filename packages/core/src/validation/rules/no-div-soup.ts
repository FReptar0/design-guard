import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

const SEMANTIC_ELEMENTS = ['section', 'article', 'nav', 'header', 'footer', 'aside', 'main'];

/**
 * Detects excessive div usage without semantic HTML.
 */
export const noDivSoup: LintRule = {
  id: 'no-div-soup',
  name: 'No Div Soup',
  description: 'Flags excessive div usage relative to semantic HTML elements.',
  severity: 'warning',
  category: 'structure',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { $ } = context;

    const divCount = $('div').length;
    let semanticCount = 0;
    for (const tag of SEMANTIC_ELEMENTS) {
      semanticCount += $(tag).length;
    }

    // Flag if div to semantic ratio exceeds 5:1
    if (semanticCount > 0 && divCount / semanticCount > 5) {
      issues.push({
        type: 'warning',
        category: 'structure',
        message: `Div-to-semantic element ratio is ${divCount}:${semanticCount} (>${5}:1) — use semantic HTML elements.`,
      });
    } else if (semanticCount === 0 && divCount > 5) {
      issues.push({
        type: 'warning',
        category: 'structure',
        message: `${divCount} divs with zero semantic elements — use <section>, <nav>, <header>, <footer>, <main>.`,
      });
    }

    // Flag missing <main> element
    if ($('main').length === 0 && $('body').children().length > 0) {
      issues.push({
        type: 'warning',
        category: 'structure',
        message: 'Missing <main> element — page should have a <main> landmark.',
      });
    }

    return issues;
  },
};
