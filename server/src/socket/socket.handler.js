export const initSocket = (io) => {
  io.on('connection', (socket) => {
    socket.on('join-group', (groupId) => {
      if (groupId) socket.join(`group:${groupId}`)
    })

    socket.on('leave-group', (groupId) => {
      if (groupId) socket.leave(`group:${groupId}`)
    })
  })
}

export const emitToGroup = (io, groupId, event, data) => {
  io.to(`group:${groupId}`).emit(event, data)
}
