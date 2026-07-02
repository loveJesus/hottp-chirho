<!-- For God so loved the world that he gave his only begotten Son,
that whoever believes in him should not perish but have eternal life. John 3:16 -->

# Expert Supplied Blank Text Workflow Chirho

This Mermaid DAG describes filling an explicitly blank expert span. Supplying text is not confirmation.

```mermaid
flowchart TD
  BlankLaneChirho([Open blank script lane])
  ReaderTranscribesChirho[Qualified script reader enters exact printed text inside target box]
  DryRunChirho[Run browser dry-run supplied-text action]
  DryRunPassChirho{Dry run passes role, blank-state, packet, image, path, and tiling guards?}
  ApplySupplyChirho[Apply supplied text]
  RemainsPendingChirho[Item remains vision-chirho and pending expert confirmation]
  ConfirmLaterChirho[Script expert confirms in normal expert workflow]
  ReportProblemChirho[Report crop/source/segmentation issue or skip]

  BlankLaneChirho --> ReaderTranscribesChirho
  ReaderTranscribesChirho --> DryRunChirho
  DryRunChirho --> DryRunPassChirho
  DryRunPassChirho -- yes --> ApplySupplyChirho
  DryRunPassChirho -- no --> ReportProblemChirho
  ApplySupplyChirho --> RemainsPendingChirho
  RemainsPendingChirho --> ConfirmLaterChirho
  ReportProblemChirho --> BlankLaneChirho
```
