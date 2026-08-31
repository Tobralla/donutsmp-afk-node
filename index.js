const { execFile } = require('node:child_process')
const path = require('node:path')
const mineflayer = require('mineflayer')

const server = 'donutsmp.net'
const version = process.env.MINECRAFT_VERSION || '1.21.11'
const account = process.argv[2] || 'donutsmp-afk'
const movementPackets = new Set(['position', 'position_look', 'look', 'flying'])

let bot
let reconnectTimer
let stopped = false
let lastReason = 'Connection lost'

function log(message) {
  console.log(`[${new Date().toLocaleTimeString()}] ${message}`)
}

function appleScriptText(value) {
  return `"${String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"').replace(/[\r\n]+/g, ' ')}"`
}

function notify(message) {
  log(`DROPOUT: ${message}`)
  execFile('/usr/bin/osascript', [
    '-e',
    `display notification ${appleScriptText(message)} with title "DonutSMP AFK" sound name "Basso"`,
  ], () => {})
}

function microsoftLogin(code) {
  const userCode = code.user_code?.trim()
  const url = code.verification_uri_complete
    || (userCode ? `https://login.live.com/oauth20_remoteconnect.srf?otc=${encodeURIComponent(userCode)}` : code.verification_uri)

  console.log('\nMicrosoft login required')
  if (userCode) console.log(`Code: ${userCode}`)
  if (url) {
    console.log(`Open: ${url}\n`)
    execFile('/usr/bin/open', [url], () => {})
  }
}

function connect() {
  log(`Connecting to ${server} with Minecraft ${version}...`)
  lastReason = 'Connection lost'

  bot = mineflayer.createBot({
    host: server,
    port: 25565,
    username: account,
    auth: 'microsoft',
    version,
    profilesFolder: path.join(__dirname, 'auth-cache'),
    onMsaCode: microsoftLogin,
    physicsEnabled: false,
    keepAlive: true,
    hideErrors: true,
  })

  const client = bot._client
  const originalWrite = client.write.bind(client)
  client.write = (packetName, packet) => {
    if (movementPackets.has(packetName)) return
    return originalWrite(packetName, packet)
  }

  bot.once('login', () => log(`Logged in as ${bot.username}. Movement packets are blocked.`))
  bot.once('spawn', () => log(`Connected to ${server}. Press Ctrl+C to stop.`))
  bot.on('kicked', (reason) => {
    try { lastReason = `Kicked: ${typeof reason === 'string' ? reason : JSON.stringify(reason)}` }
    catch { lastReason = 'Kicked from the server' }
  })
  bot.on('error', (error) => { lastReason = error.message || 'Connection error' })
  bot.once('end', (reason) => {
    if (stopped) return
    const message = lastReason === 'Connection lost' && reason ? reason : lastReason
    notify(`${message}. Reconnecting in 5 seconds.`)
    reconnectTimer = setTimeout(connect, 5_000)
  })
}

function stop() {
  stopped = true
  if (reconnectTimer) clearTimeout(reconnectTimer)
  log('Stopping...')
  try { bot?.quit('Stopped from command line') } catch {}
  setTimeout(() => process.exit(0), 250)
}

process.once('SIGINT', stop)
process.once('SIGTERM', stop)

connect()
