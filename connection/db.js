const mysql = require("mysql");

const connection = mysql.createConnection({
  // host: 'https://server.intdnspanel.com:2083/'
  host: "localhost",
  database: "cryptora_vamikalive",
  user: "root",
  password: "",
});


exports.connection = connection;
