# Test Contracts - README

This folder contains 5 sample markdown contract files for testing the Clause Tracker application. Each file contains various clause types that match the 10 clause types in the system.

## Files Included

### 1. sample-agreement-1.md
**Theme:** Service Agreement
**Good for testing:** All basic clause types
**Clause types included:**
- Limitation of Liability
- Termination for Convenience
- Confidentiality
- Indemnification
- Governing Law
- Force Majeure
- Warranties
- Insurance
- Payment Terms

---

### 2. sample-agreement-2.md
**Theme:** Vendor Agreement
**Good for testing:** Multi-clause paragraphs and complex text
**Clause types included:**
- Confidentiality (long multi-line clause)
- Limitation of Liability (very long, spans multiple paragraphs)
- Termination
- Non-Compete
- Warranties
- Dispute Resolution

---

### 3. sample-agreement-3.md
**Theme:** Software License Agreement
**Good for testing:** Multi-line selections and long clauses
**Clause types included:**
- Insurance Requirements (complex requirements)
- Force Majeure (detailed event listing)
- Governing Law (specific jurisdiction)
- Indemnification Obligations
- Confidentiality and Non-Disclosure
- Termination and Survival
- Limited Warranty
- Limitation of Liability (in caps)
- Intellectual Property

---

### 4. sample-agreement-4.md
**Theme:** Consulting Services Agreement
**Good for testing:** Multi-line text selection (longest file)
**Clause types included:**
- Confidentiality (very detailed, multi-line)
- Limitation of Liability (with specific amounts)
- Force Majeure (comprehensive)
- Insurance and Risk Management
- Warranties and Representations
- Termination Provisions
- Governing Law
- Non-Compete
- General Provisions

---

### 5. sample-agreement-5.md
**Theme:** Supply Agreement
**Good for testing:** Simple and direct clause identification
**Clause types included:**
- Governing Law and Jurisdiction
- Warranty Provisions
- Limitation of Liability and Damages Clause
- Termination for Convenience
- Confidential Information
- Force Majeure Protection
- Insurance Coverage
- Non-Compete Clause
- Indemnification
- Good Faith and Cooperation

---

## How to Use for Testing

### Single-Line Selection Testing
1. Upload **sample-agreement-5.md** (simplest file)
2. Select individual short sentences like "Either party may terminate this Agreement without cause upon sixty (60) days prior written notice."
3. Assign clause types using the modal

### Multi-Line Selection Testing
1. Upload **sample-agreement-4.md** (best for multi-line testing)
2. Try selecting text that spans multiple lines, e.g.:
   - "During the term of this Agreement and for eighteen (18) months thereafter, Consultant shall not provide services to any of Client's direct competitors..."
   - "Both parties agree to maintain strict confidentiality regarding all proprietary, technical, and business information..."
3. Test that multi-line selections properly label all matching sentences

### Complex Clause Testing
1. Upload **sample-agreement-3.md**
2. Try highlighting long, complex clauses like:
   - The entire "LIMITATION OF LIABILITY" section (spans multiple lines)
   - "INSURANCE REQUIREMENTS" with specific dollar amounts
   - "INDEMNIFICATION OBLIGATIONS" with numbered sub-clauses

### All Clause Types Testing
1. Test each clause type across different files
2. Verify that each of the 10 clause types gets highlighted with the correct color:
   - Limitation of Liability (Yellow)
   - Termination for Convenience (Red/Pink)
   - Non-Compete (Cyan/Blue)
   - Confidentiality (Green)
   - Indemnification (Gray)
   - Governing Law (Navy/Dark Blue)
   - Force Majeure (Purple/Pink)
   - Warranties (Teal/Cyan)
   - Insurance (Rose/Pink)
   - Other (Gray)

---

## Testing Checklist

- [ ] Successfully upload each markdown file
- [ ] Single-line text selection works
- [ ] Multi-line text selection works
- [ ] Remove button (✕) appears on highlighted text
- [ ] Remove button removes the clause label
- [ ] Dashboard shows updated clause counts after labeling
- [ ] Different clause types show different highlight colors
- [ ] Success/error notifications display correctly
- [ ] Sidebar clause summary updates in real-time

---

## Notes for Multi-Line Selection Testing

The **sample-agreement-4.md** file has been specifically designed with long, multi-line clauses that span across 2-4 lines of text. When testing multi-line selection:

1. Start selection from the beginning of a sentence
2. Drag across 2-3 lines of text
3. Release the mouse
4. Click on the clause type button in the modal

Watch the browser console (F12 → Console tab) to see debug logs that show:
- What text was selected (normalized)
- How many sentences matched
- Whether matching worked correctly

Good luck with testing!
