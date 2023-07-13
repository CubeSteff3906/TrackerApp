const mongoose = require('mongoose');

const schemaComenziInCreare = new mongoose.Schema({
  Numar_comanda: {
    type: String,
    required: true
  },
  Piese: {
    type: [String],
    required: true
  },
  stadiuOperatie: [String]
});

module.exports = mongoose.model('comenzi-in-creare', schemaComenziInCreare);