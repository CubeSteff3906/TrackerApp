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
  // Orice rezumate legate de costul de productie al vreunei piese se vor stoca in Nexus.
});

module.exports = mongoose.model('rtsp', schemaRTSP);