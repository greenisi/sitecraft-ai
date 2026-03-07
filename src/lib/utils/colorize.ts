/**
 * Shared syntax highlighting utility for code streaming displays.
 * Converts raw code text into HTML with inline color styles.
 *
 * Handles: HTML escaping, strings, keywords, JSX components/elements,
 * comments, numbers, and function calls.
 */
export function colorize(code: string): string {
  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Strings (single, double, template literals)
  html = html.replace(
    /(["'`])(?:(?!\1)[\\\s\S])*?\1/g,
    '<span style="color:#a5d6ff">$&</span>'
  );

  // Keywords
  html = html.replace(
    /\b(import|export|from|const|let|var|function|return|if|else|default|async|await|new|class|extends|interface|type|typeof|as|of|in|for|while|switch|case|break|continue|try|catch|throw|finally|null|undefined|true|false|this|super|void|static)\b/g,
    '<span style="color:#ff7b72">$&</span>'
  );

  // JSX components (uppercase start, e.g. <Hero, </Layout)
  html = html.replace(
    /(&lt;\/?)([A-Z][a-zA-Z0-9]*)/g,
    '$1<span style="color:#7ee787">$2</span>'
  );

  // JSX/HTML elements (lowercase, e.g. <div, </section)
  html = html.replace(
    /(&lt;\/?)([a-z][a-zA-Z0-9-]*)/g,
    '$1<span style="color:#79c0ff">$2</span>'
  );

  // Single-line comments
  html = html.replace(
    /(\/{2}.*)/gm,
    '<span style="color:#8b949e;font-style:italic">$1</span>'
  );

  // Numbers
  html = html.replace(
    /\b(\d+\.?\d*)\b/g,
    '<span style="color:#f0883e">$&</span>'
  );

  // Function calls (word followed by parenthesis)
  html = html.replace(
    /([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\()/g,
    '<span style="color:#d2a8ff">$1</span>'
  );

  return html;
}
