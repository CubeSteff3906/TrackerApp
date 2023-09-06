const mongoose = require('mongoose');

const schemaOperatii = new mongoose.Schema({
  id: Number,
  nume: String,
  areProgram: Boolean
});

module.exports = mongoose.model('operatii2', schemaOperatii);