# Tapirus Cooking

Tapirus Cooking makes healthier versions of tasty meals. It is taste-first and engineered for meal prep.

Primary objectives:
- Higher protein density.
- Lower calories where possible.
- Reheating and freezer stability.

## Contributing / Authoring

Start with the templates in `/template`. Do not invent a new template.

Recipe workflow:
- Copy `/template/dish-name.md` to `/src/content/recipes/<recipe-name>.md` (kebab-case file name).
- Copy `/template/your-name.json` to `/src/content/authors/<author-id>.json`.
- Optional but recommended: place a hero image in `/public/pix` as `.webp` and reference it in the recipe markdown.
- Use tags from `/template/canonical-tags.txt` only (single source of truth).
- Use `/template/recipe-writer.md` as the authoritative recipe-writing prompt/workflow.
- Run `npm run validate:template` to verify template compliance.
- Run `npm run validate:recipes` before committing recipe changes.
- Use `npm run validate:recipes:strict` when you want canonical-tag and strict quantity enforcement.

Non-negotiable recipe requirements (follow the template structure and headings):
- Frontmatter must include `title`, `date` (YYYY-MM-DD), `tags` (array of strings), and `author` (author-id that matches the filename in `/src/content/authors`).
- After frontmatter, include 3 short intro lines (dish, substitutions, design intent) and a short list for Prep time, Cook time, and Servings.
- Hero image line is optional but recommended: `![Alt text](/pix/<filename>.webp)`.
- Use the exact headings `## Ingredients` and `## Directions`; directions must be a numbered list.

Additional required sections:
- Portion definition: the Servings line must define portion count and portion size (example: "Servings: 4 portions (about 350 g each)").
- `## Portioning & Storage` section covering portioning, fridge/freezer guidance, and reheating.
- `## Notes` section for substitutions or tips.
- `## Nutritional Information (Approximate)` section with a Markdown table that includes per portion and per 100 g values.

## Agent Workflow

1. Set system prompt from `template/recipe-writer.md`.
2. Ensure the model can read `template/canonical-tags.txt` and `template/dish-name.md`.
3. Ask whether a hero image should be included and, if yes, ask for the filename in `/public/pix`.
4. Give the model either a base recipe or a structured task brief.
5. Write output directly into `src/content/recipes/<recipe-name>.md`.
6. Run `node scripts/validate-recipe-template.mjs --strict src/content/recipes/<recipe-name>.md` and fix any reported failures.
7. Run `npm run build` to confirm site rendering.

## Managing Canonical Tags

- Add/remove allowed tags only in `template/canonical-tags.txt`.
- Do not duplicate the tag list in prompts or recipes.
- `validate:recipes:strict` reads tags from that file, so changes are picked up automatically.

Author profile requirements:
- `/template/your-name.json` shows the minimal schema; `name` is required.
- Optional fields used by the site include `website`, `website_tor`, `email`, `donate`, `xmr`, `btc`, `eth`.

## Adding a New Author

1. Create `src/content/authors/<author-id>.json` from `template/your-name.json`.
2. Set at least `name`, then add any optional fields you want displayed.
3. In recipes, set frontmatter `author: "<author-id>"` to match that filename exactly.

Example:

```json
{
  "name": "Your Display Name",
  "website": "https://example.com",
  "email": "you@example.com"
}
```

## Local development

```bash
npm ci
npm run dev
npm run build
npm run preview
npm run clean
```
