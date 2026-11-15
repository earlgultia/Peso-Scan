# Collecting and labeling genuine Philippine peso photos

## Safety, ownership, and privacy

- Photograph genuine circulating notes that you own or have permission to handle. Do not acquire notes through questionable sources, mark them, cut them, wet them, or alter security features.
- Keep a private collection log that connects an opaque `physical_note_id` to the actual note. Never put banknote serial numbers, contributor names, phone numbers, addresses, or account details in IDs, filenames, or CSV metadata.
- Obtain explicit permission from anyone contributing photographs and confirm they have the rights to the photos. Do not include faces, payment cards, receipts, or unrelated personal information in the frame.
- Banknote images can expose serial numbers. Keep raw photos private; do not upload them to public repositories, public datasets, issue trackers, or shared Colab notebooks. Share only with contributors who have permission. Restrict Drive access and delete copies when no longer needed.
- Do not crop or edit away a security feature to make a note appear more genuine. Keep the original photo unchanged. Any derived crops/augmentations belong in a generated area and must inherit the source note ID and split.

## Capture each physical note

1. Assign a random opaque ID such as `note-0007`. Assign one ID per actual physical banknote, even if several notes share a denomination and series.
2. Confirm denomination from the printed face value. Record the material and series only when you can confidently identify them; otherwise use `unknown` and request review. Do not infer the material from denomination alone.
3. Capture front and back, keeping the complete note and all edges visible. Use even lighting, avoid glare, and keep the camera roughly parallel.
4. Repeat captures across realistic conditions: indirect daylight, ordinary indoor light, dim-but-readable light, different backgrounds, distances, camera devices, and orientations. Keep glare and strong shadows out of most training photos, but include a small, clearly logged challenge set for evaluation. Make sure every denomination and physical-note split includes varied lighting; otherwise lighting can become a shortcut correlated with a class. Avoid making dozens of near-identical frames of one note; they do not replace additional physical notes.
5. Use original camera files where possible. Do not use screenshots of BSP pages, web images, scans of printed images, or synthetic/generated banknotes as training examples.
6. Record a separate CSV row for each image. Reuse the same `physical_note_id` for every view or recapture of that same note. Use a new ID for another physical note.

## Label review

- Use two-person review for denomination, side, material, and series where possible. Resolve disagreements before training; do not silently guess.
- A note's class label is its denomination. This first model is denomination classification only. It must not be described as checking authenticity or counterfeits.
- `genuine_source_confirmed=yes` records contributor provenance only. It does not certify the note. Exclude uncertain provenance from a genuine-only training set rather than representing it as verified.
- Keep a private label audit log (reviewer IDs can be opaque). Do not add serial numbers to that log.

## Dataset scale and leakage

Collect multiple distinct physical notes per denomination, preferably from different legitimate sources and in varied wear/capture conditions. Keep a private capture log noting lighting (daylight, indoor, dim, flash, shadow/glare), device, and session so evaluation can check failure modes. A split needs at least three distinct note IDs per class for the current tooling, but meaningful evaluation needs substantially more. Treat the 70/15/15 split as a starting point, not a guarantee of statistical quality. Reserve complete physical notes for testing, and report performance by lighting condition as well as overall; do not claim reliable detection across lighting based only on augmented training images.

Run validation before preparation. The prepared manifest assigns every image from a given `physical_note_id` to one split. Never manually move individual photos across splits. Do not tune the model against the held-out test set.

## Current workflow limitation

No dataset is included. The temporary synthetic images created by unit tests, if added later, must remain in operating-system temp directories and must never enter `data/raw/` or any model training run.
