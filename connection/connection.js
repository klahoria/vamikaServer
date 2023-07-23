var http = require("http");
const app = require("../app.js");
const cors = require("cors");

var server = http.Server(app);

app.use(cors());

// const {Server} = require("socket.io");

const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

// const io = new Server(httpServer, {
//   cors: cors()
// });

// Store the connected admin socket to send notifications
let adminSocket = null;
let userSocket = null;

io.on("connection", (socket) => {
  app.set("socket", socket);
  app.use((req, res, next) => {
    req.userSocket = socket;
    next();
  });
  
  console.log("A user connected.", socket.id);

  socket.on("join", (data) => {
    console.log(data);
    if (data.role === "admin") {
      adminSocket = socket;
      console.log("Admin joined.");
    } else if (data.role === "user") {
      console.log("User joined.");
    }
  });

  socket.on("request", (data) => {
    if (adminSocket) {
      adminSocket.emit("show_popup", data);
    }
  });

  socket.on("accept_request", (data) => {
    if (data && data.status === "accept") {
       socket.broadcast.emit("request_status", {
        status: 200,
        message: "Request accepted.",
      });
    } else {
       socket.broadcast.emit("request_status", {
        status: 503,
        message: "Request canceled.",
      });
    }
  });

  socket.on("disconnect", () => {
    if (socket === adminSocket) {
      console.log("Admin disconnected.");
      adminSocket = null;
    } else {
      console.log("A user disconnected.");
    }
  });
});

module.exports = { app, io, server, userSocket };
