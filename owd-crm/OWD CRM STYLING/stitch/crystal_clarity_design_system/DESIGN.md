# Design System Specification: Architectural Clarity

## 1. Overview & Creative North Star
**The Creative North Star: "The Polished Specimen"**

This design system is built for a business rooted in clarity—the glass industry. To move beyond the "generic SaaS" look, we evoke the qualities of high-end architectural glazing: transparency, structural integrity, and light refraction. We are moving away from the "boxed-in" layout of traditional CRMs toward an editorial, layered experience.

By leveraging **intentional asymmetry**, we create a path for the eye to follow, breaking the monotony of data-heavy CRM screens. We prioritize **Tonal Depth** over lines, ensuring the interface feels like a sophisticated workspace rather than a spreadsheet.

---

## 2. Color Theory & Surface Logic
The palette is rooted in a professional Deep Navy (`primary`), balanced by the technical precision of Soft Teal (`secondary`) and the artisanal warmth of Amber (`tertiary`).

### The "No-Line" Rule
**Borders are a failure of hierarchy.** In this system, 1px solid borders are prohibited for sectioning. We define boundaries through:
- **Background Shifts:** Use `surface-container-low` for large structural areas and `surface-container-lowest` for active content cards.
- **Tonal Transitions:** Define space by placing a `surface-bright` element against a `surface-dim` background.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the following hierarchy to define importance:
1.  **Base Layer (`surface`):** The primary canvas.
2.  **Structural Layer (`surface-container-low`):** Used for sidebar and background grouping.
3.  **Active Layer (`surface-container-lowest`):** Reserved for high-priority cards and interactive modules to create a "lifted" feel.
4.  **Information Layer (`surface-container-high`):** Used for nested data, like an inspection report inside a client file.

### The "Glass & Gradient" Rule
To echo the glass business, main CTAs and "Hero" cards should utilize a subtle linear gradient: `primary` (#022448) to `primary-container` (#1e3a5f) at a 135-degree angle. This adds a "soul" to the UI that flat color lacks.

---

## 3. Typography: Editorial Precision
We use **Inter** for its neutral, modernist clarity and **JetBrains Mono** for data to convey technical accuracy.

-   **Display & Headlines (`headline-lg` to `display-sm`):** Use high-contrast sizing. Large headlines should feel editorial, often placed with generous "breathing room" (Spacing 16) to anchor a page.
-   **Body (`body-md`):** Our 14px (0.875rem) standard. High line-height (1.6) is mandatory to ensure readability in dense CRM workflows.
-   **Data (`JetBrains Mono`):** Used exclusively for ID numbers, dimensions, and currency. It signals to the user: "This is a precise measurement."

---

## 4. Elevation & Depth
We reject the heavy, muddy shadows of 2010s UI. We achieve depth through light simulation.

-   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. The change in hex code provides enough contrast to signify a "top" layer without a single line of CSS border.
-   **Ambient Shadows:** For floating modals or dropdowns, use: `0 20px 40px rgba(0, 28, 59, 0.06)`. Note the tint: the shadow is a low-opacity `on-primary-fixed`, not pure black.
-   **The Ghost Border Fallback:** If accessibility requires a stroke (e.g., in high-glare environments), use `outline-variant` at 15% opacity. It should be felt, not seen.
-   **Glassmorphism:** Navigation headers (`surface-container-lowest`) should use an 85% opacity with a `blur(12px)` backdrop filter. This keeps the user grounded in their vertical scroll position.

---

## 5. Components

### Buttons
-   **Primary:** Gradient fill (`primary` to `primary-container`), `on-primary` text, `lg` (1rem) radius.
-   **Secondary:** `surface-container-high` background with `primary` text. No border.
-   **Tertiary:** Transparent background, `primary` text, underlined only on hover.

### Forms & Inputs
-   **Style:** `surface-container-lowest` background with an `outline-variant` ghost border. 
-   **Interaction:** On focus, the border disappears and is replaced by a 2px `secondary` (Teal) bottom-glow.
-   **Radius:** Stick strictly to `DEFAULT` (0.5rem) to maintain the "Modern Professional" look.

### Tables & Lists
-   **The "No-Divider" Rule:** Forbid horizontal lines between rows. Use alternating "zebra" stripes with `surface-container-low` and `surface-container-lowest`.
-   **Spacing:** Use Spacing `3.5` (1.2rem) for vertical cell padding to ensure data doesn't feel cramped.

### Sidebar (The "Monolith")
-   **Width:** 240px.
-   **Style:** `surface-container-low`. Active states use a `secondary-container` (Teal) "pill" shape that doesn't touch the edge of the sidebar—it floats with 12px padding.

### Cards
-   **Standard:** No borders. `surface-container-lowest` fill.
-   **Interactive:** On hover, the card should transition to a slightly higher `surface-bright` and gain an Ambient Shadow.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use `JetBrains Mono` for all dimensions (e.g., "1200mm x 800mm"). It reinforces the glass-cutting precision.
*   **Do** lean into white space. If a layout feels "off," add more padding from the Spacing Scale (move from `6` to `8`).
*   **Do** use `tertiary` (Warm Amber) sparingly. It is a "surgical" color meant only for critical CTAs or high-priority lead status.

### Don’t
*   **Don't** use 100% black text. Always use `on-surface` (#191c1e) to maintain a premium, softened contrast.
*   **Don't** use "Drop Shadows" on cards. Use Tonal Layering (different surface colors) instead.
*   **Don't** use standard 1px dividers. If you need to separate content, use a 24px (Spacing `6`) vertical gap.