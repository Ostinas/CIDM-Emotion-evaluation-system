# CSS Organization

This directory contains modular CSS files organized by concern, following best practices for maintainable stylesheets.

## File Structure

```
styles/
├── variables.css       # CSS custom properties and theme tokens
├── base.css           # Global resets and base styles
├── layout.css         # App structure, sidebar, containers
├── buttons.css        # All button styles
├── UploadView.css     # Upload view specific styles
├── StatsView.css      # Statistics view specific styles
├── components.css     # Shared components (toast, tooltips, skeleton)
└── responsive.css     # Media queries and mobile styles
```

## Organization Strategy

### 1. **variables.css**
Contains all CSS custom properties (CSS variables):
- Color palette
- Spacing tokens
- Border radius values
- Shadow definitions

**When to edit:** Changing theme colors, adding new design tokens

### 2. **base.css**
Global styles that apply to the entire application:
- Box-sizing reset
- Body styles
- Utility classes (e.g., `.muted`)

**When to edit:** Adding global utilities or changing base typography

### 3. **layout.css**
Structural styles for the app layout:
- `.app-root` - Main container
- `.app-main` - Content area
- `.sidebar` - Navigation sidebar
- `.panel` - Content panels

**When to edit:** Changing overall app structure or sidebar behavior

### 4. **buttons.css**
All button-related styles:
- `.primary-btn` - Primary actions
- `.secondary-btn` - Secondary actions
- `.export-btn` - Export buttons

**When to edit:** Adding new button variants or modifying button styles

### 5. **UploadView.css**
Styles specific to the upload functionality:
- Dropzone styles
- File info display
- Progress bar
- Error/success messages
- Video preview

**When to edit:** Modifying upload UI or adding upload features

### 6. **StatsView.css**
Styles for the statistics dashboard:
- Stats layout grid
- Summary cards
- Insights panel
- Chart wrappers
- Video stream

**When to edit:** Changing statistics visualization or layout

### 7. **components.css**
Reusable component styles:
- Toast notifications
- Custom tooltips
- Loading skeleton
- Action rows

**When to edit:** Adding new shared components or modifying existing ones

### 8. **responsive.css**
Media queries for responsive design:
- Mobile breakpoints (< 900px)
- Tablet adjustments
- Layout adaptations

**When to edit:** Adjusting mobile behavior or adding new breakpoints

## Import Order

The CSS files are imported in a specific order in `App.css`:

1. **Variables** - Must be first so variables are available to all other files
2. **Base** - Global styles foundation
3. **Layout** - Structural elements
4. **Buttons** - Component styles
5. **View-specific** - UploadView, StatsView
6. **Components** - Shared components
7. **Responsive** - Media queries last to override as needed

## Best Practices

### Adding New Styles

1. **Determine the correct file:**
   - Component-specific? → Use view-specific file
   - Shared component? → Use components.css
   - Layout change? → Use layout.css

2. **Use CSS variables:**
   ```css
   color: var(--text);      /* ✅ Good */
   color: #e5e7eb;          /* ❌ Avoid */
   ```

3. **Keep selectors simple:**
   ```css
   .stats-card { }          /* ✅ Good */
   .panel .stats .card { }  /* ❌ Too nested */
   ```

4. **Group related styles:**
   ```css
   /* Group comment */
   .selector-one { }
   .selector-two { }
   ```

### Naming Conventions

- **Component-based:** `.component-name { }`
- **Modifier classes:** `.component-modifier { }`
- **State classes:** `.component.active { }`
- **BEM-like for complex components:** `.block__element--modifier { }`

### Variable Naming

Variables use kebab-case with clear semantic meaning:
- `--text` - Primary text color
- `--muted` - Muted/secondary text
- `--accent` - Primary accent color
- `--radius-lg` - Large border radius

## Performance Considerations

1. **CSS is loaded once:** All styles are imported through `App.css`
2. **No dynamic imports:** Static imports allow for bundling optimization
3. **Scoped by naming:** Component-specific class names prevent conflicts
4. **Media queries last:** Ensures responsive overrides work correctly

## Migration from Monolithic CSS

Previously, all styles were in a single 792-line `App.css` file. Now:

- **792 lines** → 8 focused files (avg ~100 lines each)
- Easier to find and modify specific styles
- Better organization and maintainability
- Clear separation of concerns
- Faster development workflow

## Common Tasks

### Changing Theme Colors
Edit `variables.css` to update color tokens

### Adding a New Component
1. Determine if it's view-specific or shared
2. Add styles to appropriate file
3. Use existing variables and patterns
4. Test responsive behavior

### Modifying Layout
Edit `layout.css` for structural changes, `responsive.css` for mobile

### Debugging Styles
1. Check which file contains the relevant classes
2. Use browser DevTools to see computed styles
3. Verify CSS variable values in `:root`

## Future Enhancements

Possible improvements:
- CSS Modules for true component scoping
- CSS-in-JS solution (styled-components, emotion)
- Sass/SCSS for advanced features
- Tailwind CSS for utility-first approach

## Questions?

When modifying styles:
1. Find the appropriate file using this README
2. Follow existing patterns
3. Use CSS variables where possible
4. Test responsive behavior
5. Verify no unintended side effects

---

**Last Updated:** December 11, 2025
**Version:** 2.0

