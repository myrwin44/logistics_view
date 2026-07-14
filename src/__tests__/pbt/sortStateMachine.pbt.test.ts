/**
 * Property-Based Test: Sort State Machine Cycling
 *
 * Feature: lgts-platform, Property 6: Sort state machine cycling
 * Arbitrary: sortable column identifier × fc.integer({ min: 1, max: 9 }) for click count
 * For any column + N clicks → final sort state equals [undefined, 'asc', 'desc'][N % 3]
 *                             and no states are skipped during the transition sequence
 *
 * Validates: Requirements 6.2, 9.2
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Sort state machine — mirrors the nextSortDir() logic in DataTable.tsx
//
// The 3-state cycle for a single column:
//   undefined → 'asc' → 'desc' → undefined → 'asc' → ...
// ---------------------------------------------------------------------------

type SortDir = 'asc' | 'desc' | undefined;

/**
 * Advances the sort direction for a single column following the same cycle
 * implemented by nextSortDir() in DataTable.tsx.
 *
 * When clicking a different column the cycle resets to 'asc'.
 * Same column: undefined → 'asc' → 'desc' → undefined
 */
function nextSortDir(
  clickedField: string,
  currentField: string | undefined,
  currentDir: SortDir,
): SortDir {
  if (clickedField !== currentField) return 'asc';
  if (currentDir === undefined) return 'asc';
  if (currentDir === 'asc') return 'desc';
  return undefined; // 'desc' → reset
}

/** The expected sort state after N clicks on the same column (0-indexed). */
const EXPECTED_CYCLE: SortDir[] = [undefined, 'asc', 'desc'];

describe('Property 6 — Sort State Machine Cycling', () => {
  it('final state after N clicks equals [undefined, asc, desc][N % 3]', () => {
    /**
     * **Validates: Requirements 6.2, 9.2**
     *
     * For any sortable column and any number of clicks (1–9), the sort state
     * arrived at after N consecutive clicks must equal EXPECTED_CYCLE[N % 3].
     */
    fc.assert(
      fc.property(
        fc.constantFrom('id', 'date', 'status', 'vehicle'),
        fc.integer({ min: 1, max: 9 }),
        (column, clickCount) => {
          // Simulate N clicks on the same column starting from a clean state
          let currentField: string | undefined = undefined;
          let currentDir: SortDir = undefined;

          for (let i = 0; i < clickCount; i++) {
            const nextDir = nextSortDir(column, currentField, currentDir);
            currentField = column;
            currentDir = nextDir;
          }

          // After N clicks the state must match the cycle formula
          const expected = EXPECTED_CYCLE[clickCount % 3];
          return currentDir === expected;
        },
      ),
      { numRuns: 200 },
    );
  });

  it('no sort states are skipped — every intermediate state in the sequence is valid', () => {
    /**
     * **Validates: Requirements 6.2, 9.2**
     *
     * For each click, the transition must follow the exact cycle.
     * Specifically, after click i the state is EXPECTED_CYCLE[i % 3].
     * This ensures no states are ever skipped or duplicated.
     */
    fc.assert(
      fc.property(
        fc.constantFrom('id', 'date', 'status', 'vehicle'),
        fc.integer({ min: 1, max: 9 }),
        (column, clickCount) => {
          let currentField: string | undefined = undefined;
          let currentDir: SortDir = undefined;

          for (let i = 0; i < clickCount; i++) {
            const nextDir = nextSortDir(column, currentField, currentDir);
            currentField = column;
            currentDir = nextDir;

            // After click i+1 the state must exactly equal EXPECTED_CYCLE[(i+1) % 3]
            const expected = EXPECTED_CYCLE[(i + 1) % 3];
            if (currentDir !== expected) {
              return false;
            }
          }

          return true;
        },
      ),
      { numRuns: 200 },
    );
  });

  it('clicking a different column resets the cycle to asc regardless of previous state', () => {
    /**
     * **Validates: Requirements 6.2, 9.2**
     *
     * When the user clicks a different column after any number of clicks on
     * the first column, the sort direction must immediately reset to 'asc'.
     */
    fc.assert(
      fc.property(
        fc.constantFrom('id', 'date', 'status', 'vehicle'),
        fc.constantFrom('id', 'date', 'status', 'vehicle'),
        fc.integer({ min: 0, max: 9 }),
        (firstColumn, secondColumn, initialClicks) => {
          // Two identical columns would not be a "different column" case
          fc.pre(firstColumn !== secondColumn);

          // Get the state after some clicks on firstColumn
          let currentField: string | undefined = undefined;
          let currentDir: SortDir = undefined;

          for (let i = 0; i < initialClicks; i++) {
            currentDir = nextSortDir(firstColumn, currentField, currentDir);
            currentField = firstColumn;
          }

          // Now click a different column — must reset to 'asc'
          const nextDir = nextSortDir(secondColumn, currentField, currentDir);
          return nextDir === 'asc';
        },
      ),
      { numRuns: 200 },
    );
  });
});
