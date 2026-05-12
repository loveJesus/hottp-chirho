<!-- For God so loved the world that he gave his only begotten Son,
     that whoever believes in him should not perish but have eternal life. John 3:16 -->

<script lang="ts">
  let { children } = $props();
</script>

<svelte:head>
  <title>HOTTP Barthélemy Review — hottp-chirho.bible.systems</title>
  <meta name="description" content="Review and correct Hebrew, Greek, and Syriac transcriptions from Barthélemy's Critique textuelle de l'Ancien Testament" />
  <link rel="canonical" href="https://hottp-chirho.bible.systems" />
  <meta property="og:title" content="HOTTP Barthélemy Transcription Review" />
  <meta property="og:description" content="Human-in-the-loop review tool for non-French text in Barthélemy's Critique textuelle de l'Ancien Testament" />
  <meta property="og:url" content="https://hottp-chirho.bible.systems" />
  <meta property="og:type" content="website" />
</svelte:head>

<div class="app-chirho">
  <header class="header-chirho">
    <nav class="nav-chirho">
      <a href="/" class="logo-chirho">HOTTP Barthélemy</a>
      <span class="subtitle-chirho">Critique textuelle de l'Ancien Testament</span>
    </nav>
  </header>

  <main class="main-chirho">
    {@render children()}
  </main>
</div>

<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0f0f0f;
    color: #e0e0e0;
    line-height: 1.6;
  }

  .app-chirho {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .header-chirho {
    background: #1a1a2e;
    border-bottom: 1px solid #2a2a4a;
    padding: 0.75rem 1.5rem;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .nav-chirho {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .logo-chirho {
    font-size: 1.25rem;
    font-weight: 700;
    color: #c9a84c;
    text-decoration: none;
  }

  .logo-chirho:hover {
    color: #e0c06a;
  }

  .subtitle-chirho {
    font-size: 0.85rem;
    color: #888;
    font-style: italic;
  }

  .main-chirho {
    flex: 1;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
    padding: 1.5rem;
  }
</style>
