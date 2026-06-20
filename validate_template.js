import fs from 'fs';

const template = fs.readFileSync('template.xml', 'utf8');

function validate() {
  console.log("Checking XML structure...");
  if (!template.includes('//<![CDATA[')) throw new Error("Missing CDATA wrapper in script");
  if (!template.includes('//]]>')) throw new Error("Missing CDATA closing in script");

  console.log("Checking Logic integration...");
  if (!template.includes('const engine =')) throw new Error("Missing engine logic");
  if (!template.includes('const renderers =')) throw new Error("Missing renderers logic");

  console.log("✅ template.xml validation passed");
}

try {
  validate();
} catch (e) {
  console.error("❌ Validation failed:", e.message);
  process.exit(1);
}
