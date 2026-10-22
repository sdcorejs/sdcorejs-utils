---
"@sdcorejs/utils": patch
---

Redraw the 17 OPERATORS SVG fragments for clearer comparison and filter icons at small sizes.

- C1: Widen the greater-than and less-than signs to distinguish them from navigation chevrons.
- C2: Align and shorten the inclusive comparison signs within the shared drawing area.
- C3: Enlarge the string-match pills to 19x10 and their filled segments to 6x4.
- C4: Use the same (17,5) to (7,19) slash for negated operators and NULL, with NOT_NULL as the ring-and-dot exception.
- C5: Change IN from a ring with a dot to the set-membership sign, and NOT_IN to its slashed counterpart.
- C6: Change NULL to a continuous ring with a slash and NOT_NULL from a solid disc to a ring with a small center dot.

IN and NOT_NULL change visual meaning together in this changeset: the ring-and-dot motif formerly used for IN now represents NOT_NULL. Also narrow EQUAL and adjust BETWEEN endpoint spacing and dot sizes.

Operator values, order, localization keys, array type, exports, and filter evaluation semantics are unchanged. SVG sizing and stroke width remain consumer-owned.
