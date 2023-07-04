const mongoose = require('mongoose');

const schemaComenziFinalizate = new mongoose.Schema({
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
  }
});

module.exports = mongoose.model('comenzi-finalizate', schemaComenziFinalizate);