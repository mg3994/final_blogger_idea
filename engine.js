/**
 * engine.js - High-fidelity Schema.org Engine for Blogger
 */

export const engine = {
  decodeEntities(text) {
    if (typeof document === 'undefined' || !document.createElement) {
       return (text || "").replace(/&quot;/g, '"')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&amp;/g, '&')
               .replace(/&#39;/g, "'");
    }
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text || '';
    return textArea.value;
  },
  extractJsonLd(sourceText) {
    if (!sourceText) return null;
    const scriptMatch = String(sourceText).match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    let jsonStr = scriptMatch ? scriptMatch[1] : sourceText;
    let decoded = this.decodeEntities(jsonStr);
    if (decoded && decoded.includes('&quot;')) decoded = this.decodeEntities(decoded);
    try {
      const cleanJson = (decoded || "").replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      const jsonBlock = (decoded || "").match(/\{[\s\S]*\}/);
      if (jsonBlock) try { return JSON.parse(jsonBlock[0]); } catch (e2) {}
      return null;
    }
  },
  async route(data, SchemaTypes, renderers) {
    if (!data || !data['@type']) return;
    const type = data['@type'];
    let hydrated = data;
    if (SchemaTypes && SchemaTypes[type]) {
      try { if (SchemaTypes[type].validate(data)) hydrated = SchemaTypes[type].deserialize(data); } catch(e) {}
    }
    if (type === 'ProductGroup') renderers.productGroup(hydrated);
    else if (['Product', 'Service', 'LocalBusiness', 'ProfessionalService'].includes(type)) renderers.product(hydrated);
    else renderers.generic(hydrated);
  }
};
