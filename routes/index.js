const express = require('express');
const router = express.Router();

const Angajati = require('../models/angajati');
const Loturi = require('../models/loturi');
const Revizii = require('../models/revizii');
const Produse = require('../models/produse')

router.get('/', async (req, res) => {
  res.render('index');
})

router.post('/', async (req, res) => {
  const idAngajat = req.body.idAngajat;
  const angajat = await Angajati.findOne({ _id: idAngajat });
  if (angajat) {
    if (angajat.pozitie === "Lucrator") {
      res.redirect(`/angajat?idAngajat=${idAngajat}`);
    } else if (angajat.pozitie === "Operator") {
      res.redirect(`/operator?idAngajat=${idAngajat}`);
    } else if (angajat.pozitie === "Administrator") {
      res.redirect(`/admin?idAngajat=${idAngajat}`); // Va redirectiona la admin/verifica-parola initial, dupa de acolo la /admin/
    } else {
      console.log('Angajatul nu are o pozitie valida');
    }
  } else {
    res.redirect(`/popup?tipEroare=angajatLipsa`);
  }
})

router.get('/popup', async (req, res) => {
  const tipEroare = req.query.tipEroare;
  const idAngajat = req.query.idAngajat;
  const nume = req.query.nume;
  res.render('popup', { tipEroare: tipEroare, nume, idAngajat });
})

module.exports = router;