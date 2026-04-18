# Architectural Guidelines

This project strictly adheres to a **Feature-Driven Architecture**. Do not dump all components into `src/components` or all actions into `src/app/actions`.

## 1. Feature Domains (`src/features/`)
All business logic, smart components, and domain-specific types must be isolated inside `src/features/[domain-name]/`. 
- **Colocation:** A feature directory should contain its own `components/`, `actions.ts`, `utils.ts`, and `types.ts`.
- **Isolation:** Features should not import deeply from other features.

## 2. Global Components (`src/components/`)
Only generic, domain-agnostic UI building blocks (e.g., shadcn buttons, inputs, layouts) belong here. They must not contain specific business logic or fetch data.

## 3. The App Router (`src/app/`)
The `app/` directory is strictly for routing, page assembly, and loading/error boundaries. Pages should remain thin, importing layout and logic from the `features/` directory.

## 4. Server Actions
Colocate server actions with the feature they belong to (e.g., `src/features/transactions/actions.ts`). Do not use a global actions folder.
