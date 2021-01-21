const { Schema, model } = require("mongoose");

const MensajeSchema = new Schema({
  telf: { type: String, required: true },
  hora: { type: String, required: false },
});

module.exports = model("Mensaje", MensajeSchema);