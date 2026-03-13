# Multi-Line Selection Fixes

## Problems Identified

1. **Every period-ended sentence gets X buttons** - All occurrences of the same sentence text get highlighted, causing duplicate removes
2. **Previous lines auto-labeled** - When selecting multi-line text, adjacent sentences with the same label also get labeled
3. **Over-matching in consecutive sentences** - The algorithm includes too many sentences in the match

## Root Causes

### Issue 1: Regex Highlight Duplication
- Current: Uses regex `/text/gi` to find ALL occurrences of sentence text in document
- Result: If "Limitation of Liability" appears twice, both get marked even if only one was labeled
- Fix: Match and highlight only the FIRST occurrence per sentence

### Issue 2: Multi-sentence Greedy Matching
- Current: Finds ANY consecutive sentences that combined contain the selection
- Result: Including nearby sentences that shouldn't be labeled
- Fix: Only label sentences whose text actually contributes to the selected text

### Issue 3: No Position Tracking
- Current: Doesn't track where in the document the selection came from
- Result: Can't verify we're labeling the right location
- Fix: Use the selection's document position to determine which sentences to label

## Proposed Solution

### Step 1: Better Multi-Line Matching Algorithm

```
1. For selected text:
   - Find START sentence: first sentence partially or fully contained in selection
   - Find END sentence: last sentence partially or fully contained in selection
   - Only label sentences between START and END
   - Verify combined text actually contains the selection
   - Don't go beyond +/- 2 sentences from start/end point
```

### Step 2: Position-Aware Highlighting

```
1. Instead of regex-based highlighting:
   - Track sentence IDs that have labels
   - When generating HTML, for each sentence in document:
     - Check if this exact sentence text matches a labeled sentence ID
     - Only highlight on first match (mark as found)
     - Don't use global regex flag
2. Result: Each sentence highlighted max once
```

### Step 3: Exact Sentence ID Matching

```
1. Build a UNIQUE mapping of normalized sentence text → sentence ID
2. Each highlighted segment tracks the specific sentence ID it came from
3. When highlighting, find the text and mark it with that specific ID
4. Result: Can't accidentally highlight the same text twice with different IDs
```

## Implementation Changes

**File: document-viewer.component.ts**

### Change 1: Simpler Multi-Line Selection
- Replace consecutive sentence loop with position-based matching
- Only include sentences that start/end the selection range
- Limit to maximum 3-4 sentences

### Change 2: ID-Safe Highlighting  
- Track highlighted sentence IDs to prevent duplicates
- Use non-global regex with position tracking
- Only highlight each unique text once

### Change 3: Better Error Messages
- Show which sentences were found
- Show if any potential duplicates were detected

## Testing Strategy

1. **Single-line tests**: "Limitation of Liability" text appears twice → only first highlights
2. **Multi-line tests**: Select 2-3 sentences spanning periods → only those label, no extras
3. **Duplicate prevention**: Label a text, then select it again → still shows as labeled but no duplicate
4. **Remove button**: Click X on any highlight → only that specific instance removes
