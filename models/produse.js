const mongoose = require('mongoose');

const schemaProduse = new mongoose.Schema({
  Cod_reper: {
    type: String,
    required: true
  },
  Denumire: {
    type: String,
    required: true
  },
  Revizii: [String]
});

module.exports = mongoose.model('produse', schemaProduse);