/**
 * engine.js - High-fidelity Schema Engine for Blogger
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
    const scriptMatch = sourceText.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    let jsonStr = scriptMatch ? scriptMatch[1] : sourceText;
    let decoded = this.decodeEntities(jsonStr);
    if (decoded.includes('&quot;')) decoded = this.decodeEntities(decoded);
    try {
      const cleanJson = (decoded || "").replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      const jsonBlock = decoded.match(/\{[\s\S]*\}/);
      if (jsonBlock) try { return JSON.parse(jsonBlock[0]); } catch (e2) {}
      return null;
    }
  }
};
