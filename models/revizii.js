const mongoose = require('mongoose');

const schemaRevizie = new mongoose.Schema({
  _id: String,
  Cod_Echivalent_Client: String,
  Desen_Revizie: String,
  esteNecesaraOperatia: [Boolean],
  Numar_Program: [String] // NULL / Numarul de program
});

// Se pot adauga campuri extra ce sa stocheze proiectia 3D ca atare, etc.

module.exports = mongoose.model('revizii', schemaRevizie);