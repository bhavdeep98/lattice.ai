# Lattice AWS CDK Landing Page

A minimal, modern landing page with smooth scroll animations that explain the Lattice framework layer by layer.

## Features

- **Minimal Design**: Clean, modern interface focused on content
- **Scroll Animations**: Progressive reveal of framework layers as you scroll
- **Layer-by-Layer Explanation**: Visual breakdown of how Lattice works
- **Responsive**: Works perfectly on all devices
- **Performance Optimized**: Lightweight with smooth 60fps animations

## Structure

- `index.html` - Main HTML structure
- `styles.css` - All styling and responsive design
- `script.js` - Scroll animations and interactions

## Sections

1. **Hero** - Introduction with code example
2. **How It Works** - Three animated layers:
   - Layer 1: AI Intent (Simple JSON input)
   - Layer 2: Lattice Framework (Module processing)
   - Layer 3: Guardrails (Security, cost, tagging)
3. **Features** - Key benefits
4. **CTA** - Call to action
5. **Footer** - Links and info

## Animations

- **Scroll-triggered reveals** - Sections appear as you scroll
- **Staggered animations** - List items animate in sequence
- **Parallax effects** - Subtle depth on scroll
- **Interactive hovers** - Cards respond to mouse interaction
- **Progress indicator** - Shows scroll progress
- **Code typing effect** - Animated code example

## Usage

Simply open `index.html` in a web browser or serve with any static file server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

## Customization

- Colors: Modify CSS custom properties in `styles.css`
- Content: Update text and examples in `index.html`
- Animations: Adjust timing and effects in `script.js`
