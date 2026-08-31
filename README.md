# DonutSMP AFK bot

A small Mineflayer bot that connects a Microsoft Minecraft account to
`donutsmp.net`. It disables physics and blocks outgoing movement packets.

## Import into Hostless or another hosting service

Import this GitHub repository as a normal **web app**:

- Runtime: Node.js 22 or newer
- Install command: `npm ci`
- Start command: `npm start`
- Optional environment variable: `MINECRAFT_VERSION=1.21.11`

The bot automatically opens the host's assigned `PORT` and serves a small JSON
status response so TCP or HTTP health checks pass. If the platform does not set
`PORT`, the health server stays disabled.

Open the deployment logs after its first start. Follow the Microsoft device-code
login link printed there. Never upload or commit the generated `auth-cache`
folder because it contains Microsoft authentication tokens.

Hosts with temporary filesystems can lose the login cache after a restart or
redeployment, requiring you to sign in again.

## Run locally

```bash
cd ~/Desktop/DonutSMP-AFK-Node
npm start -- your-microsoft-email@example.com
```

The first run opens Microsoft's device-code login. Tokens stay in `auth-cache/`.
Press `Ctrl+C` to stop.

On macOS, a notification appears if the connection drops. On other systems,
dropouts are written to the deployment logs before the bot reconnects.
