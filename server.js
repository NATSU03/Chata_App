const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const createAdapter = require("@socket.io/redis-adapter").createAdapter;
const redis = require("redis");
require("dotenv").config();
const { createClient } = redis;
const {userJoin, getCurrentUser, userLeave, getRoomUsers,} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "ChatCord Bot";

// (async () => {
//   pubClient = createClient({ url: "redis-19164.c264.ap-south-1-1.ec2.cloud.redislabs.com" });
//   await pubClient.connect();
//   subClient = pubClient.duplicate();
//   io.adapter(createAdapter(pubClient, subClient));
// })();

// (async () => {
//   pubClient = createClient({password: 'B4FRuSho7JWNI6vMMIiN9gWZSTwZukZQ',socket: {host: 'redis-19164.c264.ap-south-1-1.ec2.cloud.redislabs.com',port: 1916}})
//   await pubClient.connect()
//   subClient = pubClient.duplicate();
//   io.adapter(createAdapter(pubClient, subClient));

// })();


// const client = createClient({password: 'B4FRuSho7JWNI6vMMIiN9gWZSTwZukZQ',socket: {host: 'redis-19164.c264.ap-south-1-1.ec2.cloud.redislabs.com',port: 1916}});

// const redisClient = redis.createClient(10797,"redis-10797.c264.ap-south-1-1.ec2.cloud.redislabs.com",{ no_ready_check: true});
// redisClient.auth("sT6NJhwSeQrEj3Gap9OhzuMuTmxoHoja", function (err) {
//   if (err) throw err;
// });


//Run when client connects
io.on("connection", (socket) => {
  console.log(io.of("/").adapter);
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit("message", formatMessage(botName, "Welcome to ChatCord!"));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
