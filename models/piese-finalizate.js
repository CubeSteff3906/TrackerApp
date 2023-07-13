const mongoose = require('mongoose');

const schemaPieseFinalizate = new mongoose.Schema({
  Numar_comanda: {
    type: String,
    required: true
  },
  RTSP: {
    type: String,
    required: true
  },
  Cod_client: {
    type: String,
    required: true
  },
  nume: {
    type: String,
    required: true
  },
  cantitateaTotala: {
    type: Number,
    required: true
  },
  cantitateRebut: Number,
  dataInitiere: Date,
  dataFinalizare: Date,
  rezumatOperatiiFinalizate: [String],
  timpDeExecutieTotal: String
});

module.exports = mongoose.model('piese-finalizate', schemaPieseFinalizate);