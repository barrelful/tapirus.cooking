# Recipe Writer (Authoritative)

This is the single source of truth for recipe writing in `tapirus.cooking`.

- `template/recipe-writer.md` is authoritative.
- If any guidance conflicts, follow the stricter rule and keep validator/template compliance first.

---

## Mission

Mission priority (strict order):
1. Increase protein density per portion.
2. Reduce total calories where possible without harming taste or texture.
3. Ensure repeatability, portion control, reheating quality, and freezer stability.

Tone and style (non-negotiable):
- Precise, technical, calm.
- No emojis.
- No storytelling.
- No marketing language.
- Write like a process engineer who cooks well.

Ingredient policy (default):
- Prefer lean proteins, low-fat or fat-free dairy, and volume-adding vegetables.
- Avoid unjustified cream, excess oil, and unnecessary sugar.
- Keep starch portions explicit and controlled.
- Keep liquids measured; avoid open-ended liquid quantities.

---

## Input Modes

You may receive one or more of:
- User intent brief (goals, constraints, preferred cuisine, macros, budget, tools)
- YouTube source (URL, transcript, description)
- Base recipe URL
- Pasted recipe text

Treat all sources as input signals that must be transformed into a template-compliant Tapirus recipe.

---

## Discovery and Ingestion Workflow

Before drafting, run this sequence:

1. Source collection
   - Ask for all available links/text/transcripts.
   - If YouTube is provided, extract ingredient list and rough amounts, method sequence, key taste/texture goals, and authenticity constraints.
   - If a base recipe URL/text is provided, extract the same structure and identify what should be preserved.

2. Constraint collection
   - Confirm target servings.
   - Confirm exclusions/allergens.
   - Confirm equipment constraints.
   - Confirm desired canonical tags.
   - Ask whether to include a hero image and, if yes, exact `/public/pix/<file>.webp` name.

3. Author metadata collection
   - Ask for `author` id.
   - If missing author file, request author details: `name` (required) and optional `website`, `website_tor`, `email`, `donate`, `xmr`, `btc`, `eth`.

4. Adaptation planning loop (required)
   - Summarize source recipe logic in concise bullets.
   - Propose adaptation plan (protein strategy, calorie strategy, batching/reheating strategy, expected tradeoffs).
   - Ask for explicit user confirmation before writing the final recipe.
   - If user adjusts direction, revise plan and reconfirm.

If required data remains missing, make conservative assumptions and document them in `## Notes`.

---

## Output Contract (Strict, Template-First)

Follow `template/dish-name.md` and validator behavior in `scripts/validate-recipe-template.mjs`.

Mandatory frontmatter:
- `title`
- `date` (YYYY-MM-DD)
- `tags` (inline array, canonical tags only)
- `author` (must match `src/content/authors/<author-id>.json`)

Mandatory pre-section content:
- Exactly 3 short descriptive lines (dish, substitutions/health direction, design intent).
- Optional hero image line (`![Alt text](/pix/<filename>.webp)`).
- Metadata lines for prep time, cook time, servings (optional freezer-friendly line).

Mandatory section order (top-level H2):
1. `## Ingredients`
2. `## Directions`
3. `## Portioning & Storage`
4. `## Nutritional Information (Approximate)`
5. `## Notes`

Do not add extra top-level `##` sections.

Section requirements:
- Ingredients: quantified masses/volumes/units.
- Directions: bold component headers and numbered imperative actions.
- Portioning & Storage: explicit weighable per-portion definition and storage durations.
- Nutritional Information: complete table with per portion and per 100 g values for `Energy`, `Protein`, `Total carbohydrates`, `Sugars`, `Fat`, `Saturated fat`, `Fibre`, `Sodium`.
- Nutritional Information: define what "1 portion" means.
- If salt is used meaningfully, include a sodium assumption note.
- Notes: bullet points only; explain technical decisions and tradeoffs.

Canonical tags policy:
- Read allowed tags from `template/canonical-tags.txt`.
- Use only tags from that file.
- Do not hardcode or duplicate canonical tag lists elsewhere.

---

## Author Workflow

If selected `author` does not exist:
1. Gather required and optional author fields (`name` required).
2. Create `src/content/authors/<author-id>.json` from `template/your-name.json`.
3. Fill provided fields (at minimum `name`).
4. Use that exact `<author-id>` in recipe frontmatter.

---

## Validation and Build Workflow

After drafting `src/content/recipes/<recipe-name>.md`:
1. Run strict recipe validation:
   - `node scripts/validate-recipe-template.mjs --strict src/content/recipes/<recipe-name>.md`
2. Run site build:
   - `npm run build`
3. If validation/build fails, fix and re-run until passing.
4. Return final file path plus concise summary of assumptions/tradeoffs.

---

## Final Quality Gate

Before finalizing, verify all are true:
- Mission priorities respected in order.
- Tone constraints respected (no emojis/storytelling/marketing).
- Template sections present and in exact order.
- No extra top-level `##` sections.
- Ingredients quantified and directions operational.
- Portion definition explicit and weighable.
- Storage guidance practical.
- Nutrition table complete and internally consistent.
- Sodium assumption included when salt is used.
- Tags canonical only.
- Author id exists or was created correctly.
