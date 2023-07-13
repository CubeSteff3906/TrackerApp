const express = require('express');
const router = express.Router();

const Angajati = require('../models/angajati');

router.get('/', (req, res) => {
  res.render('index')
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
    console.log('Nu s-a putut gasi angajatul');
  }
})

module.exports = router;