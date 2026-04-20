# Animation Guide for PurePrompt

This file shows the patterns currently used in the app for button motion, text underlines, icon buttons, and expandable panels.

## 1. Text links with an underline animation

Use the `animated-link` class when you want an underline to grow in on hover or keyboard focus.

Example:

```tsx
<Link href="/catalog" className="animated-link">
  Catalog
</Link>
```

What it does:
- Adds a line under the text using `::after`.
- Keeps the underline hidden until hover or focus.
- Works well for navigation links.

Use it only on links that should feel interactive. Do not apply it to every text element.

## 2. Buttons that glow or feel more tactile

The app already uses these motion patterns on buttons:

- `ghost-btn` and `solid-btn` lift slightly on hover.
- `solid-btn` gets a glow effect on hover.
- `topbar-menu-button` changes shape and shadow when opened.
- `:active` makes buttons compress slightly when clicked.

Example:

```tsx
<Link href="/signup" className="solid-btn">
  Sign up
</Link>
```

If you want a new button with the same feel, reuse one of these classes instead of writing new motion from scratch.

### Customizing a button

You can combine a base button class with a modifier class:

```tsx
<button className="solid-btn my-extra-badge-btn">Save</button>
```

Then add extra styling in CSS:

```css
.my-extra-badge-btn:hover {
  filter: drop-shadow(0 0 14px color-mix(in srgb, var(--accent) 55%, transparent));
}
```

## 3. Icons for buttons and controls

The app now uses `lucide-react` for icons.

Example:

```tsx
import { ArrowLeft, Menu, Search } from "lucide-react";

<ArrowLeft aria-hidden size={20} strokeWidth={2.25} />
```

Guidelines:
- Use `aria-hidden` for decorative icons.
- Use a visible text label or `aria-label` when the icon is the only content.
- Keep icon sizes consistent inside similar controls.

## 4. Expandables that animate open and closed

The catalog filters use a `details` element with CSS animation.

Example structure:

```tsx
<details className="sidebar-mobile-disclosure">
  <summary className="sidebar-mobile-summary">Filters</summary>
  <div className="sidebar-mobile-panel">
    ...content...
  </div>
</details>
```

The animation pattern is:
- `max-height: 0` when closed.
- A large `max-height` when open.
- `opacity` and `transform` for a smoother reveal.

This works well for:
- Filters
- Accordion sections
- Nested option groups

For nested groups, use another `details` block:

```tsx
<details className="sidebar-mobile-group">
  <summary>Categories</summary>
  <ul>
    <li>Prompting</li>
    <li>Reasoning</li>
  </ul>
</details>
```

## 5. What is already animated in the app

Current examples in the codebase:

- Top navigation links use `animated-link`.
- Mobile menu links also use `animated-link`.
- The topbar menu button reacts to hover, click, and open state.
- Mobile catalog filters expand and contract with motion.
- Practice details back button uses the same button press behavior.

## 6. Practical rules to follow

- Use motion to clarify interaction, not to decorate everything.
- Keep transitions short, usually between `150ms` and `260ms`.
- Prefer transforms and opacity for smoothness.
- Use `max-height` or grid-based techniques for expandables.
- Respect `:focus-visible` so keyboard users get the same feedback.

## 7. Good default snippets

Hover lift:

```css
.some-button:hover {
  transform: translateY(-1px);
}
```

Press feedback:

```css
.some-button:active {
  transform: scale(0.97);
}
```

Underline reveal:

```css
.some-link::after {
  transform: scaleX(0);
  transition: transform 180ms ease;
}

.some-link:hover::after,
.some-link:focus-visible::after {
  transform: scaleX(1);
}
```

Expandable content:

```css
.some-panel {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition:
    max-height 260ms ease,
    opacity 220ms ease,
    transform 220ms ease;
}

.some-open-state .some-panel {
  max-height: 999px;
  opacity: 1;
  transform: translateY(0);
}
```

If you want, I can next turn these patterns into a small reusable animation utility class set so new components can share the same motion without repeating CSS.