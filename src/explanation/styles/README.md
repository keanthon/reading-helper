# Modular CSS Architecture for Explanation Window

## Overview
This modular CSS architecture breaks down the original 948-line CSS file into focused, maintainable components under 500 lines each, following professional coding standards.

## File Structure
```
src/explanation/styles/
├── explanation-styles-modular.css   # Main entry point (imports all components)
├── explanation-styles.css           # Original monolithic file (deprecated)
└── components/
    ├── base.css                     # Reset, base styles, animations (92 lines)
    ├── header.css                   # Header, status bar, navigation (106 lines)
    ├── typography.css               # Headings H1-H6 (73 lines)
    ├── content.css                  # Content sections and text (124 lines)
    ├── code.css                     # Code blocks and syntax highlighting (289 lines)
    ├── math.css                     # Math elements and equations (176 lines)
    ├── states.css                  # Loading and error states (88 lines)
    └── responsive.css              # Dark mode and responsive design (173 lines)
```

## Component Responsibilities

### 1. `base.css` - Foundation Layer
- CSS reset and box-sizing
- Base typography and font families
- Main content area and scrollbar styling
- Small text hierarchy classes
- Global animations and keyframes
- Word count information styling

### 2. `header.css` - Navigation Layer
- Main header with gradient background
- Close button and header title
- Status bar and status text
- Themed header variants (thorough, code)
- Enhanced explanation headers with icons
- Header hover effects and transitions

### 3. `typography.css` - Text Hierarchy
- H1 through H6 heading styles
- Gradient backgrounds for each heading level
- Color-coded hierarchy (blue, teal, emerald, amber, orange, gray)
- Header icons and decorative elements
- Consistent spacing and typography scales

### 4. `content.css` - Content Layout
- Selected text section styling
- Explanation section containers
- Content text styling (paragraphs, lists, emphasis)
- Link styling and hover effects
- Horizontal rules and content separators
- Text content hierarchy and spacing

### 5. `code.css` - Code Elements
- Inline code styling with syntax highlighting
- Code block containers and pre-formatted text
- Copy button for code blocks
- Prism.js integration with GitHub-style themes
- Professional code wrapping and formatting
- Light and dark mode syntax highlighting
- Blockquote styling for code documentation

### 6. `math.css` - Mathematical Content
- MathJax equation styling and containers
- Math window styling matching code examples
- Math fallback styling for unsupported browsers
- Inline and display math formatting
- Error states for math rendering
- Mathematical content accessibility

### 7. `states.css` - Dynamic States
- Loading spinners and animations
- Loading screen overlays
- Error message styling and containers
- Streaming indicators
- Progress states and feedback
- Interactive state management

### 8. `responsive.css` - Adaptive Design
- Complete dark mode implementation
- Mobile-first responsive breakpoints
- High contrast mode support
- Reduced motion accessibility
- Focus states and keyboard navigation
- Comprehensive dark mode color overrides

## Text Color System
Each component maintains the comprehensive text color documentation with:
- **27 distinct text elements** with specific purposes
- **Light mode colors** optimized for readability
- **Dark mode colors** with excellent contrast ratios
- **WCAG AAA compliance** (7:1+ contrast ratios)
- **Semantic color usage** for different content types

## Usage

### Option 1: Use Modular System (Recommended)
Replace the import in your HTML:
```html
<!-- Replace this -->
<link rel="stylesheet" href="src/explanation/styles/explanation-styles.css">

<!-- With this -->
<link rel="stylesheet" href="src/explanation/styles/explanation-styles-modular.css">
```

### Option 2: Import Individual Components
For maximum performance, import only needed components:
```css
@import url('./components/base.css');
@import url('./components/header.css');
@import url('./components/content.css');
/* Add other components as needed */
```

## Benefits of Modular Architecture

### Maintainability
- **Single responsibility**: Each file has one clear purpose
- **Easy debugging**: Issues can be traced to specific components
- **Faster development**: Changes are isolated to relevant files

### Performance
- **Selective loading**: Import only required components
- **Better caching**: Browser can cache unchanged components
- **Smaller bundles**: Exclude unused components in production

### Scalability
- **Team collaboration**: Multiple developers can work on different components
- **Version control**: Smaller, focused commits and diffs
- **Testing**: Each component can be tested in isolation

### Code Quality
- **Under 300 lines**: Each file meets professional standards
- **Clear documentation**: Component purpose and responsibilities documented
- **Consistent patterns**: Standardized structure across all components

## Migration Guide
1. **Backup**: Keep the original `explanation-styles.css` as reference
2. **Test**: Verify all functionality works with modular imports
3. **Optimize**: Remove unused components for production builds
4. **Monitor**: Check performance improvements with network tools

## Maintenance
- Keep each component under 500 lines
- Document any new components added
- Maintain consistent naming conventions
- Update the main import file when adding components
