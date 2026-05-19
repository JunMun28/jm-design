# Micron HTML style selection design

## Goal

Update the `micron-html-slides` skill so new deck requests ask users to select a style when the user has not already named one.

## Selected approach

Use a lightweight chooser only when style is missing or ambiguous.

- If the user names a style, use it directly.
- If the user does not name a style, show the available style list first and ask before building.
- Include an HTML preview link when asking the user to choose.
- Do not require the user to open the preview before deck creation.

## Style list

Show these options:

1. Micron original dark theme
2. Micron dark engineering theme
3. Micron light theme
4. Course module
5. Operational status update

Do not include Open Design landing deck in the user-facing selector.

## Skill changes

Add a `Style Selection` section near the defaults.

Update workflow step 1 to:

- Select requested style directly when clear.
- Otherwise show the style list and ask the user to choose before building.
- Include the `references/style-selector.html` preview link when asking.

Do not apply a default style for unspecified requests. If the user asks the agent to choose after seeing the list, choose the best fit for the content and state the chosen style.

## Reference changes

Keep `references/custom-templates.md` limited to user-facing templates:

- Course module
- Weekly update

Do not catalog `open-design-landing-deck/example.html` for this selector.

Add `references/style-selector.html` as the user-facing style preview page.

## Testing

Verify by reading the updated skill instructions and checking:

- The chooser appears before deck outline/build steps.
- The chooser links to `references/style-selector.html`.
- The selector lists only the five approved styles.
- Direct user style requests still skip the chooser.
- Unspecified style requests stop and ask before building.
- Open Design landing deck is not mentioned in the selector.
