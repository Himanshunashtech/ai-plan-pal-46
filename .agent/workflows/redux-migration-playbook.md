# Redux Schema Migration Playbook

This document defines the strategy for evolving the Redux state in the CaloApp codebase.

## Versioning Strategy
We use `REDUX_PERSIST_VERSION` in `src/store/index.ts` to manage state versions. 
Increasing this version will trigger a purge of the old state unless a migration is provided.

## How to perform a Migration

### 1. Identify the Change
- **Non-breaking**: Adding a new field with a default value. No migration needed.
- **Breaking**: Renaming a field, changing data structures (e.g., from array to entity adapter).

### 2. Increment Version
In `src/store/index.ts`, increment the `REDUX_PERSIST_VERSION`.

### 3. Implement Migration Logic
We use the `migrations` property of `persistConfig`.

```typescript
const migrations = {
  2: (state: any) => {
    // Example: Migrate old array to entity adapter
    return {
      ...state,
      stats: {
        ...state.stats,
        foods: {
          ids: state.stats.foods.map((f: any) => f.id),
          entities: state.stats.foods.reduce((acc: any, f: any) => ({ ...acc, [f.id]: f }), {})
        }
      }
    };
  }
};
```

### 4. Configuration
Add the migration to the persist config:

```typescript
const persistConfig = {
  key: 'root',
  version: 2,
  storage,
  migrate: createMigrate(migrations, { debug: false }),
};
```

## Safety Checklist
- [ ] Does the new state have sensible defaults?
- [ ] Have you tested the migration by mocking a version 1 state in LocalStorage?
- [ ] Does the migration handle `null` or `undefined` states gracefully?
- [ ] If purging (no migration), are you sure the data is backed up on the server?
