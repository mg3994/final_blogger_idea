import fs from 'fs';

const template = fs.readFileSync('template.xml', 'utf8');

function validate() {
  console.log("Checking XML structure...");
  if (!template.includes('//<![CDATA[')) throw new Error("Missing CDATA wrapper in script");

  console.log("Checking Logic integration...");
  if (!template.includes('let state = {')) throw new Error("Missing engine logic");
  if (!template.includes('window.CartManager =')) throw new Error("Missing CartManager logic");

  console.log("✅ template.xml validation passed");
}

try {
  validate();
} catch (e) {
  console.error("❌ Validation failed:", e.message);
  process.exit(1);
}
