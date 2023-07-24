// var http = require("http");
// const app = require("../app.js");
// const cors = require("cors");
// const db = require("./db.js");
// const crypto = require("crypto");
// const randomId = () => crypto.randomBytes(8).toString("hex");

// var server = http.createServer(app);

// app.use(cors());

// // const {Server} = require("socket.io");

// const io = require("socket.io")(server, {
//   maxHttpBufferSize: 10 * 1024,
//   cors: {
//     origin: "http://localhost:3000",
//   },
// });

// // const io = new Server(httpServer, {
// //   cors: cors()
// // });

// // Store the connected admin socket to send notifications
// let adminSocket = null;
// let userSocket = null;
// let clients = {};

// io.use(async (socket, next) => {
//   // const sessionID = socket.handshake.auth.sessionID;
//   // if (sessionID) {
//   //   const session = await sessionStore.findSession(sessionID);
//   //   if (session) {
//   //     socket.sessionID = sessionID;
//   //     socket.userID = session.userID;
//   //     socket.username = session.username;
//   //     return next();
//   //   }
//   // }
//   // const username = socket.handshake.auth.username;
//   // if (!username) {
//   //   return next(new Error("invalid username"));
//   // }
//   socket.sessionID = randomId();
//   socket.userID = randomId();
//   next();
// });

// io.on("connection", (socket) => {
//   app.set("socket", socket);
//   app.use((req, res, next) => {
//     req.userSocket = socket;
//     next();
//   });

//   clients[socket.id] = socket;

//   console.log("A user connected.", socket.id);

//   socket.emit("joined", {
//     sessionID: socket.sessionID,
//     userID: socket.userID,
//   });

//   socket.on("join", async (data) => {
//     try {
//       if (data.role === "admin") {
//         adminSocket = socket;
//         // let query = `select * from  admin_socket_details where admin_socket = ?`;
//         // db.connection.query(query, [data.email], (err, result) => {
//         //   if (err) {
//         //     console.log(err);
//         //     return;
//         //   }
//         //   if (result && result.length > 0) {
//         //     let sql2 = `update  admin_socket_details set is_deleted = 1 where admin_socket = ?`;

//         //     db.connection.query(sql2, [data.email], (err, result_1) => {
//         //       console.log(result_1.affectedRows, "updated all other fiels");
//         //       AdminenrtyforSocket({ email: data.email, id: socket.id });
//         //     });
//         //   } else {
//         //     AdminenrtyforSocket({ email: data.email, id: socket.id });
//         //   }
//         // });

//         console.log("Admin joined.");
//       } else if (data.role === "user") {
//         // userSocket = socket;
//         socket.join(socket.userID);
//         console.log("User joined.");
//         let query = `select * from user_socket_records where email = ?`;
//         db.connection.query(query, [data.email], (err, result) => {
//           if (err) {
//             console.log(err);
//             return;
//           }
//           if (result && result.length > 0) {
//             let sql2 = `update user_socket_records set is_deleted = 1 where email = ?`;

//             db.connection.query(sql2, [data.email], (err, result_1) => {
//               console.log(result_1.affectedRows, "updated all other fiels");
//               enrtyforSocket({ email: data.email, id: socket.id });
//             });
//           } else {
//             enrtyforSocket({ email: data.email, id: socket.id });
//           }
//         });
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   });

//   const enrtyforSocket = (data) => {
//     let sql_2 = `Insert into user_socket_records (email,socket_id,created_at) VALUES (?,?,NOW())`;

//     db.connection.query(sql_2, [data.email, data.id], (err, result) => {
//       console.log(result);
//       if (result.affectedRows > 0) {
//         console.log("entry added to db");
//       }
//       // if(result.affectedRows)
//     });
//   };

//   const AdminenrtyforSocket = (data) => {
//     let sql_2 = `Insert into  admin_socket_details (email,socket_id,created_at) VALUES (?,?,NOW())`;

//     db.connection.query(sql_2, [data.email, data.id], (err, result) => {
//       console.log(result);
//       if (result.affectedRows > 0) {
//         console.log("entry added to db");
//       }
//       // if(result.affectedRows)
//     });
//   };

