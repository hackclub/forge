| title | JOURNAL.md Format |
| description | How to document your build |
| --- | --- |

# JOURNAL.md Format

You can document your build in two ways:

1. **On Forge** — Add devlog entries directly on your project page (click "New Entry")
2. **In your repo** — Create a `JOURNAL.md` file in the root of your GitHub repo and click "Sync JOURNAL.md" on your project page

Both methods are equally valid. Use whichever feels more natural.

## File Format

Your `JOURNAL.md` should have a YAML frontmatter header, followed by entries separated by `# ` headers:

```markdown
---
title: "My Project Name"
author: "your-name"
description: "A short description of your project"
created_at: "2026-03-20"
---

# March 20: Designed the PCB layout

Spent the day laying out traces in KiCad. Got the power section done
and started routing the signal lines. Ran into some clearance issues
with the USB connector footprint but found a workaround.

![pcb layout](images/pcb-v1.png)

**Total time spent: 4 hours**

# March 21: Ordered components

Placed orders for all the SMD parts from LCSC. Also found a better
LDO regulator that saves board space.

**Total time spent: 1 hour**

# March 23: PCB arrived, started soldering

The boards came in! Soldered the first prototype. Two pads were
bridged on the QFN package — had to wick and redo them.

![soldering](images/soldering.jpg)

**Total time spent: 3 hours**
```

## Requirements

- **Each entry starts with `# `** followed by the date and a brief title
- **Include `**Total time spent: X**`** at the end of each entry
- **Add images** — photos of your progress, screenshots of your design, etc.
- **Be authentic** — write in your own words. AI-generated content will be rejected.
- **Small, consistent entries** are better than one massive dump at the end
- **Include both successes and failures** — the real story matters

## What Makes a Good Entry

A good devlog entry:

- Describes what you worked on and what decisions you made
- Includes photos or screenshots
- Notes how long you spent
- Is honest about problems and setbacks

A bad devlog entry:

- Is a wall of timestamps with no descriptions
- Has no images
- Was clearly written by AI
- Was all written at the end instead of as you went

## Syncing

After pushing your `JOURNAL.md` to GitHub, go to your project page on Forge and click **"Sync JOURNAL.md"**. New entries will be imported (existing ones are skipped based on title).
