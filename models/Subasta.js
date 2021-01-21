const { Schema, model } = require("mongoose");

const SubastaSchema = new Schema({
  codigo: { type: String, required: true },
  vendedor: { type: String, required: true },
  boleto: { type: String, required: true },
  mensajes: [],
});

module.exports = model("Subasta", SubastaSchema);