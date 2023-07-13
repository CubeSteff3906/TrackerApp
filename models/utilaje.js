const mongoose = require('mongoose');

const schemaUtilaje = new mongoose.Schema({
  nume: String,
  operatii: [String] // Contine numele operatiilor care pot fi efectuate cu utilajul
  // Vom mai crea un meniu in admin pentru adaugare utilaj si adaugare operatii in utilaj
});

module.exports = mongoose.model('utilaje', schemaUtilaje);