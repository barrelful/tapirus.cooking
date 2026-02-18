import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const CANONICAL_TAGS_PATH = path.resolve("template/canonical-tags.txt");

const REQUIRED_H2 = [
  "## Ingredients",
  "## Directions",
  "## Portioning & Storage",
  "## Nutritional Information (Approximate)",
  "## Notes",
];

const REQUIRED_NUTRIENTS = [
  "Energy",
  "Protein",
  "Total carbohydrates",
  "Sugars",
  "Fat",
  "Saturated fat",
  "Fibre",
  "Sodium",
];

const args = process.argv.slice(2);
const templateMode = args.includes("--template");
const strictMode = args.includes("--strict");
const paths = args.filter((arg) => arg !== "--template" && arg !== "--strict");
const canonicalTags = await loadCanonicalTags(CANONICAL_TAGS_PATH);

if (!paths.length) {
  console.error("Usage: node scripts/validate-recipe-template.mjs [--template] [--strict] <file-or-dir> [...]");
  process.exit(1);
}

const files = [];
for (const inputPath of paths) {
  const absolute = path.resolve(inputPath);
  const info = await stat(absolute);
  if (info.isDirectory()) {
    files.push(...(await collectMarkdownFiles(absolute)));
  } else if (absolute.endsWith(".md")) {
    files.push(absolute);
  }
}

if (!files.length) {
  console.error("No markdown files found to validate.");
  process.exit(1);
}

let hasErrors = false;

for (const filePath of files) {
  const text = await readFile(filePath, "utf8");
  const errors = validateRecipe(text, { templateMode, strictMode, canonicalTags });
  if (errors.length) {
    hasErrors = true;
    console.log(`\nFAIL ${path.relative(process.cwd(), filePath)}`);
    for (const error of errors) {
      console.log(`  - ${error}`);
    }
  } else {
    console.log(`PASS ${path.relative(process.cwd(), filePath)}`);
  }
}

if (hasErrors) {
  process.exit(1);
}

async function collectMarkdownFiles(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await collectMarkdownFiles(full)));
      continue;
    }
    if (entry.isFile() && full.endsWith(".md")) {
      result.push(full);
    }
  }
  return result;
}

