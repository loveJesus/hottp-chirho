<!-- For God so loved the world that he gave his only begotten Son,
that whoever believes in him should not perish but have eternal life. John 3:16 -->

# Segment Repair Proposal Workflow Chirho

This Mermaid DAG describes the draft-only segment repair assistant. A proposal records a candidate repair; it does not edit live span files and does not certify text.

Every tool below edits one tiling: the line's boxes stay contiguous, positive-width,
and cover exactly `0..lineWidthPx`. The tiling edits themselves live in
`src-chirho/segment-tiling-edit-chirho.ts`, shared verbatim with the browser and
guarded by `src-chirho/check-segment-tiling-edit-chirho.ts`. Zoom-crop geometry is
in image pixels while span geometry is in line pixels; `cropFractionToLineXChirho`
and `lineXToCropFractionChirho` convert between them (vol-5 line images are stored
at about 0.667x, so mixing the two units puts the red box off the crop).

```mermaid
flowchart TD
  OpenRawChirho([Open write-capable raw review lane])
  FindProblemChirho[Find wrong split, merge, box, script, punctuation attachment, or unreadable script]
  ChooseKindChirho[Choose repair kind and write rationale]
  PickToolChirho{How is the segmentation wrong?}
  DragBoxChirho[Drag the red box or its handles: installTargetMarkerDraftDragChirho]
  MergeBoxesChirho[Tick adjacent boxes and merge them into one phrase: mergeRepairRowsChirho]
  SplitBoxChirho[Split the red-box row, or delete a row]
  DrawBoxChirho[Pick a script and drag a new box on the crop: drawnBoxTilingRowsChirho]
  ManualFirstChirho[Hard page: collapse the line to one box, then draw every box by hand: manualFirstTilingRowsChirho]
  EditRowsChirho[Edit proposed rows: segment index, x, width, script, and provisional text]
  GeometryOkChirho{Rows are positive-width, contiguous, and cover full line?}
  SaveDraftChirho[Save draft repair proposal]
  NoLiveChangeChirho[Live spans and certification rows remain unchanged]
  LaterApplyChirho[Audited apply lane implements approved proposals: see segment-repair-apply-lane-chirho.md]
  FixRowsChirho[Fix geometry or text proposal]

  OpenRawChirho --> FindProblemChirho
  FindProblemChirho --> ChooseKindChirho
  ChooseKindChirho --> PickToolChirho
  PickToolChirho -- box is on the wrong spot --> DragBoxChirho
  PickToolChirho -- one thing split across boxes --> MergeBoxesChirho
  PickToolChirho -- one box covers two things --> SplitBoxChirho
  PickToolChirho -- a printed word has no box at all --> DrawBoxChirho
  PickToolChirho -- the whole line is mis-segmented --> ManualFirstChirho
  ManualFirstChirho --> DrawBoxChirho
  DragBoxChirho --> EditRowsChirho
  MergeBoxesChirho --> EditRowsChirho
  SplitBoxChirho --> EditRowsChirho
  DrawBoxChirho --> EditRowsChirho
  EditRowsChirho --> GeometryOkChirho
  GeometryOkChirho -- yes --> SaveDraftChirho
  GeometryOkChirho -- no --> FixRowsChirho
  FixRowsChirho --> EditRowsChirho
  SaveDraftChirho --> NoLiveChangeChirho
  NoLiveChangeChirho --> LaterApplyChirho
```
