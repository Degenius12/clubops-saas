# ClubFlow — TypeScript Standards Reference

## Type Safety
- No `any` — use proper types or `unknown` for truly unknown data
- Explicit return types on all functions
- Use `interface` for object shapes, `type` for unions/intersections/mapped types
- Use Zod for runtime validation at API boundaries

## Error Handling
- Always try/catch async operations
- Type-safe errors: `error instanceof Error` check before accessing `.message`
- API routes: return structured `{ success, data?, error? }` responses

## React Components
- Props interface above component (PascalCase)
- Typed event handlers: `React.MouseEvent<HTMLButtonElement>`, `React.ChangeEvent<HTMLInputElement>`, etc.
- Hooks first, then handlers, then render

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables/Functions | camelCase | `userName`, `getUserData` |
| Components/Interfaces/Types | PascalCase | `UserProfile`, `ApiResponse` |
| Constants | UPPER_SNAKE | `MAX_RETRIES`, `API_URL` |
| Component files | PascalCase | `DancerCard.tsx` |
| Utility files | camelCase | `formatCurrency.ts` |
| API routes | kebab-case | `/api/entertainer-check-in` |

## Import Order
1. React/Next.js
2. Third-party libraries
3. Local components
4. Local utilities
5. Types
6. Styles

## Performance
- `useMemo` for expensive calculations
- `useCallback` for callback stability in child props
- `memo()` sparingly — only for genuinely expensive re-renders

## Validation
```typescript
// Zod for runtime validation at API boundaries
const UserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});
type User = z.infer<typeof UserSchema>;
```
