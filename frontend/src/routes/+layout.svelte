<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="app-shell">
	<header class="app-header">
		<span class="brand">Wails + SvelteKit</span>
		<nav>
			<a href="/">Home</a>
			<a href="/about">About</a>
		</nav>
	</header>

	<main>
		{@render children()}
	</main>
</div>
