# 🌿 ZenRouter Docker Image

Official multi-architecture Docker container for **ZenRouter** — High-Performance AI Gateway & Multi-Provider Intelligent Routing Platform.

- **GitHub Repository**: [https://github.com/ZenRouter/ZenRouter](https://github.com/ZenRouter/ZenRouter)
- **NPM Package**: [@joyccn/zenrouter](https://www.npmjs.com/package/@joyccn/zenrouter)
- **Container Registry**: `joyccn/zenrouter:latest` & `ghcr.io/zenrouter/zenrouter:latest`

---

## 🚀 Quick Run

```bash
docker run -d \
  --name zenrouter \
  -p 20128:20128 \
  -v zenrouter-data:/root/.zenrouter \
  --restart unless-stopped \
  joyccn/zenrouter:latest
```

Open `http://localhost:20128` in your browser to access the dashboard.

---

## 🐳 Docker Compose

```yaml
services:
  zenrouter:
    image: joyccn/zenrouter:latest
    container_name: zenrouter
    restart: unless-stopped
    ports:
      - "20128:20128"
    volumes:
      - ./zenrouter-data:/root/.zenrouter
    environment:
      - PORT=20128
      - INITIAL_PASSWORD=admin12345
```

---

## 🔒 Key Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `20128` | Internal HTTP listening port |
| `DATA_DIR` | `/root/.zenrouter` | Persistent SQLite database and configuration directory |
| `INITIAL_PASSWORD` | `12345678` | Initial dashboard admin password |
| `JWT_SECRET` | Auto-generated | Session signing secret key |
