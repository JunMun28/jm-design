# Use a standalone Micron Icons skill

Micron icon assets will live in a standalone `micron-icons` skill, not inside
`html-slides`. `html-slides` may consume that skill for Micron themes, while
non-Micron themes only use Micron icons when explicitly requested.

The icon skill will extract all clean source assets from the provided archives,
preserve original files without recompression or visual edits, and expose them
through a semantic manifest plus a deterministic finder script. This keeps
`html-slides` focused on deck runtime and theme verification while giving
future agents stable semantic lookup for official Micron iconography.

## Considered Options

- Embed the extracted icons inside `html-slides`. Rejected because it makes a
  multi-theme slide skill own brand-specific asset inventory.
- Expose only raw extracted folders. Rejected because agents would need to
  guess filenames and paths.
- Optimize or convert assets during extraction. Rejected for now because brand
  asset fidelity and auditability matter more than file-size reduction.

## Consequences

- `micron-icons` owns extracted assets, manifest metadata, semantic tags,
  usage rules, and finder tooling.
- `html-slides` only documents how Micron themes may call into `micron-icons`.
- Animated MP4 icons are opt-in motion assets, not default icon candidates.
