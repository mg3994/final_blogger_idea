import { engine } from './src/engine.js';
import { renderers } from './src/renderers.js';

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
  createElement: () => mockElement(),
  querySelectorAll: () => [mockElement()]
};
global.window = {};

async function runTests() {
  console.log("Testing engine...");
  const raw = `<script type="application/ld+json">{"@type":"Product","name":"Test"}</script>`;
  const data = engine.extractJsonLd(raw);
  if (data && data.name === "Test") console.log("✅ extractJsonLd passed");

  console.log("Testing renderers...");
  renderers.renderProduct(data, { selected: {} }, null);
  console.log("✅ renderProduct simulation finished");
}

runTests().catch(console.error);
