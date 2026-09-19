<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->
<script lang="ts">
  import type { PageData, ActionData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>
<svelte:head><title>Reviewer sign-in · HOTTP</title><meta name="robots" content="noindex" /></svelte:head>
<main class="reviewer-access-chirho">
  <a href={data.returnPathChirho}>← Back to reading</a>
  <h1>{data.signedInChirho ? 'Reviewer access' : 'Sign in to confirm readings'}</h1>
  <p>You can read and draft without signing in. Saving a confirmation requires the existing review-station credentials.</p>
  {#if data.signedInChirho}
    <p>Signed in with the shared reviewer account. Confirmations identify that account, not an individual reader. Access expires after eight hours.</p>
    <form method="POST" action="?/logoutChirho"><button type="submit">Sign out</button></form>
    <p>Signing out does not erase tab-local drafts. Download them before closing this tab.</p>
  {:else if !data.configuredChirho}<p role="status">Sign-in is not configured yet. Your drafts can still be downloaded.</p>
  {:else}
    <form method="POST" action={`?/loginChirho&return-chirho=${encodeURIComponent(data.returnPathChirho)}`}>
      <label>Reviewer username <input name="user_chirho" autocomplete="username" required maxlength="200" /></label>
      <label>Password <input name="password_chirho" type="password" autocomplete="current-password" required maxlength="1000" /></label>
      {#if form?.errorChirho}<p role="alert">{form.errorChirho}</p>{/if}
      <button type="submit">Sign in</button>
    </form>
  {/if}
</main>
<style>
  .reviewer-access-chirho{max-width:480px;margin:50px auto;padding:24px;color:#343b30;background:#f7f5ef;border-radius:12px;}h1{font-size:1.7rem;margin:24px 0 16px;}p{line-height:1.6;}form{display:grid;gap:18px;margin:24px 0;}label{display:grid;gap:7px;}input{width:100%;box-sizing:border-box;padding:12px;border:1px solid #9da792;border-radius:5px;font:inherit;background:white;color:#222;}button{padding:12px;border:0;border-radius:5px;background:#345c3a;color:white;font:inherit;cursor:pointer;}[role=alert]{color:#92351e;}a{color:#345c3a;}
</style>
