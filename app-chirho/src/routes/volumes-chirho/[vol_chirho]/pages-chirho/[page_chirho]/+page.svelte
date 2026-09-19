<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->
<script lang="ts">
  import { page } from '$app/state';
  import PageReaderChirho from '$lib/page-reader-chirho/PageReaderChirho.svelte';
  import LegacyPageEditorChirho from '$lib/page-reader-chirho/LegacyPageEditorChirho.svelte';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

{#key data.pageDataChirho.idChirho}
  {#if page.url.searchParams.get('view-chirho') === 'tools-chirho' && data.volumeNumberChirho !== 5}
    <a class="back-to-reader-chirho" href="?">← Return to side-by-side reading</a>
    <LegacyPageEditorChirho {data} />
  {:else}
    {#if page.url.searchParams.get('view-chirho') === 'tools-chirho' && data.volumeNumberChirho === 5}<p class="back-to-reader-chirho">Volume 5's old line crops need repair. Use the calibrated full-page reader below.</p>{/if}
    <PageReaderChirho {data} />
  {/if}
{/key}

<style>
  .back-to-reader-chirho {display:block;margin:0 0 28px;color:#b8d8cd;}
</style>
