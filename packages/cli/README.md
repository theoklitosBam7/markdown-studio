# markdown-studio

Launch Markdown Studio locally in your browser from an npm package.

## Quick Start

```sh
npx markdown-studio@latest
```

## Installation

### Global Install

```sh
npm install -g markdown-studio
markdown-studio
```

### NPX (No installation)

```sh
npx markdown-studio@latest
```

## Usage

```sh
markdown-studio [options]
```

### Options

| Option            | Description                       | Default               |
| ----------------- | --------------------------------- | --------------------- |
| `--host <host>`   | Host to bind to                   | `127.0.0.1`           |
| `--port <number>` | Port to listen on                 | Random available port |
| `--no-open`       | Do not open browser automatically | `false`               |
| `--version, -v`   | Show version number               | -                     |
| `--help, -h`      | Show help message                 | -                     |

### Examples

Start on default host and random port (browser opens automatically):

```sh
npx markdown-studio@latest
```

Start on specific port:

```sh
npx markdown-studio@latest --port 4173
```

Start on all interfaces without opening browser:

```sh
npx markdown-studio@latest --host 0.0.0.0 --no-open
```

Show version:

```sh
npx markdown-studio@latest --version
```

## How It Works

This package serves the production Markdown Studio web app over localhost and opens your default browser. It delivers the browser experience, not the Electron desktop shell, so native desktop-only file integration is not included.

### Browser Behavior

- **Chromium browsers** can use the File System Access API on `localhost`
- **Other browsers** fall back to the existing picker and download flows
- The server is **local-only** by default because it binds to `127.0.0.1`

## Development

### Build

```sh
pnpm build
```

### Test Locally

After building, you can test the CLI locally:

```sh
# From the packages/cli directory
node dist/cli.mjs

# Or using npx with local path
npx ./packages/cli
```

## License

MIT
