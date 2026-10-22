# SvelteKit + TypeScript template for Wails v3

A minimal, reusable [Wails v3](https://v3.wails.io/) custom template using
SvelteKit 3, TypeScript, Vite, and pnpm.

It includes:

- SvelteKit 3 with pathname routing and static output
- TypeScript and `svelte-check`
- A Go `Greet` service exposed through Wails bindings
- A custom Go `time` event
- Home and About pages
- pnpm as the default package manager

This repository is a **template**, not a runnable app. Use `wails3 init` to
create a project from it.

## Requirements

- Go 1.26+
- Wails v3 beta, tested with `v3.0.0-beta.34`
- Node.js 22.17+
- pnpm, tested with `12.14.0`
- The platform dependencies required by Wails

Install the matching Wails CLI:

```sh
go install github.com/wailsapp/wails/v3/cmd/wails3@v3.0.0-beta.34
```

If `wails3` is not on your `PATH`:

```sh
export PATH="$PATH:$(go env GOPATH)/bin"
```

Check your platform setup with:

```sh
wails3 doctor
```

## Create a project

### From this local checkout

```sh
wails3 init \
  -n MyApp \
  -t /absolute/path/to/wails3-sveltkit-ts \
  -mod github.com/YOUR_GITHUB_USER/myapp

cd MyApp
wails3 dev
```

Use an absolute path, and keep the template directory name ending in `-ts`.
Wails v3 decides whether to generate TypeScript or JavaScript bindings from the
`-t` path or URL suffix, not from `template.yaml`.

### From GitHub

Push this directory to a repository whose name ends in `-ts`, for example
`wails3-sveltkit-ts`, then:

```sh
wails3 init \
  -n MyApp \
  -t https://github.com/JMcrafter26/wails3-sveltkit-ts \
  -mod github.com/YOUR_GITHUB_USER/myapp

cd MyApp
wails3 dev
```

The repository name **must** end in `-ts`. If it does not, Wails generates
JavaScript bindings and the TypeScript frontend will not compile.

`wails3 init` creates the project, renders the `.tmpl` files, and runs
`go mod tidy`. Frontend dependencies are installed by the first `wails3 dev` or
`wails3 build`.

## Run the app

```sh
wails3 dev
```

This generates bindings, installs frontend dependencies, starts Vite on port
`9245`, and launches the app. Go changes trigger a rebuild; Svelte changes use
Vite hot reload.

To use a different Vite port:

```sh
wails3 dev -port 12345
```

## Build

```sh
wails3 build
```

The binary is written to `bin/`.

To create a platform package:

```sh
wails3 package
```

## Project layout

After `wails3 init`, the generated project looks like this:

```text
MyApp/
  main.go                    Wails app, SPA asset handler, window, event loop
  greetservice.go            Bound Greet service
  go.mod
  Taskfile.yml               Project tasks
  build/                     Wails platform assets and config
  frontend/
    src/
      app.html               HTML shell (rendered from app.html.tmpl)
      app.css                Base styles
      routes/
        +layout.svelte        App shell and navigation
        +layout.ts            SPA/SSR page options
        +page.svelte          Greet demo (rendered from +page.svelte.tmpl)
        about/+page.svelte    About page
    bindings/                 Generated Wails bindings (ignored by git)
    dist/                     Static frontend build (ignored by git)
    package.json
    vite.config.ts
```

The `frontend/dist` directory is embedded into the Go binary with `go:embed`.

## How the starter works

### Greet binding

`GreetService` is registered in `main.go`:

```go
Services: []application.Service{
    application.NewService(&GreetService{}),
},
```

The home page imports the generated service and calls it:

```ts
import { GreetService } from '../../bindings/github.com/YOUR_GITHUB_USER/myapp';

const message = await GreetService.Greet('Ada');
```

### Go time event

`main.go` registers a typed event and emits the current time every second:

```go
application.RegisterEvent[string]("time")
```

```go
app.Event.Emit("time", now)
```

The home page subscribes to it with `@wailsio/runtime`:

```ts
Events.On('time', (event) => {
    time = String(event.data);
});
```

### Pathname routing

The frontend uses SvelteKit's pathname router and a static SPA fallback:

```ts
router: { type: 'pathname' },
adapter: adapter({
    pages: 'dist',
    assets: 'dist',
    fallback: 'index.html',
    strict: true
})
```

`frontend/src/routes/+layout.ts` disables SSR and prerendering and keeps URLs
canonical without trailing slashes:

```ts
export const ssr = false;
export const prerender = false;
export const trailingSlash = 'never';
```

Internal links use normal paths:

```svelte
<a href="/about">About</a>
```

Wails v3 beta.34 does not serve `index.html` automatically for arbitrary
extensionless paths. `main.go` therefore wraps the asset file server with
`spaHandler`. It serves real files normally and falls back to `index.html` only
for unknown GET/HEAD paths without a file extension. Dynamic routes such as
`/items/42` work on first load and reload without any route list or per-route
setup.

The handler gives Wails' own `/wails/...` runtime and service routes priority,
and it is bypassed in development (`FRONTEND_DEVSERVER_URL`), where Vite handles
routing. Missing assets that have file extensions still return a 404.

This is a one-time helper. Adding a new SvelteKit page does not require changing
the Go code.

### Template files

Files ending in `.tmpl` are rendered by Wails during `wails3 init`:

- `main.go.tmpl` → `main.go`
- `frontend/src/app.html.tmpl` → `frontend/src/app.html`
- `frontend/src/routes/+page.svelte.tmpl` → `frontend/src/routes/+page.svelte`

The page template uses `{{js .ModulePath}}` to generate the correct bindings
import for the project's Go module path.

## Customize

### Add a page

Create `frontend/src/routes/settings/+page.svelte` and link to it with:

```svelte
<a href="/settings">Settings</a>
```

### Add a Go service

Add a struct and register it in `main.go`:

```go
type CounterService struct{}

func (c *CounterService) Increment(n int) int {
    return n + 1
}
```

```go
Services: []application.Service{
    application.NewService(&GreetService{}),
    application.NewService(&CounterService{}),
},
```

Then regenerate bindings from the project root:

```sh
wails3 task common:generate:bindings
```

### Regenerate bindings

From the project root:

```sh
wails3 task common:generate:bindings
```

or directly:

```sh
wails3 generate bindings -ts -i
```

Bindings are written to `frontend/bindings/` and ignored by git. `wails3 dev`
and `wails3 build` also regenerate bindings automatically.

### Frontend-only development

The full app should normally be run with `wails3 dev`, because the Go backend
provides the bindings and events.

If you only need the Vite dev server, generate bindings first from the project
root:

```sh
wails3 task common:generate:bindings
```

Then start Vite:

```sh
cd frontend
pnpm install
pnpm dev
```

The page will load in a browser, but Wails bindings and events require the Wails
dev host to function.

### Type checking

```sh
cd frontend
pnpm run check
```

### Change the app icon

Replace `build/appicon.png` in the generated project. Wails regenerates the
platform-specific icons during the build.

### Use another package manager

pnpm is the default. Override it for one command:

```sh
PACKAGE_MANAGER=npm wails3 build
```

Or change `PACKAGE_MANAGER` in `Taskfile.yml`.

### Change styles

Edit `frontend/src/app.css`. The starter has no Tailwind, ESLint, or Prettier
setup.

## Template development

Do not commit generated output:

- `frontend/node_modules/`
- `frontend/.svelte-kit/`
- `frontend/dist/`
- `frontend/bindings/`
- `bin/`
- a generated `build/` directory (Wails creates it in initialized projects)

Test template changes by generating a fresh project:

```sh
TEMPLATE=/absolute/path/to/wails3-sveltkit-ts
rm -rf /tmp/wails-template-test
mkdir -p /tmp/wails-template-test

wails3 init \
  -n TestApp \
  -t "$TEMPLATE" \
  -d /tmp/wails-template-test \
  -mod github.com/example/testapp

cd /tmp/wails-template-test/TestApp
wails3 build
cd frontend
pnpm run check
```

## Troubleshooting

### Wails generated JavaScript bindings instead of TypeScript

The `-t` path or URL must end in `-ts`. Check that the template directory or
repository is named something like `wails3-sveltkit-ts`, then regenerate the
project.

Also verify the generated `build/Taskfile.yml` contains:

```text
-ts -i
```

### `wails3: command not found`

```sh
export PATH="$PATH:$(go env GOPATH)/bin"
```

Make sure the CLI version matches the template:

```sh
wails3 version
go install github.com/wailsapp/wails/v3/cmd/wails3@v3.0.0-beta.34
```

### Bindings are missing

From the project root, run:

```sh
wails3 task common:generate:bindings
```

or simply run `wails3 dev` or `wails3 build`, which generate them as part of the
build.

### Port 9245 is already in use

```sh
wails3 dev -port 12345
```

### Reloading `/about` returns 404

Make sure `main.go` still uses the SPA handler:

```go
dist, err := fs.Sub(assets, "frontend/dist")
if err != nil {
    log.Fatal(err)
}

Assets: application.AssetOptions{
    Handler: spaHandler(dist),
},
```

Using `application.AssetFileServerFS(assets)` directly only serves files that
exist. The `spaHandler` wrapper is what serves `index.html` for client-side
routes. In development, `FRONTEND_DEVSERVER_URL` is set and Vite handles the
fallback instead.

### Node version errors

SvelteKit 3.1 requires Node.js 22.17 or newer. Check with:

```sh
node --version
```

### Linux build dependencies

Run `wails3 doctor` and install the missing GTK4 and WebKitGTK 6.0 development
packages for your distribution.

### `svelte.config.js`

SvelteKit 3 reads its configuration from `frontend/vite.config.ts`. This
template does not use a separate `svelte.config.js`.

## Version notes

- Wails: `v3.0.0-beta.34`
- SvelteKit: `3.1.0` (from `pnpm-lock.yaml`)
- Svelte: 5 with runes
- `@wailsio/runtime`: pinned to `3.0.0-beta.34`
- Node.js: 22.17+
- pnpm: tested with `12.14.0`

Keep `@wailsio/runtime` in sync with the Wails CLI version.
