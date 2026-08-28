# Terminal Recall visual system

## Direction

**Risograph tactile collage.** Terminal Recall keeps fragments that would otherwise
disappear, so the site treats output as a saved paper trail: torn dark command
strips, offset ink, highlighter marks, and a small evidence folder. It should feel
like an operator's annotated incident notebook rather than a glossy dashboard.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#17211e` | dark pine text and terminal ground |
| `--paper` | `#f6f0df` | warm recycled-paper page |
| `--cream` | `#fffaf0` | raised paper surfaces |
| `--coral` | `#d84b42` | main action and redaction marks |
| `--teal` | `#087d76` | links, match marks, success |
| `--sun` | `#edb72c` | notes and warnings |
| `--plum` | `#62345a` | secondary ink |

The site is deliberately single-mode: warm paper is part of the risograph thesis.
Dark terminal panels retain at least 4.5:1 text contrast.

## Type, spacing, shape

Display headings use the local system serif stack (`Iowan Old Style`, Georgia,
serif) for an editorial field-notes voice. UI and terminal output use the local
monospace stack (`SFMono-Regular`, Consolas, monospace). This avoids network fonts
and lets command text remain crisp. Spacing follows an 8px scale; content tops out
at 1120px and prose at 68 characters. Surfaces are square-ish clipped paper sheets
with 2px ink outlines and small offset shadows, never pill-shaped SaaS cards.

## Interaction and motion

The active search result gets a brief 180ms offset-print settle, as though a fresh
ink layer lands on paper. Buttons press down into their ink shadow. With reduced
motion, these changes are instant and no image or screen loops.

## Asset plan and provenance

`public/hero-terminal-recall.webp` is an original generated editorial collage:
a dark terminal transcript on torn recycled paper, redacted key strips, teal search
marks, and no readable product copy. It is generated with the factory image
deployment from `/opt/fleet/lib/gen-image.sh`, then converted to WebP for the hero.
The prompt and generated metadata live alongside the asset. All remaining marks are
CSS or hand-authored SVG and are not third-party artwork.
