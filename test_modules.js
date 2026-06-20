import { extractJsonLd, TypeRouter } from './engine.js';
import * as renderers from './renderers.js';

const mockElement = () => ({
  innerHTML: '',
  textContent: '',
  appendChild: () => {},
  style: {},
  classList: { add: () => {}, remove: () => {}, toggle: () => {} },
  dataset: {},
  querySelector: () => mockElement(),
  querySelectorAll: () => [mockElement()],
  addEventListener: () => {},
  insertBefore: () => {}
});

global.document = {
  getElementById: (id) => mockElement(),
  createElement: () => mockElement()
};
global.window = {};
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};

const testProductGroup = {
  "@context": "https://schema.org",
  "@type": "ProductGroup",
  "name": "Test Product",
  "variesBy": ["https://schema.org/color"],
  "hasVariant": [
    {
      "@type": "Product",
      "color": "Red",
      "offers": { "@type": "Offer", "price": "100", "priceCurrency": "USD", "availability": "https://schema.org/InStock" }
    }
  ]
};

async function runTests() {
  console.log("Testing extractJsonLd...");
  const jsonStr = JSON.stringify(testProductGroup);
  const raw = `<script type="application/ld+json">${jsonStr}</script>`;
  const extracted = extractJsonLd(raw);
  if (extracted && extracted.name === "Test Product") console.log("✅ extractJsonLd passed");

  console.log("Testing TypeRouter...");
  await TypeRouter(testProductGroup, null, renderers);
  console.log("✅ TypeRouter simulation finished");
}

runTests().catch(console.error);
