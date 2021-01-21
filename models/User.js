const { Schema, model } = require("mongoose");

const UserSchema = new Schema({
  name: { type: String, required: true },
  rut: { type: String, required: true },
  password: { type: String, required: true },
  picture: { type: String, required: false},
  dinero: { type: String, required: false},
  boletos: [],
});

module.exports = model("User", UserSchema);