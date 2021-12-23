<script lang="ts">
  import { onMount } from 'svelte';
  import Pagedown from '$lib/Pagedown.svelte';

  let pagedown: Pagedown;

  onMount(() => {
    pagedown.setListener(() => {
      //console.log('Pagedown modified!');
    })
    //pagedown.setValue('Hello');
  })
</script>

<h1>Editor</h1>
<Pagedown bind:this={pagedown} />