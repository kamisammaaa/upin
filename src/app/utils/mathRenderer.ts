import katex from 'katex';

/**
 * Unescape common HTML entities that might appear inside LaTeX math formulas.
 */
function cleanMathFormula(formula: string): string {
  return formula
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/<br\s*[\/]?>/gi, ' ')
    .trim();
}

/**
 * Render a single LaTeX formula to HTML string using KaTeX.
 */
export function renderSingleFormula(formula: string, displayMode: boolean = false): string {
  try {
    const cleaned = cleanMathFormula(formula);
    return katex.renderToString(cleaned, {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
    });
  } catch (err) {
    console.error('KaTeX render error:', err);
    return formula;
  }
}

/**
 * Replaces LaTeX math delimiters in an HTML/text string with rendered KaTeX HTML.
 * Supports:
 * - Block math: `$$...$$` and `\[...\]`
 * - Inline math: `$...$` and `\(...\)`
 */
export function renderMathInHtml(html: string | null | undefined): string {
  if (!html || typeof html !== 'string') return '';

  // Fast check: if no math delimiters exist, return as is
  if (!html.includes('$') && !html.includes('\\(') && !html.includes('\\[')) {
    return html;
  }

  let result = html;

  // 1. Process Block Math: `$$...$$`
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_match, equation) => {
    return `<div class="katex-display-wrapper">${renderSingleFormula(equation, true)}</div>`;
  });

  // 2. Process Block Math: `\[...\]`
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_match, equation) => {
    return `<div class="katex-display-wrapper">${renderSingleFormula(equation, true)}</div>`;
  });

  // 3. Process Inline Math: `\(...\)`
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_match, equation) => {
    return renderSingleFormula(equation, false);
  });

  // 4. Process Inline Math: `$...$` (avoid matching empty $$ or lone $)
  // Delimiter must not be preceded or followed immediately by another $, and formula cannot be empty
  result = result.replace(/(^|[^\$])\$([^\$\n\r]+?)\$(?!\$)/g, (_match, prefix, equation) => {
    // Avoid false positives for currency like "$10" or "$ 100" where closing $ is missing or single digit without math operators
    const trimmed = equation.trim();
    if (!trimmed) return _match;
    return `${prefix}${renderSingleFormula(equation, false)}`;
  });

  return result;
}
