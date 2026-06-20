/**
 * engine.js - Core logic for extracting and routing Schema.org data
 */

export function decodeEntities(text) {
  if (typeof document === 'undefined' || !document.createElement) {
    return (text || "").replace(/&quot;/g, '"')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&amp;/g, '&')
               .replace(/&#39;/g, "'");
  }
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
}

export function extractJsonLd(sourceText) {
  if (!sourceText) return null;

  let jsonStr = "";
  const scriptMatch = sourceText.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (scriptMatch) {
    jsonStr = scriptMatch[1];
  } else {
    jsonStr = sourceText;
  }

  let decoded = decodeEntities(jsonStr);
  if (decoded && decoded.includes('&quot;')) decoded = decodeEntities(decoded);

  if (!decoded) return null;

  try {
    const cleanJson = decoded.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1').trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    const jsonBlock = decoded.match(/\{[\s\S]*\}/);
    if (jsonBlock) {
      try {
        return JSON.parse(jsonBlock[0]);
      } catch (e2) {}
    }
    return null;
  }
}

export async function TypeRouter(data, SchemaTypes, renderers) {
  if (!data || !data['@type']) return;
  const type = data['@type'];
  let hydratedData = data;

  if (SchemaTypes && SchemaTypes[type]) {
    try {
      const validator = SchemaTypes[type];
      if (validator.validate(data)) {
        hydratedData = validator.deserialize(data);
      }
    } catch (e) {
      console.warn("Hydration failed", e);
    }
  }

  if (type === 'ProductGroup' && renderers.renderProductGroup) {
    renderers.renderProductGroup(hydratedData);
  } else if (['Service', 'LocalBusiness', 'ProfessionalService', 'Product', 'Plumber', 'Electrician'].includes(type) && renderers.renderProduct) {
    renderers.renderProduct(hydratedData);
  } else if (renderers.renderGeneric) {
    renderers.renderGeneric(hydratedData);
  }
}
