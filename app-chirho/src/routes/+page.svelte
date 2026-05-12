<!-- For God so loved the world that he gave his only begotten Son,
     that whoever believes in him should not perish but have eternal life. John 3:16 -->

<script lang="ts">
  let { data } = $props();

  const VOLUME_DESCRIPTIONS_CHIRHO: Record<number, string> = {
    1: "Josué — Rois, Chroniques, Esdras, Néhémie (1982)",
    2: "Isaïe, Jérémie, Lamentations (1986)",
    3: "Ézéchiel, Daniel et les 12 Prophètes (1992)",
    4: "Psaumes (2005)",
    5: "Job, Proverbes, Qohélet, Cantique (2015)",
  };
</script>

<div class="dashboard-chirho">
  <h1>Barthélemy — Critique textuelle de l'Ancien Testament</h1>
  <p class="intro-chirho">
    Pilot review of non-French apparatus (Hebrew · Greek · Syriac · Latin) extracted across the 5-volume series.
  </p>

  <div class="volumes-grid-chirho">
    {#each data.volumesChirho as volChirho}
      {@const progressChirho = volChirho.totalPagesChirho > 0
        ? Math.round((volChirho.approvedPagesChirho / volChirho.totalPagesChirho) * 100)
        : 0}
      <a
        href="/volumes-chirho/{volChirho.volumeNumberChirho}"
        class="volume-card-chirho"
      >
        <div class="volume-header-chirho">
          <h2>Volume {volChirho.volumeNumberChirho}</h2>
          <span class="progress-badge-chirho" class:complete-chirho={progressChirho === 100}>
            {progressChirho}%
          </span>
        </div>
        <p class="volume-desc-chirho">
          {VOLUME_DESCRIPTIONS_CHIRHO[volChirho.volumeNumberChirho] ?? ""}
        </p>
        <div class="stats-chirho">
          <div class="stat-chirho">
            <span class="stat-value-chirho">{volChirho.totalPagesChirho}</span>
            <span class="stat-label-chirho">pages</span>
          </div>
          <div class="stat-chirho">
            <span class="stat-value-chirho">{volChirho.totalSegmentsChirho}</span>
            <span class="stat-label-chirho">segments</span>
          </div>
          <div class="stat-chirho">
            <span class="stat-value-chirho">{volChirho.nonFrenchSegmentsChirho}</span>
            <span class="stat-label-chirho">non-french</span>
          </div>
        </div>
        <div class="progress-bar-chirho">
          <div
            class="progress-fill-chirho"
            style="width: {progressChirho}%"
          ></div>
        </div>
      </a>
    {/each}
  </div>

  <div class="footer-links-chirho">
    <a href="/known-words-chirho" class="footer-link-chirho">📖 Known-words manager</a>
  </div>

  {#if data.volumesChirho.length === 0}
    <div class="empty-state-chirho">
      <p>No volumes synced yet.</p>
    </div>
  {/if}
</div>

<style>
  .dashboard-chirho {
    max-width: 1000px;
  }

  h1 {
    font-size: 1.6rem;
    margin-bottom: 0.5rem;
    color: #c9a84c;
  }

  .intro-chirho {
    color: #999;
    margin-bottom: 2rem;
  }

  .volumes-grid-chirho {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.25rem;
  }

  .volume-card-chirho {
    background: #1a1a2e;
    border: 1px solid #2a2a4a;
    border-radius: 8px;
    padding: 1.25rem;
    text-decoration: none;
    color: inherit;
    transition: border-color 0.2s, transform 0.2s;
  }

  .volume-card-chirho:hover {
    border-color: #c9a84c;
    transform: translateY(-2px);
  }

  .volume-header-chirho {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .volume-header-chirho h2 {
    font-size: 1.15rem;
    color: #e0e0e0;
  }

  .progress-badge-chirho {
    font-size: 0.8rem;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    background: #2a2a4a;
    color: #888;
    font-weight: 600;
  }

  .progress-badge-chirho.complete-chirho {
    background: #1a3a1a;
    color: #4caf50;
  }

  .volume-desc-chirho {
    font-size: 0.85rem;
    color: #888;
    margin-bottom: 1rem;
  }

  .stats-chirho {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 0.75rem;
  }

  .stat-chirho {
    display: flex;
    flex-direction: column;
  }

  .stat-value-chirho {
    font-size: 1.1rem;
    font-weight: 700;
    color: #e0e0e0;
  }

  .stat-label-chirho {
    font-size: 0.7rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .progress-bar-chirho {
    height: 4px;
    background: #2a2a4a;
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill-chirho {
    height: 100%;
    background: #c9a84c;
    border-radius: 2px;
    transition: width 0.3s;
  }

  .footer-links-chirho {
    margin-top: 2rem;
    text-align: center;
  }

  .footer-link-chirho {
    color: #c9a84c;
    text-decoration: none;
    font-size: 0.9rem;
  }

  .footer-link-chirho:hover {
    text-decoration: underline;
  }

  .empty-state-chirho {
    text-align: center;
    padding: 3rem;
    color: #666;
  }
</style>
