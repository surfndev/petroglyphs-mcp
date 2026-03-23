# Petroglyphs — Design Brief

## Concept
iPad app. Handwriting input tool for AI. You draw on a canvas, pick a combo (preset prompt), and cast it to an LLM via MCP.

**Theme:** Cave art meets AI. The oldest form of human communication (drawing on stone) connected to the newest (LLM). Earth tones, stone textures, warm and tactile. Should feel carved, not coded.

**Tagline:** "A handwriting keyboard for AI"

---

## Color system

### Earth palette
- Background: `#F5EDE3` (limestone)
- Surface/cards: `#E8D5C0` (sandstone)
- Border/subtle: `#C4956A` (clay)
- Accent/CTA: `#D4874D` (ochre)
- Accent pressed: `#B8652A` (burnt ochre)
- Text: `#3D3530` (charcoal)
- Text dark: `#2A2320` (deep cave)

### Functional
- Connected/success: `#7A9A6D` (moss)
- Info: `#5B8FA8` (river blue)
- Error: `#A65D4E` (rust)
- Highlight: `#C9A84C` (dust gold)
- Disabled: `#8A8078` (slate)

### Dark mode
Invert background to `#2A2320`, surface to `#3D3530`, text to `#E8D5C0`. Ochre accent stays the same in both modes.

### Canvas
Always pure white `#FFFFFF` in both modes — clean for handwriting and LLM screenshot readability.

---

## Typography
- Display/headings: Caveat (Google Fonts) or similar hand-drawn font
- UI/body: SF Pro Rounded
- Keep it simple — display font only for app title and major headings

---

## Texture
Subtle sandstone grain on backgrounds. Low opacity (8-12%). The canvas itself has no texture. The contrast of textured stone surround + clean white canvas = "paper on stone."

---

## Two pages

### Page 1: Landing page
Modern, clean, with earth-tone warmth. Not a game menu — more like a premium tool's home screen.

**Components needed:**
- App title + tagline
- "Enter" CTA button (ochre, prominent)
- Three setting tiles: Combos, Server, Settings
- Connection status indicator
- Version/GitHub/license footer

No creature, no counter, no XP bar in V1. Keep it minimal.

### Page 2: Canvas page
White drawing canvas framed by a stone-textured border. Landscape orientation.

**Components needed:**
- PencilKit canvas (white, ~85% of width)
- Combo spinner (right or left edge, depends on handedness setting)
- Home button (top corner, returns to landing)
- Connection indicator (small dot)
- PencilKit tool picker (bottom, native)

---

## Combo spinner
A rounded control on the screen edge holding combo presets. The active combo = the send button (tap to cast).

**Key behaviors:**
- Scrollable/rotatable to browse combos
- Active combo is visually larger with ochre highlight
- Tapping active combo sends the canvas image
- Long-press any combo to quick-edit
- "+" slot to create new combo
- Can collapse to maximize canvas space

**Shape:** Start with whatever looks best — rounded rect strip, partial circle, or pill shape. The mockups showed both approaches working. Creative freedom here.

---

## Combos
Each combo = icon + name + prompt template + optional auto-action.

**Default combos to ship:**
- Just cast (raw send, no prompt)
- Math tutor
- Vocab capture
- Sketch critique
- Translate this
- Save to Obsidian
- Export diagram

Users can create custom combos.

---

## Key interactions

**Cast:** Tap active combo → satisfying send animation (flash, pulse, or particle trail in ochre) → success indicator. Under 1 second.

**Clear:** Palm-swipe across canvas or three-finger swipe → wipe animation (dust/sweep effect, left to right) → canvas resets to white. Should feel physical like wiping a slate.

**Page transition:** Landing → Canvas should feel intentional. A clean transition, not just a navigation push.

---

## App icon direction
Hand stencil (like aboriginal rock art) on stone background. Ochre and charcoal tones.

---

## What NOT to build in V1
- Creature/mascot
- Session counter/XP
- Dark mode (nice to have, not required for V1)
- Portrait orientation
- Multi-page canvas
- Voice dictation
- Grid/lined backgrounds
