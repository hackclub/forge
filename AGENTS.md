---
applyTo: "**"
---

Keep your changes as low impact as possible. You do not need to give me a summary of changes. You do not need to test the changes. Try to reference other parts of the codebase to ensure your changes are consistent with the existing code style and practices. Keep your responses concise and focused.

Read all context and instructions carefully before making changes. Code may be manually modified between messages. Do not suggest code that has been deleted or is no longer relevant.

This project uses ruby 3.4.4, rails 8.1.2 with React 19 and tailwind 4.1.18 through inertia-rails. Make sure to only suggest changes that are applicable to those versions. When possible, prefer to use the cli to generate boilerplate rather than editing files manually. You can always modify boilerplate generated from the cli.

Inertia acts as the internal bridge between rails and React. Please be careful what objects are passed across, as all attributes (even if unused in the frontend) are sent and can be viewed through developer tools. Inertia docs for LLMs is at: https://inertia-rails.dev/llms-full.txt

Pundit policies are also used and should be modified to fit. Please be careful as this pertains to security. If you are not sure about how to modify a policy, ask for clarification. Always ensure that you are following the principle of least privilege when modifying policies. Only give access to what is necessary for the feature to function properly. Do not give access to more than what is needed. Pundit documentation is available at: https://www.rubydoc.info/gems/pundit

HCB controls money for the program, DO NOT EDIT ANY CODE RELATED TO HCB WITHOUT EXPLICIT WRITTEN APPROVAL. Alert in the chat that you're making changes to HCB code before doing so. Do not run any tests and console code containing stuff related without EXPLICIT WRITTEN APPROVAL.

When adding changes, use rails, inertia, React and pundit best practices and patterns. Use partials and helpers to keep code DRY. Use concerns to share code between models and controllers. Use inertia's features to keep the site experience high quality. Use React hooks and JSX patterns. Keep performance in mind and minimize database queries (e.g. use includes, avoid n+1 queries). Use background jobs for long running tasks. Use caching where appropriate. In rails, if you add the private keyword, please make sure to check nothing else is affected, as often there will be more existing code after your changes. Private methods should always be at the bottom of the class.

When modifying code, ensure that you maintain existing functionality and do not introduce bugs. Ensure that your changes are well-integrated with the existing codebase and follow the project's coding standards and conventions. Use `git diff` to see what you changed and run checks `bin/rubocop -f github` and `bin/brakeman --no-pager` before finishing to ensure code quality and security. In those checks, if there are issues that are unrelated to your changes, flag them, but you don't have to fix them.

If asked to change the requirements or behavior of a feature, make sure previous implementations that you suggested are also updated to reflect the new requirements. Always ask questions when needed.

Do not add comments unless they are absolutely necessary for clarity. Your code should describe what it does, not comments. If you do add comments, ensure they are clear, concise, and relevant to the code they accompany. Do not add huge blocks of comments.

## UI Design System — "PCB / Circuit Board" Theme

Quarry is a hardware event where builders get up to $1k in funding, with hourly rates determined by community voting. The UI follows a dark, medieval/gold aesthetic — like a royal treasury carved from dark stone. All new pages and components must follow this theme consistently.

### Color Palette
- **Background:** `#0e0c09` (near-black warm brown) with SVG noise texture overlay at `opacity: 0.06`
- **Card/surface backgrounds:** `bg-yellow-950/20` (very subtle warm tint over dark)
- **Primary accent (gold):** Tailwind `yellow-600` for solid elements, gradient `from-yellow-600 to-yellow-800` for buttons
- **Gold text gradient:** `bg-gradient-to-b from-yellow-400 via-yellow-600 to-yellow-800 bg-clip-text text-transparent`
- **Primary hover:** Tailwind `yellow-500` to `yellow-700` gradient
- **Heading text:** `text-yellow-100/90` or `text-yellow-100/80`
- **Body text:** `text-yellow-100/40` (ghostly pale gold)
- **Muted text:** `text-yellow-100/25` or `text-yellow-100/20`
- **Labels/footer:** `text-yellow-100/15` or `text-yellow-700/60`
- **Status indicators:** `yellow-500` with pulse animation
- **Borders:** `border-yellow-800/30` for cards, `border-yellow-700/40` for accented, `border-yellow-900/30` for subtle
- **Button glow:** `shadow-[0_0_30px_rgba(180,130,20,0.15)]`, hover: `shadow-[0_0_40px_rgba(180,130,20,0.25)]`

### Typography
- **Headings:** System sans-serif, `font-black`, tight tracking (`tracking-tight` or `tracking-tighter`)
- **Step numbers:** Roman numerals (I, II, III) in `font-serif text-yellow-700/30 text-5xl font-black`
- **Labels and section headers:** `text-[10px] uppercase tracking-[0.4em] font-bold text-yellow-700/60`
- **Nav logo:** `font-black tracking-[0.25em] uppercase text-yellow-600`
- **Status badges:** `text-xs uppercase tracking-[0.3em] text-yellow-600`

### Decorative Elements
- **Noise texture:** Inline SVG with `feTurbulence` (`baseFrequency="0.9"`, `numOctaves="4"`) at 6% opacity on the body background
- **Corner flourishes:** SVG L-shaped gold borders at page corners, ~20% opacity, using `#b8860b`
- **Vignette:** `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)` overlay
- **Section dividers:** Gold gradient line (`from-transparent via-yellow-700/40 to-transparent`) with diamond SVG (stroked rhombus with center dot)
- **Card corner accents:** Small `w-3 h-3` borders on each corner (`border-t border-l border-yellow-700/40`) that brighten on hover
- **Top bars on stat cards:** `w-8 h-px` centered gradient line on top edge

### Buttons
- **Primary:** `bg-gradient-to-b from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 text-black font-black uppercase tracking-[0.2em]` — no border-radius, sharp edges, with gold glow shadow
- **Secondary/outline:** `border border-yellow-800/50 hover:border-yellow-600/60 text-yellow-100/30 hover:text-yellow-500 font-bold uppercase tracking-[0.2em]` — sharp edges

### Cards
- `border border-yellow-800/30 bg-yellow-950/20` — no border-radius (sharp edges)
- Corner accent divs on all four corners
- Hover state: `hover:border-yellow-700/50 transition-all`
- Step numbers as large faded roman numerals

### General Rules
- No bright whites — everything is tinted gold/yellow, even "white" text uses `yellow-100` at varying opacity
- **No border-radius anywhere** — everything is sharp, angular, medieval (no `rounded-*` classes)
- Gold gradient text for hero words and stat numbers
- Use mining/quarry language: "stake your claim", "enter the pit", "strike gold", "dig in", "yield", "vein"
- The vibe is a dark medieval treasury — gold glinting in torchlight on dark stone walls
- Keep it sparse and heavy — lots of breathing room, big type, minimal decoration
