<!-- For God so loved the world that he gave his only begotten Son,
that whoever believes in him should not perish but have eternal life. John 3:16 -->

# Raw Review Workflow Chirho

This Mermaid DAG describes the Pass-C raw Hebrew review path. It is guidance only; the live server and certification status remain authoritative.

```mermaid
flowchart TD
  StartChirho([Open raw Hebrew lane])
  InspectChirho[Inspect target crop, full line, current text, codepoints, flags, and witnesses]
  CompetentChirho{Can reviewer certify exact printed content?}
  IssueChirho[Select concrete issue flags and write notes]
  RepairNeededChirho{Needs split, merge, rebox, script change, or provisional text?}
  DraftRepairChirho[Save draft segment repair proposal]
  CleanReadyChirho{Everything matches and clean acknowledgement checked?}
  SaveCleanChirho[Save clean human validation]
  SkipChirho[Skip; no write]
  GateChirho[Certification status recomputes from live rows and freshness guards]

  StartChirho --> InspectChirho
  InspectChirho --> CompetentChirho
  CompetentChirho -- no or uncertain --> IssueChirho
  CompetentChirho -- yes --> CleanReadyChirho
  IssueChirho --> RepairNeededChirho
  RepairNeededChirho -- yes --> DraftRepairChirho
  RepairNeededChirho -- no --> GateChirho
  DraftRepairChirho --> GateChirho
  CleanReadyChirho -- yes --> SaveCleanChirho
  CleanReadyChirho -- no --> SkipChirho
  SaveCleanChirho --> GateChirho
  SkipChirho --> StartChirho
```