function validateRecipe(text, { templateMode, strictMode, canonicalTags }) {
  const errors = [];
  const frontmatterMatch = text.match(/^---\n([\s\S]*?)\n---\n?/);

  if (!frontmatterMatch) {
    errors.push("Missing YAML front matter.");
    return errors;
  }

  const frontmatter = frontmatterMatch[1];
  const body = text.slice(frontmatterMatch[0].length);
  const bodyLines = body.split(/\r?\n/);

  for (const key of ["title", "date", "tags", "author"]) {
    if (!new RegExp(`^${key}:`, "m").test(frontmatter)) {
      errors.push(`Front matter missing '${key}'.`);
    }
  }

  const dateMatch = frontmatter.match(/^date:\s*(.+)$/m);
  if (!dateMatch) {
    errors.push("Front matter missing date value.");
  } else {
    const value = dateMatch[1].trim();
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
    const validTemplateDate = value === "YYYY-MM-DD";
    if (!validDate && !(templateMode && validTemplateDate)) {
      errors.push("Date must use YYYY-MM-DD format.");
    }
  }

  const tagsMatch = frontmatter.match(/^tags:\s*\[(.*)\]\s*$/m);
  if (!tagsMatch) {
    errors.push("Tags must be an inline array in front matter.");
  } else if (!templateMode && strictMode) {
    const tags = tagsMatch[1]
      .split(",")
      .map((tag) => tag.trim().replace(/^['\"]|['\"]$/g, ""))
      .filter(Boolean);
    for (const tag of tags) {
      if (!canonicalTags.has(tag)) {
        errors.push(`Tag '${tag}' is not in canonical tags.`);
      }
    }
  }

  const h2Lines = bodyLines
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => line.startsWith("## "));

  if (strictMode) {
    if (h2Lines.length !== REQUIRED_H2.length) {
      errors.push("Unexpected number of top-level sections (##). Template requires exactly five.");
    }
    for (let i = 0; i < REQUIRED_H2.length; i += 1) {
      const section = h2Lines[i]?.line;
      if (section !== REQUIRED_H2[i]) {
        errors.push(`Section order mismatch at position ${i + 1}. Expected '${REQUIRED_H2[i]}'.`);
      }
    }
  } else {
    let lastIndex = -1;
    for (const required of REQUIRED_H2) {
      const index = h2Lines.findIndex((entry) => entry.line === required);
      if (index === -1) {
        errors.push(`Missing required section '${required}'.`);
        continue;
      }
      if (index < lastIndex) {
        errors.push(`Required section '${required}' is out of order.`);
      }
      lastIndex = index;
    }
  }

  const metadataIndex = bodyLines.findIndex((line) => /^- 🍽️\s*Servings:/.test(line));
  if (metadataIndex === -1) {
    errors.push("Missing servings metadata line ('- 🍽️ Servings: ...').");
  }
  if (!bodyLines.some((line) => /^- ⏲️\s*Prep time:/.test(line))) {
    errors.push("Missing prep time line.");
  }
  if (!bodyLines.some((line) => /^- 🍳\s*Cook time:/.test(line))) {
    errors.push("Missing cook time line.");
  }

  const firstH2Index = bodyLines.findIndex((line) => line.trim() === "## Ingredients");
  if (firstH2Index > 0) {
    const introLines = bodyLines
      .slice(0, firstH2Index)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("-") && !line.startsWith("<!--") && !line.startsWith("!["));
    if (introLines.length < 3) {
      errors.push("Description should contain three short lines before metadata.");
    }
  }

  const ingredientsBlock = extractBlock(bodyLines, "## Ingredients", "## Directions");
  if (!ingredientsBlock) {
    errors.push("Missing ingredients block.");
  } else if (!templateMode && strictMode) {
    const bulletLines = ingredientsBlock
      .map((line) => line.trim())
      .filter((line) => /^- /.test(line) && !line.includes("adjust to taste"));

    for (const line of bulletLines) {
      const hasNumber = /\d/.test(line);
      if (/to taste|optional/i.test(line)) {
        continue;
      }
      const hasUnit = /\b(g|kg|mL|ml|L|l|tsp|tbsp|cup|cups|unit|units|can|cans|slice|slices|clove|cloves|egg|eggs|tortilla|tortillas)\b/.test(line);
      if (!hasNumber || !hasUnit) {
        errors.push(`Ingredient may be missing explicit quantity/unit: '${line}'`);
      }
    }
  }

  const directionsBlock = extractBlock(bodyLines, "## Directions", "## Portioning & Storage");
  if (!directionsBlock) {
    errors.push("Missing directions block.");
  } else {
    if (!directionsBlock.some((line) => /^(#{1,4}\s*)?\*\*.+\*\*$/.test(line.trim()))) {
      errors.push("Directions should include bold component headers.");
    }
    if (!directionsBlock.some((line) => /^\d+\.\s+/.test(line.trim()))) {
      errors.push("Directions should contain a numbered action list.");
    }
  }

  const portioningBlock = extractBlock(bodyLines, "## Portioning & Storage", "## Nutritional Information (Approximate)");
  if (!portioningBlock) {
    errors.push("Missing Portioning & Storage block.");
  } else {
    const compact = portioningBlock.join("\n");
    if (!compact.includes("Per portion")) {
      errors.push("Portioning block should define per-portion details.");
    }
    if (!compact.includes("Storage")) {
      errors.push("Portioning block should include storage guidance.");
    }
  }

  const nutritionBlock = extractBlock(bodyLines, "## Nutritional Information (Approximate)", "## Notes");
  if (!nutritionBlock) {
    errors.push("Missing Nutritional Information block.");
  } else {
    const nutritionText = nutritionBlock.join("\n");
    if (!/\(1 portion\s*=/.test(nutritionText)) {
      errors.push("Nutrition section must define what '1 portion' means.");
    }

    const labels = [];
    for (const line of nutritionBlock) {
      const rowMatch = line.match(/^\|\s*([^|]+?)\s*\|/);
      if (!rowMatch) {
        continue;
      }
      labels.push(rowMatch[1].trim());
    }

    if (!labels.includes("Nutrient")) {
      errors.push("Nutrition table header row is missing.");
    }

    for (const nutrient of REQUIRED_NUTRIENTS) {
      if (!labels.includes(nutrient)) {
        errors.push(`Nutrition table missing '${nutrient}' row.`);
      }
    }

    const mentionsSalt = /\bsalt\b/i.test(text);
    if (!templateMode && mentionsSalt && !/sodium assumption/i.test(nutritionText)) {
      errors.push("Nutrition section should include sodium assumption when salt is used.");
    }
  }

  const notesBlock = extractBlock(bodyLines, "## Notes", null);
  if (!notesBlock) {
    errors.push("Missing Notes block.");
  } else if (!notesBlock.some((line) => /^-\s+/.test(line.trim()))) {
    errors.push("Notes section should use bullet points only.");
  }

  return errors;
}

function extractBlock(lines, startHeading, endHeading) {
  const startIndex = lines.findIndex((line) => line.trim() === startHeading);
  if (startIndex === -1) {
    return null;
  }
  const endIndex = endHeading
    ? lines.findIndex((line, index) => index > startIndex && line.trim() === endHeading)
    : lines.length;
  if (endIndex === -1) {
    return lines.slice(startIndex + 1);
  }
  return lines.slice(startIndex + 1, endIndex);
}

async function loadCanonicalTags(filePath) {
  const raw = await readFile(filePath, "utf8");
  const tags = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  if (!tags.length) {
    throw new Error(`No canonical tags found in ${filePath}`);
  }

  return new Set(tags);
}
