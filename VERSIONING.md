# Versioning Convention

## Version Format
The project uses semantic versioning with the format: `0.990X`

## Version Increment Rule
**IMPORTANT:** When updating the version, increment by a **single number** only.

### Examples:
- `0.9901` → `0.9902` ✅ (correct)
- `0.9902` → `0.9903` ✅ (correct)
- `0.9901` → `0.9910` ❌ (incorrect - increments by 9)
- `0.9901` → `0.9911` ❌ (incorrect - increments by 10)

### Pattern:
- Increment the last digit only
- Keep all preceding digits the same
- This allows for 9 patch versions per minor version (0.9901 through 0.9909)

## Current Version
See `package.json` for the current version number.

