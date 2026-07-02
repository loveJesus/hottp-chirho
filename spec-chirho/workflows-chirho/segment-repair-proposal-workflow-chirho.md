<!-- For God so loved the world that he gave his only begotten Son,
that whoever believes in him should not perish but have eternal life. John 3:16 -->

# Segment Repair Proposal Workflow Chirho

This Mermaid DAG describes the draft-only segment repair assistant. A proposal records a candidate repair; it does not edit live span files and does not certify text.

```mermaid
flowchart TD
  OpenRawChirho([Open write-capable raw review lane])
  FindProblemChirho[Find wrong split, merge, box, script, punctuation attachment, or unreadable script]
  ChooseKindChirho[Choose repair kind and write rationale]
  EditRowsChirho[Edit proposed rows: segment index, x, width, script, and provisional text]
  GeometryOkChirho{Rows are positive-width, contiguous, and cover full line?}
  SaveDraftChirho[Save draft repair proposal]
  NoLiveChangeChirho[Live spans and certification rows remain unchanged]
  LaterApplyChirho[Separate audited apply path may implement proposal after review]
  FixRowsChirho[Fix geometry or text proposal]

  OpenRawChirho --> FindProblemChirho
  FindProblemChirho --> ChooseKindChirho
  ChooseKindChirho --> EditRowsChirho
  EditRowsChirho --> GeometryOkChirho
  GeometryOkChirho -- yes --> SaveDraftChirho
  GeometryOkChirho -- no --> FixRowsChirho
  FixRowsChirho --> EditRowsChirho
  SaveDraftChirho --> NoLiveChangeChirho
  NoLiveChangeChirho --> LaterApplyChirho
```
