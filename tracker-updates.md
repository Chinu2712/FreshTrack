# Tracker Updates

- **Attendance:** Added a configurable attendance target (75% by default), the number of consecutive classes needed to reach it, and messages for targets already met or impossible 100% targets.
- **CGPA:** Added optional credit inputs for both semesters. When both are provided, the estimated CGPA is credit-weighted; when both are blank, the existing simple average is used. Validation requires both credits together.
- **Data compatibility:** Saved attendance targets and credit inputs with the existing browser storage, while retaining support for older saved values.
- **Budget:** Confirmed the existing monthly budget, category expenses, remaining-balance calculation, and expense chart remain in place.
- **Verification:** Checked JavaScript syntax and tested tracker calculations, validation, chart data, and restoration of older saved data.
- **Commit:** `5fdbe46` — Add attendance targets and credit-weighted CGPA.
