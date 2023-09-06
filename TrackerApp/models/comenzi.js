const mongoose = require('mongoose');

const schemaComenzi = new mongoose.Schema({
  Identificator: {
    type: String,
    required: true
  },
  Stadiu_Comanda: {
    type: String,
    required: true
  },
  Loturi: {
    type: [String],
    required: true
  }
});

module.exports = mongoose.model('comenzi', schemaComenzi);