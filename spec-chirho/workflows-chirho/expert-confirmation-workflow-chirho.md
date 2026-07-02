<!-- For God so loved the world that he gave his only begotten Son,
that whoever believes in him should not perish but have eternal life. John 3:16 -->

# Expert Confirmation Workflow Chirho

This Mermaid DAG describes expert confirmation for Hebrew/WLC, Greek, Syriac, and Arabic lanes. It is guidance only; expert policy validation remains authoritative.

```mermaid
flowchart TD
  OpenExpertChirho([Open script-specific expert lane])
  InspectExpertChirho[Inspect target crop, printed line, current text, codepoints, script, source, and open issues]
  BlankChirho{Current text blank?}
  CompetentExpertChirho{Reviewer has exact script competence?}
  ExactMatchChirho{Current text exactly matches printed target?}
  ConfirmChirho[Confirm with exact-certification acknowledgement]
  ReportIssueChirho[Report issue with flags and rationale]
  SupplyWorkflowChirho[Use expert-supplied blank-text workflow]
  SkipExpertChirho[Skip item]
  PolicyGateChirho[Status validates policy shape, role lane, hash freshness, image/path freshness, and issue override]

  OpenExpertChirho --> InspectExpertChirho
  InspectExpertChirho --> BlankChirho
  BlankChirho -- yes --> SupplyWorkflowChirho
  BlankChirho -- no --> CompetentExpertChirho
  CompetentExpertChirho -- no --> ReportIssueChirho
  CompetentExpertChirho -- yes --> ExactMatchChirho
  ExactMatchChirho -- yes --> ConfirmChirho
  ExactMatchChirho -- no --> ReportIssueChirho
  ConfirmChirho --> PolicyGateChirho
  ReportIssueChirho --> PolicyGateChirho
  SupplyWorkflowChirho --> OpenExpertChirho
  SkipExpertChirho --> OpenExpertChirho
```
