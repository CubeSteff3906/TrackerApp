const mongoose = require('mongoose');

const schemaPieseInCurs = new mongoose.Schema({
  // Informatii comanda
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

module.exports = mongoose.model('piese-in-curs', schemaPieseInCurs);