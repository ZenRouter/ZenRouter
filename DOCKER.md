# Docker

Run ZenRouter in a container. Published image: [`joyccn/zenrouter`](https://hub.docker.com/r/joyccn/zenrouter) — multi-platform `linux/amd64` + `linux/arm64`.

---

# 👤 For Users

## Quick start

```bash
docker run -d \
  -p 20128:20128 \
  -v "$HOME/.zenrouter:/app/data" \
  -e DATA_DIR=/app/data \
  --name zenrouter \
  joyccn/zenrouter:latest
```

App listens on port `20128`. Open: http://localhost:20128

## Manage container

```bash
docker logs -f zenrouter        # view logs
docker stop zenrouter           # stop
docker start zenrouter          # start again
docker rm -f zenrouter          # remove
```

## Data persistence

```bash
-v "$HOME/.zenrouter:/app/data" \
-e DATA_DIR=/app/data
```

Without `DATA_DIR`, the app falls back to `~/.zenrouter/` (macOS/Linux) or `%APPDATA%\zenrouter\` (Windows). In the container, `DATA_DIR=/app/data` makes the bind mount work.

Data layout under `$DATA_DIR/`:

```text
$DATA_DIR/
├── db/
│   ├── data.sqlite       # main SQLite database
│   └── backups/          # auto backups
└── ...                   # certs, logs, runtime configs
```

Host path: `$HOME/.zenrouter/db/data.sqlite`
Container path: `/app/data/db/data.sqlite`

## Optional env vars

```bash
docker run -d \
  -p 20128:20128 \
  -v "$HOME/.zenrouter:/app/data" \
  -e DATA_DIR=/app/data \
  -e PORT=20128 \
  -e HOSTNAME=0.0.0.0 \
  -e DEBUG=true \
  --name zenrouter \
  joyccn/zenrouter:latest
```

## Optional Headroom sidecar

The ZenRouter image does not bundle Python or Headroom. To use Headroom in Docker, run it as a separate service and point ZenRouter at that proxy:

```yaml
services:
  zenrouter:
    image: joyccn/zenrouter:latest
    ports:
      - "20128:20128"
    volumes:
      - "$HOME/.zenrouter:/app/data"
    environment:
      DATA_DIR: /app/data
      HEADROOM_URL: http://headroom:8787
    depends_on:
      - headroom

  headroom:
    image: ghcr.io/chopratejas/headroom:latest
    ports:
      - "8787:8787"
```

In the dashboard, open `Endpoint` → `Token Saver` → `Headroom`, confirm the URL is `http://headroom:8787`, recheck status, then enable Headroom.

If Headroom runs on the Docker host instead of as a sidecar, use `http://host.docker.internal:8787` on macOS/Windows. On Linux, add `--add-host=host.docker.internal:host-gateway` or the equivalent compose `extra_hosts` entry.

## Update to latest

```bash
docker pull joyccn/zenrouter:latest
docker rm -f zenrouter
# re-run the quick start command
```

---

# 🛠 For Developers

## Build image locally (test)

```bash
cd app && docker build -t zenrouter .

docker run --rm -p 20128:20128 \
  -v "$HOME/.zenrouter:/app/data" \
  -e DATA_DIR=/app/data \
  zenrouter
```

## Publish (automatic via CI)

Push a git tag `v*` → GitHub Actions builds multi-platform (amd64+arm64) and pushes to:
- `ghcr.io/zenrouter/zenrouter:v{version}` + `:latest`
- `joyccn/zenrouter:v{version}` + `:latest`

```bash
# Use scripts/release.js (recommended)
node scripts/release.js "Release title" "Notes"

# Or manually
git tag v0.4.x && git push origin v0.4.x
```

Workflow: `app/.github/workflows/docker-publish.yml`
