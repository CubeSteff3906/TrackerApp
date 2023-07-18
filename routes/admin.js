const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const Angajati = require('../models/angajati');
const RTSPuri = require('../models/rtsp');
let Operatii = require('../models/operatii2');
const pieseInCurs = require('../models/piese-in-curs');
const comenziInCurs = require('../models/comenzi-in-curs');
const pieseFinalizate = require('../models/piese-finalizate');
const comenziFinalizate = require('../models/comenzi-finalizate');
const Utilaje = require('../models/utilaje');

router.get('/', async (req, res) => {
  const vectorPieseInCurs = await pieseInCurs.find().exec();
  const vectorComenziInCurs = await comenziInCurs.find().exec();
  res.render('admin', { vectorComenziInCurs, vectorPieseInCurs });
});

// Rute ale sectiunii de editare a bazei de date a Angajatilor
router.get('/angajati', async (req, res) => {
  const vectorAngajati = await Angajati.find().exec();
  res.render('admin/angajati', { Angajati: vectorAngajati });
});

router.post('/angajati', async (req, res) => {
  const id = req.body.id;
  const nume = req.body.nume;
  const pozitie = req.body.pozitie;
  const checkbox = req.body.verificator;
  let verificator;
  if (checkbox === "on") {
    verificator = true;
  } else {
    verificator = false;
  }
  let parola = req.body.parola;
  let hashParola;
  if (parola.length === 0) {
    parola = "NULL";
    hash = "NULL";
  } else {
    bcrypt.hash(parola, 10, (err, hash) => {
      if (err) {
        console.error(err);
      } else {
        hashParola = hash;
      }
    });
  }
  const angajatNou = new Angajati({
    _id: id,
    nume: nume,
    pozitie: pozitie,
    verificator: verificator,
    parola: parola,
    hash: hashParola
  });
  angajatNou.save();
  res.redirect('./angajati');
})

router.post('/sterge-angajat', async (req, res) => {
  const id = req.body.id;

  Angajati.findOneAndDelete({ _id: id })
    .then(() => {
      res.redirect('./angajati')
    })
    .catch((eroare) => {
      console.error('Eroare: Nu s-a putut sterge angajatul', eroare)
    })
})

// Rute ale paginii de editare ale bazei de date a RTSP-urilor
router.get('/rtsp', async (req, res) => {
  const vectorRTSPuri = await RTSPuri.find().exec();
  const vectorOperatii = await Operatii.find().exec();
  res.render('admin/rtsp', { RTSP: vectorRTSPuri, Operatii: vectorOperatii });
});

router.post('/rtsp', async (req, res) => {

  const vectorOperatii = await Operatii.find().exec();

  const RTSP = req.body.rtsp;
  const Cod_client = req.body.codclient;
  const nume = req.body.nume;

  const valoriForm = Object.entries(req.body);
  valoriForm.sort((a, b) => a[0].localeCompare(b[0]));
  // Ordinea valorile din form este: casute bifate in ordine crescatoare, dupa valori input
  const indexFinal = valoriForm.length - 4;
  let indexInitial = 0;
  let esteNecesaraOperatia = [];
  esteNecesaraOperatia.push(false);
  for (let i = 1; i <= vectorOperatii.length; i++) {
    esteNecesaraOperatia.push(false);
  }
  while (indexInitial <= indexFinal) {
    let i = +valoriForm[indexInitial][1];
    esteNecesaraOperatia[i] = true;
    indexInitial++;
  }
  const rtspNou = new RTSPuri({
    RTSP: RTSP,
    Cod_client: Cod_client,
    nume: nume,
    esteNecesaraOperatia: esteNecesaraOperatia
  });
  rtspNou.save();
  res.redirect('./rtsp');
})

router.post('/sterge-rtsp', async (req, res) => {
  const id = req.body.id;

  RTSPuri.findOneAndDelete({ RTSP: id })
    .then(() => {
      res.redirect('./rtsp')
    })
    .catch((eroare) => {
      console.error('Eroare: Nu s-a putut sterge profilul', eroare);
    })
})

// Rute ale paginii de editare a operatiilor
router.get('/operatii', async (req, res) => {
  const vectorOperatii = await Operatii.find().exec();
  console.log(vectorOperatii);
  Operatii.findOneAndDelete({ _id: "64a67a098a61c12a4b18b7d2" });
  res.render('admin/operatii', { Operatii: vectorOperatii });
});

router.post('/operatii', async (req, res) => {
  const vectorOperatii = await Operatii.find().exec();
  let index = req.body.index;
  const numeOperatieNoua = req.body.nume;

  if (index === '' || index === vectorOperatii.length + 1) {
    const operatieNoua = new Operatii({
      id: vectorOperatii.length + 1,
      nume: numeOperatieNoua
    });
    operatieNoua.save();
  } else {
    index--;
    const filtru = {
      id: {
        $gte: index + 1
      }
    }
    await Operatii.deleteMany(filtru).exec();

    const operatieNoua = new Operatii({
      id: index + 1,
      nume: numeOperatieNoua
    });
    operatieNoua.save();

    for (let i = index + 2; i <= vectorOperatii.length + 1; i++) {
      const operatieNoua = new Operatii({
        id: i,
        nume: vectorOperatii[i - 2].nume
      });
      operatieNoua.save();
    }
  }

  res.redirect('./operatii');
})

router.post('/sterge-operatie', async (req, res) => {
  const vectorOperatii = await Operatii.find().exec();
  
  let index = req.body.id;
  index--;
  const filtru = {
    id: {
      $gte: index + 1
    }
  }
  await Operatii.deleteMany(filtru).exec();
  console.log(vectorOperatii.length, index, vectorOperatii.length - 1);
  for (let i = index; i <= vectorOperatii.length - 2; i++) {
    const operatieNoua = new Operatii({
      id: i + 1,
      nume: vectorOperatii[i + 1].nume
    });
    operatieNoua.save();
  }

  res.redirect('./operatii');
})


// Rute ale paginii de editare a utilajelor
router.get('/utilaje', async (req, res) => {
  const vectorOperatii = await Operatii.find().exec();
  const vectorUtilaje = await Utilaje.find().exec();
  res.render('admin/utilaje', { Operatii: vectorOperatii, Utilaje: vectorUtilaje });
})

router.post('/utilaje', async (req, res) => {

  const vectorOperatii = await Operatii.find().exec();

  const numeUtilaj = req.body.nume;
  const valoriForm = Object.entries(req.body);
  valoriForm.sort((a, b) => a[0].localeCompare(b[0]));
  const indexFinal = valoriForm.length - 2;
  let indexInitial = 0;
  let numeOperatii = [];
  while (indexInitial <= indexFinal) {
    let i = +valoriForm[indexInitial][1];
    const operatie = vectorOperatii[i-1];
    console.log(operatie);
    const nume = operatie.nume;
    numeOperatii.push(nume);
    indexInitial++;
  }
  const utilajNou = new Utilaje({
    nume: numeUtilaj,
    operatii: numeOperatii
  });
  utilajNou.save();
  res.redirect('./utilaje');
})

router.post('/sterge-utilaj', async (req, res) => {
  const numeUtilaj = req.body.id;
  Utilaje.findOneAndDelete({ nume: numeUtilaj })
    .then(() => {
      res.redirect('./utilaje')
    })
    .catch((eroare) => {
      console.error('Eroare: Nu s-a putut sterge utilajul', eroare)
    })
})

module.exports = router;