const mongoose = require('mongoose');

const schemaLoturi = new mongoose.Schema({
  _id: { // Numar de fisa
    type: String,
    required: true
  },
  Data: {
    type: String,
    required: true
  },
  Stadiu_lot : {
    type: String,
    required: true
  },
  Identificator: String, // Reprezinta comanda

  // O comanda contine mai multe loturi
  // Un lot poate avea mai multe fise de urmarire
  // (in special in cazul rebuturilor)
  Termen_Livrare: {
    type: String,
    required: true
  },
  Cod_reper: { // RTSP
    type: String,
    required: true
  },
  Denumire: {
    type: String,
    required: true
  },
  Numar_Lot: { // Reprezinta lotul
    type: String,
    required: true
  },
  cantitateaTotala: {
    type: Number,
    required: true
  },
  Desen: {
    type: String,
    required: true
  },
  Revizie: {
    type: String,
    required: true
  },
  Dimensiune_Semifabricat: {
    type: String,
    required: true
  },
  Certificat_Calitate: {
    type: String,
    required: true
  },
  cantitateRebut: Number,
  // Gestionarea comenzii in timp real
  esteNecesaraOperatia: [Boolean],
  stadiuOperatie: [String],
  cantitatePieseInCurs: [Number],
  cantitatePieseFinalizate: [Number],
  angajatOperatie: [String],
  utilajOperatie: [String],
  // Timpi de executie
  dataInitiere: { // a comenzii
    type: Date,
    required: true
  },
  dataFinalizare: Date,
  // Informatii pentru printarea fisei tehnologice + contabilizare
  dataInitiereOperatie: [Date], // data de la indexul i reprezinta data de initiere a operatiei i
  rezumatOperatiiFinalizate: [String], // dataInitiereOperatie si dataFinalizareOperatie sunt incluse in rezumat
  timpDeExecutieOperatie: [Number], // in minute, stocat la index aferent unui rezumat
  timpDeExecutieTotal: String // dataFinalizare - dataInitiere, exprimat in ore si minute si transformat in String
});

module.exports = mongoose.model('loturi', schemaLoturi);