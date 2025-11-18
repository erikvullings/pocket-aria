# Task Completion Checklist

When completing a coding task in PocketAria, follow these steps:

## 1. Type Check

```bash
pnpm run type-check
```

Ensure no TypeScript errors are present.

## 2. Test Build

```bash
pnpm run build
```

Verify that the production build completes successfully.

## 3. Manual Testing (if applicable)

```bash
pnpm run dev
```

Test the changes in the development environment:

- Navigate to affected views/components
- Verify functionality works as expected
- Test edge cases

## 4. Code Review

- Ensure code follows project conventions
- Check for proper TypeScript typing
- Verify imports use path aliases where appropriate (`@/*`)
- Ensure no console.log statements remain (unless intentional)

## Notes

- No linting or formatting commands are currently configured
- No automated test suite is present
- Manual testing is the primary verification method
