/**
 * src/engine.js - Defensive Schema.org Engine
 */

export const engine = {
  decodeEntities(text) {
    if (typeof document === 'undefined') return text || '';
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text || '';
    return textArea.value;
  },
  extractJsonLd(sourceText) {
    if (!sourceText) return null;
    try {
      const scriptMatch = String(sourceText).match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
      let jsonStr = scriptMatch ? scriptMatch[1] : sourceText;
      let decoded = this.decodeEntities(jsonStr);
      if (decoded.includes('&quot;')) decoded = this.decodeEntities(decoded);

      const clean = decoded.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1').trim();
      return JSON.parse(clean);
    } catch (e) {
      const block = String(sourceText).match(/\{[\s\S]*\}/);
      if (block) {
        try { return JSON.parse(block[0]); } catch (e2) {}
      }
      return null;
    }
  }
};
