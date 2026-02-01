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
- Place images in `/public/pix` as `.webp`.

Non-negotiable recipe requirements (follow the template structure and headings):
- Frontmatter must include `title`, `date` (YYYY-MM-DD), `tags` (array of strings), and `author` (author-id that matches the filename in `/src/content/authors`).
- After frontmatter, include a 1-2 sentence intro, a hero image with alt text, and a short list for Prep time, Cook time, and Servings.
- Use the exact headings `## Ingredients` and `## Directions`; directions must be a numbered list.

Additional required sections:
- Portion definition: the Servings line must define portion count and portion size (example: "Servings: 4 portions (about 350 g each)").
- `## Portioning & Storage` section covering portioning, fridge/freezer guidance, and reheating.
- `## Notes` section for substitutions or tips.
- `## Nutrition` section with a Markdown table that includes per portion and per 100g values.

Author profile requirements:
- `/template/your-name.json` shows the minimal schema; `name` is required.
- Optional fields used by the site include `website`, `website_tor`, `email`, `donate`, `xmr`, `btc`, `eth`.

## Local development

```bash
npm ci
npm run dev
npm run build
npm run preview
npm run clean
```
