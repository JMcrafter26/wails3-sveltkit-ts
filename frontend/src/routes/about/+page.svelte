<svelte:head>
	<title>About</title>
</svelte:head>

<section class="hero">
	<p class="eyebrow">About</p>
	<h1>A small, static frontend for Wails.</h1>
	<p class="lede">
		SvelteKit uses pathname routing here. A small Wails asset handler serves the single-page-app
		shell for unknown paths, so links stay clean, including <code>/about</code>.
	</p>
</section>

<section class="card">
	<p>
		The frontend is built by <code>@sveltejs/adapter-static</code> into
		<code>frontend/dist</code>, which the Go binary embeds with <code>go:embed</code>.
	</p>
	<p>
		Go bindings are generated into <code>frontend/bindings</code>. Run
		<code>wails3 task common:generate:bindings</code> after changing bound services.
	</p>
	<p><a href="/">Back to the Greet demo</a></p>
</section>
