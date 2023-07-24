var http = require("http");
const app = require("../app.js");
const cors = require("cors");
const db = require("./db.js");

var server = http.createServer(app);

app.use(cors());

// const {Server} = require("socket.io");

const io = require("socket.io")(server, {
  maxHttpBufferSize: 10 * 1024,
  cors: {
    origin: "http://localhost:3000",
  },
});

// const io = new Server(httpServer, {
//   cors: cors()
// });

// Store the connected admin socket to send notifications
let admins = new Set();
let users = new Set();

io.on("connection", (socket) => {
  app.set("socket", socket);
  app.use((req, res, next) => {
    req.userSocket = socket;
    next();
  });

  console.log("A user connected.", socket.id);

  socket.on("join", async (data) => {
    try {
      if (data.role === "admin") {
        console.log("Admin joined.");
        admins.add(socket);
      } else if (data.role === "user") {
        users.add(socket);
        socket.emit("joined", { id: socket.id });
      }
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("request", async (data) => {
    console.log(data);
    try {
      let admin = getAvailableAdmin();
      if (admin) {
        admin.join(data.room);
        socket.join(data.room);
        admin.currentRequest = socket;
        console.log(data.room);
        io.to(data.room).emit("show_popup", data);
      } else [
        console.log('admin not available')
      ]

      // assignUserToAdminRoom(socket, availableAdmin, data);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("accept_request", (data) => {
    if (data && data.status === "accept") {
      io.to(data.room).emit("request_status", {
        status: 200,
        message: "Request accepted.",
        userToken: data.data.socket,
      });
    } else {
      try {
        io.to(data.room).emit("request_status", {
          status: 503,
          message: "Request canceled.",
          userToken: data.data.socket,
        });
      } catch (error) {
        console.log(error);
      }
      delete socket.currentRequest;
    }
  });

  socket.on("disconnect", () => {
    // if (socket === admin) {
    //   console.log("Admin disconnected.");
    //   adminSocket = null;
    // } else {
    //   console.log("A user disconnected.");
    // }
  });
});

function getAvailableAdmin() {
  for (const adminSocket of admins.values()) {
    if (!adminSocket.currentRequest) {
      return adminSocket;
    }
  }
  return null;
}

function assignUserToAdminRoom(userSocket, adminSocket, data) {
  console.log(data);
  const room = data.room;
  userSocket.join(room);
  console.log(
    `User ${userSocket.id} joined room ${room} with admin ${adminSocket.id}`
  );
  adminSocket.currentRequest = userSocket;
  console.log(
    `Admin ${adminSocket.id} is now handling user ${userSocket.id}'s request.`
  );
  // Emit a popup notification to the admin
  io.to(room).emit("show_popup", data);
}

// Usage example: Generate a 6-character unique random room ID

module.exports = { app, io, server, users };

function getAvailableAdmin() {
  for (const adminSocket of admins.values()) {
    if (!adminSocket.currentRequest) {
      return adminSocket;
    }
  }
  return null;
}
