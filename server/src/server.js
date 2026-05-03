import 'dotenv/config'
import { createServer } from 'http'
import { Server } from 'socket.io'
import app from './app.js'
import { initSocket } from './socket/socket.handler.js'

const PORT = Number(process.env.PORT || 4000)
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }
})

initSocket(io)

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the existing server or set a different PORT in .env.`)
    process.exit(1)
  }

  console.error(err)
  process.exit(1)
})

httpServer.listen(PORT, () => {
  console.log(`SplitFast server running on :${PORT}`)
})

export { io }
