const mongoose = require('mongoose');

const schemaComenziInCurs = new mongoose.Schema({
  _id: {
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
  esteNecesaraOperatia: [Boolean],
  numeOperatie: [String],
  stadiuOperatie: [String],
  cantitatePieseFinalizate: [Number],
  angajatOperatie: [String],
  utilajOperatie: [String]
});

module.exports = mongoose.model('comenzi-in-curs', schemaComenziInCurs);