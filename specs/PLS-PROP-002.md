# PLS-PROP-002: Units verified badge

**Status:** Ready
**Workstream:** record

Brokers want to know when the unit count has been checked against the rent roll.

## Behavior
- Add `units_verified` to properties (boolean, not null, default false).
- On the Properties list, when units are verified, the Units cell shows the number followed by a space and a check mark, for example `12 ✓`.
- When units are not verified, the cell shows the number only, for example `12`.
- When units are unknown, the cell shows `—` with no check mark.

## Acceptance tests
1. Migration adds `properties.units_verified`, not null, default false.
2. A verified property with 12 units shows `12 ✓` in the Units column.
3. An unverified property with 12 units shows `12`.
4. A property with unknown units shows `—`.
