# Downloaded polymer reference images — 2026-11-15

This batch contains eight downloaded reference images for polymer denominations ₱50, ₱100, ₱500, and ₱1,000 (front and back). The contributor confirmed permission to use the images.

`reference_inventory.csv` records their labels and source. These remain reference-only and are excluded from `data/annotations.csv` and all training/evaluation splits: downloaded images do not establish independent physical-note IDs, camera capture conditions, or note provenance. Do not describe predictions on this batch as real-world scan performance.

To make them eligible for the genuine-note training set, collect camera photos directly from physical polymer notes with distinct note IDs and record the capture metadata. The current tooling requires at least three distinct physical notes for every denomination included in a split.
