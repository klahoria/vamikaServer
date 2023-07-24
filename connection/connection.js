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
let adminSocket = null;
let userSocket = null;
let clients = {};

io.on("connection", (socket) => {
  app.set("socket", socket);
  app.use((req, res, next) => {
    req.userSocket = socket;
    next();
  });

  clients[socket.id] = socket;

  console.log("A user connected.", socket.id);

  socket.on("join", async (data) => {
    try {
      console.log(data);
      if (data.role === "admin") {

        let query = `select * from  admin_socket_details where admin_id = ?`;
        db.connection.query(query, [data.userId], (err, result) => {
          if (err) {
            console.log(err);
            return;
          }
          console.log(result)
          if (result && result.length > 0) {
            let sql2 = `update  admin_socket_details set is_deleted = 1 where admin_id = ?`;
            db.connection.query(sql2, [data.userId], (err, result_1) => {
              AdminenrtyforSocket({ userId: data.userId, id: socket.id });
            });
          } else {
            AdminenrtyforSocket({ userId: data.userId, id: socket.id });
          }
        });

        console.log("Admin joined.");
      } else if (data.role === "user") {
        userSocket = socket;
        console.log("User joined.");
        let query = `select * from user_socket_records where email = ?`;
        db.connection.query(query, [data.email], (err, result) => {
          if (err) {
            console.log(err);
            return;
          }
          if (result && result.length > 0) {
            let sql2 = `update user_socket_records set is_deleted = 1 where email = ?`;

            db.connection.query(sql2, [data.email], (err, result_1) => {
              console.log(result_1.affectedRows, "updated all other fiels");
              enrtyforSocket({ email: data.email, id: socket.id });
            });
          } else {
            enrtyforSocket({ email: data.email, id: socket.id });
          }
        });
        socket.emit("joined", { id: socket.id });
      }
    } catch (error) {
      console.log(error);
    }
  });

  const enrtyforSocket = (data) => {
    let sql_2 = `Insert into user_socket_records (email,socket_id,created_at) VALUES (?,?,NOW())`;

    db.connection.query(sql_2, [data.email, data.id], (err, result) => {
      console.log(result);
      if (result.affectedRows > 0) {
        console.log("entry added to db");
      }
      // if(result.affectedRows)
    });
  };

  const AdminenrtyforSocket = (data) => {
    let sql_2 = `Insert into admin_socket_details (admin_id,admin_socket,created_at) VALUES (?,?,NOW())`;

    db.connection.query(sql_2, [data.userId, data.id], (err, result) => {
      console.log(result);
      if (result.affectedRows > 0) {
        console.log("entry added to db");
      }
      // if(result.affectedRows)
    });
  };

  socket.on("request", (data) => {
    console.log(data,'request');
    let query = `select * from user_socket_records where email = ? AND is_deleted = 0  ORDER BY created_at DESC LIMIT 1`;
    db.connection.query(query, [data.email], (err, result) => {
      console.log(result);
      if (socket) {
        socket.broadcast.emit("show_popup", data);
      }
    });
  });

  socket.on("accept_request", (data) => {
    if (data && data.status === "accept") {
      socket.broadcast.emit("request_status", {
        status: 200,
        message: "Request accepted.",
        userToken: data.data.socket,
      });
    } else {
      socket.broadcast.emit("request_status", {
        status: 503,
        message: "Request canceled.",
        userToken: data.data.socket,
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
