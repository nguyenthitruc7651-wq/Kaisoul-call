const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Phục vụ file giao diện static
app.use(express.static(__dirname));

// Quản lý người dùng kết nối (lưu tạm trên RAM)
const users = {}; 

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 1. Quản lý Đăng nhập & Trạng thái Online
  socket.on('register_user', (username) => {
    users[socket.id] = { username, id: socket.id };
    io.emit('update_user_list', Object.values(users));
  });

  // 2. Nhắn tin (Chat)
  socket.on('send_message', (data) => {
    // Gửi tin nhắn tới toàn bộ người dùng hoặc room cụ thể
    io.emit('receive_message', {
      sender: users[socket.id]?.username || 'Ẩn danh',
      text: data.text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });

  // 3. Signaling cho Gọi Video (WebRTC)
  socket.on('call_user', (data) => {
    io.to(data.userToCall).emit('incoming_call', {
      signal: data.signalData,
      from: socket.id,
      name: users[socket.id]?.username
    });
  });

  socket.on('answer_call', (data) => {
    io.to(data.to).emit('call_accepted', data.signal);
  });

  // 4. Xử lý Disconnect (Offline)
  socket.on('disconnect', () => {
    delete users[socket.id];
    io.emit('update_user_list', Object.values(users));
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server chạy tại: http://localhost:${PORT}`);
});
