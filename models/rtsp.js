const mongoose = require('mongoose');

const schemaRTSP = new mongoose.Schema({
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
  esteNecesaraOperatia: [Boolean]
});

module.exports = mongoose.model('rtsp', schemaRTSP);