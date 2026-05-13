# Micron HTML style selection design

## Goal

Update the `micron-html-slides` skill so new deck requests start by selecting a style when the user has not already named one.

## Selected approach

Use a lightweight chooser only when style is missing or ambiguous.

- If the user names a style, use it directly.
- If the user does not name a style, show the available style list first.
- Include an optional HTML preview link for users who have not seen the templates before.
- Do not require preview before deck creation.

## Style list

Show these options:

1. Micron original dark theme
2. Micron dark engineering theme
3. Micron light theme
4. Course module
5. Weekly update

Do not include Open Design landing deck in the user-facing selector.

## Skill changes

Add a `Style Selection` section near the defaults.

Update workflow step 1 to:

- Select requested style directly when clear.
- Otherwise show the style list and ask the user to choose.
- Offer an optional preview HTML link if the user has not seen the templates before.

Keep existing default behavior after selection: Micron dark engineering remains the fallback style if a user asks the agent to proceed without choosing.

## Reference changes

Keep `references/custom-templates.md` limited to user-facing templates:

- Course module
- Weekly update

Do not catalog `open-design-landing-deck/example.html` for this selector.

## Testing

Verify by reading the updated skill instructions and checking:

- The chooser appears before deck outline/build steps.
- The selector lists only the five approved styles.
- Direct user style requests still skip the chooser.
- Open Design landing deck is not mentioned in the selector.
