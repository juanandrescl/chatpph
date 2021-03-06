const express = require('express')
const app = express()
var path = require('path')
var fs = require('file-system')
const siofu = require('socketio-file-upload')

console.log('aca')
console.log(path.resolve(__dirname))

// replace below key with your own server files
var options = {
  key: fs.readFileSync(path.resolve('./certs/certificate.key')),
  cert: fs.readFileSync(path.resolve('./certs/certificate.crt'))
}

var clients = {}
var connected_users = []
var https = require('https').createServer(options, app)
var io = require('socket.io')(https)

// chat port listens
// https.listen(3000, function () {
const PORT = process.env.PORT || 3000
https.listen(PORT, function () {
  console.log('listening @ *:' + PORT)
})

io.on('connection', function (socket) {
  console.log('socket')
  console.log(socket)
  // Socket File Upload
  fs.mkdir(path.resolve('./uploads/chat_attachments'))
  var uploader = new siofu()
  uploader.mode = '0666'
  uploader.dir = path.resolve('./uploads/chat_attachments')

  uploader.listen(socket)
  uploader.on('saved', function (event) {
    console.log('saved')
    console.log(event)
    event.file.clientDetail.filename = event.file.base
    event.file.clientDetail.fileext = path.extname(event.file.name)
  })

  // add new user's id to socket.
  socket.on('add-user', function (data) {
    console.log('add user')
    console.log(data)
    clients[data.userId] = {
      'socket': socket.id
    }
    connected_users.push(data.userId)
    io.sockets.emit('connected-users', { users_connected: connected_users })
  })

  // sending messsages to require person
  socket.on('send_msg', function (data) {
    console.log('send_msg')
    console.log(data)
    if (clients[data.user_id]) {
      io.sockets.connected[clients[ data.user_id ].socket].emit('send_msg', data)
    } else {
      console.log('User does not exist')
    }
  })

  // sending history messages
  socket.on('send_history_msg', function (data) {
    console.log('data')
    console.log(data)
    if (clients[data.user_id]) {
      io.sockets.connected[clients[ data.user_id ].socket].emit('send_history_msg', data)
    } else {
      console.log('Chat history user not exist')
    }
  })

  socket.on('send_files', function (data) {
    console.log('send_files')
    console.log(data)
    if (clients[data.user_id]) {
      io.sockets.connected[clients[ data.user_id ].socket].emit('send_files', data)
    } else {
      console.log('Somehow file did not receive')
    }
  })

  // Removing the socket on disconnect
  socket.on('disconnect', function () {
    console.log('disconnect')

    for (var name in clients) {
      if (clients[name].socket === socket.id) {
        delete clients[name]
        break
      }
    }
  })
})
