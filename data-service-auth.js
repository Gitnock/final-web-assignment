const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

var userSchema = new Schema({
  "userName": {
    "type": String,
    "unique": true
  },
  "password": String,
  "email": String,
  "loginHistory": [{ dateTime: Date, userAgent: String }],
});

let User; // to be defined on new connection (see initialize)

module.exports.initialize = function () {
  return new Promise(function (resolve, reject) {
    let db = mongoose.createConnection("mongodb+srv://enock:Onlivegaming1@senecaweb-m4iqp.mongodb.net/web322_lab6?retryWrites=true&w=majority");
    db.on('error', (err) => {
      reject(err); // reject the promise with the provided error
    });
    db.once('open', () => {
      User = db.model("users", userSchema);
      resolve();
    });
  });
};

module.exports.registerUser = function (userData) {
  return new Promise(function (resolve, reject) {
    if (userData.password != userData.password2) {
      reject("Passwords do not match");
    } else {
      bcrypt.genSalt(10, function (err, salt) { // Generate a "salt" using 10 rounds
        bcrypt.hash(userData.password, salt, function (err, hash) { // encrypt the password: "myPassword123"
          if (err) {
            reject("There was an error encrypting the password")
          } else {
            // TODO: Store the resulting "hash" value in the DB 
            userData.password = hash;
            var newUser = new User(userData);
            newUser.save((err) => {
              if (err) {
                if (err.code == 11000) {
                  reject("Username already taken");
                } else {
                  reject("Cannot create a new user: " + err.message);
                }
              } else {
                resolve();
              }
            });
          }
        });
      });
    }

  });
};

module.exports.checkUser = function (userData) {
  return new Promise(function (resolve, reject) {
    User.find({ userName: userData.userName })
      .then((users) => {
        bcrypt.compare(userData.password, users[0].password)
          .then(() => {
            users[0].loginHistory.push({ dateTime: (new Date()).toString(), userAgent: userData.userAgent });
            User.update({ userName: users[0].userName },
              { $set: { loginHistory: users[0].loginHistory } },
              { multi: false })
              .exec()
              .then(() => {
                resolve(users[0]);
              })
              .catch((err) => {
                reject("There was an error verifying the user: " + err);
              });
          })
      })
      .catch((err) => {
        reject("Unable to find user: " + userData.userName);
      });
  });
};



