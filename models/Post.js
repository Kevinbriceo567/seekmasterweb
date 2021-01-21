const { Schema, model } = require("mongoose");

const PostSchema = new Schema({
  descripcion: { type: String, required: true },
  transmisor: { type: String, required: true },
  hora: { type: Date, required: false },
  likes: { type: String, required: false },
});

module.exports = model("Post", PostSchema);