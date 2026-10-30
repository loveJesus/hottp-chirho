<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData, ActionData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();
  let fragmentChirho = $state('');
  onMount(() => { fragmentChirho = window.location.hash; });
  const destinationChirho = $derived(data.returnPathChirho.includes('#') ? data.returnPathChirho : data.returnPathChirho + fragmentChirho);
</script>
<svelte:head><title>Open HOTTP</title><meta name="robots" content="noindex, nofollow" /></svelte:head>
<section class="reviewer-access-chirho" aria-labelledby="access-heading-chirho">
  <h1 id="access-heading-chirho">{data.signedInChirho ? 'You’re signed in' : 'Open HOTTP'}</h1>
  {#if data.signedInChirho}
    <p>Your browser stays signed in for eight hours.</p>
    <a href={destinationChirho}>Continue reading →</a>
    <form method="POST" action="?/logoutChirho"><button type="submit">Sign out</button></form>
    <p>Signing out does not erase tab-local drafts. Download them before closing this tab.</p>
  {:else if !data.configuredChirho}<p role="status">Reader access is temporarily unavailable. Please try again later.</p>
  {:else}
    <p>Enter the shared password to start reading and reviewing.</p>
    <form method="POST" action={`?/loginChirho&return-chirho=${encodeURIComponent(destinationChirho)}`}>
      <label>Password <input name="password_chirho" type="password" autocomplete="current-password" required maxlength="1000" /></label>
      {#if form?.errorChirho}<p role="alert">{form.errorChirho}</p>{/if}
      <button type="submit">Open reader</button>
    </form>
  {/if}
</section>
<style>
  .reviewer-access-chirho{max-width:480px;margin:50px auto;padding:24px;color:#343b30;background:#f7f5ef;border-radius:12px;}h1{font-size:1.7rem;margin:24px 0 16px;}p{line-height:1.6;}form{display:grid;gap:18px;margin:24px 0;}label{display:grid;gap:7px;}input{width:100%;box-sizing:border-box;padding:12px;border:1px solid #9da792;border-radius:5px;font:inherit;background:white;color:#222;}button{padding:12px;border:0;border-radius:5px;background:#345c3a;color:white;font:inherit;cursor:pointer;}[role=alert]{color:#92351e;}a{color:#345c3a;}
</style>
