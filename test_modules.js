import { engine } from './engine.js';
import { renderers } from './renderers.js';

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

async function runTests() {
  console.log("Testing engine...");
  const raw = `<script type="application/ld+json">{"@type":"Product","name":"Test"}</script>`;
  const data = engine.extractJsonLd(raw);
  if (data && data.name === "Test") console.log("✅ extractJsonLd passed");

  console.log("Testing renderers...");
  await engine.route(data, null, renderers);
  console.log("✅ route simulation finished");
}

runTests().catch(console.error);
