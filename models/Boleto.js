const { Schema, model } = require("mongoose");

const BoletoSchema = new Schema({
  codigo: { type: String, required: false },
  descripcion: { type: String, required: true },
  lugar: { type: String, required: true },
  valor: { type: String, required: true },
  hora: { type: String, required: false },
  dueno: { type: String, required: false },
  vendido: { type: String, required: false },
  vendiendo: { type: String, required: false, default: "No" },
});

module.exports = model("Boleto", BoletoSchema);