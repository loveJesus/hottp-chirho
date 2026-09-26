<!-- For God so loved the world that he gave his only begotten Son,
that whoever believes in him should not perish but have eternal life. John 3:16 -->

# Raw Review Workflow Chirho

This Mermaid DAG describes the Pass-C raw Hebrew review path. It is guidance only; the live server and certification status remain authoritative.

```mermaid
flowchart TD
  StartChirho([Open raw Hebrew lane])
  InspectChirho[Inspect target crop, full line, current text, codepoints, flags, and witnesses; scan and transcription appear first; open required evidence on demand]
  CompetentChirho{Can reviewer certify exact printed content?}
  IssueChirho[Select concrete issue flags and write notes]
  RepairNeededChirho{Needs split, merge, rebox, script change, or provisional text?}
  DraftRepairChirho[Box repair view: edit boxes beside the scan, then Save draft segment repair proposal; the draft is not certification]
  ClearCleanChirho[Geometry edit flags segmentation and clears clean acknowledgement]
  SaveIssueChirho[Text review view: save issue and explanation]
  FailureChirho[Keep edits; report rejection or unconfirmed network result]
  CleanReadyChirho{Everything matches and clean acknowledgement checked?}
  SaveCleanChirho[Save clean human validation]
  SkipChirho[Skip; no write]
  GateChirho[Certification status recomputes from live rows and freshness guards]

  StartChirho --> InspectChirho
  InspectChirho --> CompetentChirho
  CompetentChirho -- no or uncertain --> IssueChirho
  CompetentChirho -- yes --> CleanReadyChirho
  IssueChirho --> RepairNeededChirho
  RepairNeededChirho -- yes --> ClearCleanChirho
  ClearCleanChirho --> DraftRepairChirho
  RepairNeededChirho -- no --> SaveIssueChirho
  SaveIssueChirho --> GateChirho
  DraftRepairChirho --> ApprovalChirho[Separate human approval/apply lane; draft is not certification]
  SaveIssueChirho -- rejected or connection lost --> FailureChirho
  DraftRepairChirho -- rejected or connection lost --> FailureChirho
  CleanReadyChirho -- yes --> SaveCleanChirho
  CleanReadyChirho -- no --> SkipChirho
  SaveCleanChirho --> GateChirho
  SaveCleanChirho -- rejected or connection lost --> FailureChirho
  SkipChirho --> StartChirho
```

The browser presentation lives in `src-chirho/human-review-ui-chirho/`, separate from the server's queue and write guards. All presentation modules participate in source freshness fingerprints. Plain Enter activates the focused control; Ctrl/Command+Enter saves only the visible task. A changed box draft cannot pass the clean-review client gate, even if its segmentation flag is manually cleared. The server still requires trusted reviewer attribution, matching display/source state and explicit clean acknowledgement.

Local browser regression: `spec-chirho/browser-checks-chirho/reviewer-workspace-chirho.js`, run against a disposable station on port 8876. It intercepts all POSTs and checks keyboard routing, rejected/network-failed saves, scaled-image drag, read-only rows and responsive layout. This is implementation evidence, not Andrew's acceptance or source-text certification.