//   socket.on("request", (data) => {
//     console.log(data);
//     let query = `select * from user_socket_records where email = ? AND is_deleted = 0  ORDER BY created_at DESC LIMIT 1`;
//     db.connection.query(query, [data.email], (err, result) => {
//       console.log(result);
//       if (adminSocket) {
//         adminSocket.emit("show_popup", data);
//       }
//     });
//   });

//   socket.on("accept_request", (data) => {
//     if (data && data.status === "accept") {
//       socket.to(data.data.socket).emit("request_status", {
//         status: 200,
//         message: "Request accepted.",
//         userToken: data.data.socket,
//       });
//     } else {
//       socket.to(data.data.socket).emit("request_status", {
//         status: 503,
//         message: "Request canceled.",
//         userToken: data.data.socket,
//       });
//     }
//   });

//   socket.on("disconnect", () => {
//     if (socket === adminSocket) {
//       console.log("Admin disconnected.");
//       adminSocket = null;
//     } else {
//       console.log("A user disconnected.");
//     }
//   });
// });

// module.exports = { app, io, server, userSocket };

const httpServer = require("http").createServer();
const Redis = require("ioredis");
const redisClient = new Redis();
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://localhost:8080",
  },
  adapter: require("socket.io-redis")({
    pubClient: redisClient,
    subClient: redisClient.duplicate(),
  }),
});

const { setupWorker } = require("@socket.io/sticky");
const crypto = require("crypto");
const randomId = () => crypto.randomBytes(8).toString("hex");

const { RedisSessionStore } = require("./sessionStore");
const sessionStore = new RedisSessionStore(redisClient);

const { RedisMessageStore } = require("./messageStore");
const messageStore = new RedisMessageStore(redisClient);

io.use(async (socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;
  if (sessionID) {
    const session = await sessionStore.findSession(sessionID);
    if (session) {
      socket.sessionID = sessionID;
      socket.userID = session.userID;
      socket.username = session.username;
      return next();
    }
  }
  const username = socket.handshake.auth.username;
  if (!username) {
    return next(new Error("invalid username"));
  }
  socket.sessionID = randomId();
  socket.userID = randomId();
  socket.username = username;
  next();
});

io.on("connection", async (socket) => {
  // persist session
  sessionStore.saveSession(socket.sessionID, {
    userID: socket.userID,
    username: socket.username,
    connected: true,
  });

  // emit session details
  socket.emit("joined", {
    sessionID: socket.sessionID,
    userID: socket.userID,
  });

  // join the "userID" room
  socket.join(socket.userID);

  // fetch existing users
  const users = [];
  const [messages, sessions] = await Promise.all([
    messageStore.findMessagesForUser(socket.userID),
    sessionStore.findAllSessions(),
  ]);
  const messagesPerUser = new Map();
  messages.forEach((message) => {
    const { from, to } = message;
    const otherUser = socket.userID === from ? to : from;
    if (messagesPerUser.has(otherUser)) {
      messagesPerUser.get(otherUser).push(message);
    } else {
      messagesPerUser.set(otherUser, [message]);
    }
  });

  sessions.forEach((session) => {
    users.push({
      userID: session.userID,
      username: session.username,
      connected: session.connected,
      messages: messagesPerUser.get(session.userID) || [],
    });
  });
  socket.emit("users", users);

  // notify existing users
  socket.broadcast.emit("user connected", {
    userID: socket.userID,
    username: socket.username,
    connected: true,
    messages: [],
  });

  // forward the private message to the right recipient (and to other tabs of the sender)
  socket.on("private message", ({ content, to }) => {
    const message = {
      content,
      from: socket.userID,
      to,
    };
    socket.to(to).to(socket.userID).emit("private message", message);
    messageStore.saveMessage(message);
  });

  // notify users upon disconnection
  socket.on("disconnect", async () => {
    const matchingSockets = await io.in(socket.userID).allSockets();
    const isDisconnected = matchingSockets.size === 0;
    if (isDisconnected) {
      // notify other users
      socket.broadcast.emit("user disconnected", socket.userID);
      // update the connection status of the session
      sessionStore.saveSession(socket.sessionID, {
        userID: socket.userID,
        username: socket.username,
        connected: false,
      });
    }
  });
});

setupWorker(io);
