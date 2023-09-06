const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const Angajati = require('../models/angajati');
const Utilaje = require('../models/utilaje');
let Operatii = require('../models/operatii2');
const Produse = require('../models/produse');
const Loturi = require('../models/loturi');

router.get('/', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const privilegii = req.query.privilegii;
  const loturiInCurs = await Loturi.find({ Stadiu_lot: "In lucru" }).exec();
  const loturiFinalizate = await Loturi.find({ Stadiu_lot: "Finalizat" }).exec();
  res.render('admin', { loturiInCurs, loturiFinalizate, idAngajat, privilegii });
});

router.get('/istoric', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const privilegii = req.query.privilegii;
  const loturiInCurs = await Loturi.find({ Stadiu_lot: "In lucru" }).exec();
  const loturiFinalizate = await Loturi.find({ Stadiu_lot: "Finalizat" }).exec();
  const bazaLoturiInCurs = await Loturi.find({ Stadiu_lot: "In lucru" }).lean().exec();
  const loturiInCreare = await Loturi.find({ Stadiu_lot: "In creare" }).exec();
  const produse = await Produse.find().exec();
  const operatii = await Operatii.find().exec();
  const id = req.query.id;
  const lot = await Loturi.findOne({ _id: id }).exec();

  res.render('admin/istoric', { loturiInCurs, loturiFinalizate, idAngajat, privilegii, bazaLoturiInCurs, loturiInCreare, lot, produse, operatii });

})

router.get('/index-popup', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const privilegii = req.query.privilegii;
  const loturiInCurs = await Loturi.find({ Stadiu_lot: "In lucru" }).exec();
  const loturiFinalizate = await Loturi.find({ Stadiu_lot: "Finalizat" }).exec();
  const bazaLoturiInCurs = await Loturi.find({ Stadiu_lot: "In lucru" }).lean().exec();
  const loturiInCreare = await Loturi.find({ Stadiu_lot: "In creare" }).exec();
  const produse = await Produse.find().exec();
  const operatii = await Operatii.find().exec();
  const id = req.query.id;
  const lot = await Loturi.findOne({ _id: id }).exec();

  res.render('admin/index-popup', { loturiInCurs, loturiFinalizate, idAngajat, privilegii, bazaLoturiInCurs, loturiInCreare, lot, produse, operatii });
})

// Rute ale sectiunii de editare a bazei de date a Angajatilor
router.get('/angajati', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const vectorAngajati = await Angajati.find().exec();
  res.render('admin/angajati', { Angajati: vectorAngajati, idAngajat });
});

router.post('/angajati', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const id = req.body.id;
  const nume = req.body.nume;
  const prenume = req.body.prenume;
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
    prenume: prenume,
    pozitie: pozitie,
    verificator: verificator,
    parola: parola,
    hash: hashParola
  });
  angajatNou.save();
  res.redirect(`./angajati?idAngajat=${idAngajat}`);
})

router.post('/sterge-angajat', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const id = req.body.id;

  Angajati.findOneAndDelete({ _id: id })
    .then(() => {
      res.redirect(`./angajati?idAngajat=${idAngajat}`)
    })
    .catch((eroare) => {
      console.error('Eroare: Nu s-a putut sterge angajatul', eroare)
    })
})


// Rute ale paginii de editare a operatiilor
router.get('/operatii', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const vectorOperatii = await Operatii.find().exec();
  console.log(vectorOperatii)
  res.render('admin/operatii', { Operatii: vectorOperatii, idAngajat });
});

router.post('/operatii', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const vectorOperatii = await Operatii.find().exec();
  let index = req.body.index;
  const numeOperatieNoua = req.body.nume;
  const areUtilaj = req.body.areProgram;
  console.log(areUtilaj)
  var x;
  if (areUtilaj === "on") {
    x = true;
  } else {
    x = false;
  }

  if (index === '' || index === vectorOperatii.length + 1) {
    const operatieNoua = new Operatii({
      id: vectorOperatii.length + 1,
      nume: numeOperatieNoua,
      areProgram: x
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

  res.redirect(`./operatii?idAngajat=${idAngajat}`);
})

router.post('/sterge-operatie', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const vectorOperatii = await Operatii.find().exec();
  
  let index = req.body.id;
  index--;
  const filtru = {
    id: {
      $gte: index + 1
    }
  }
  await Operatii.deleteMany(filtru).exec();
  for (let i = index; i <= vectorOperatii.length - 2; i++) {
    const operatieNoua = new Operatii({
      id: i + 1,
      nume: vectorOperatii[i + 1].nume
    });
    operatieNoua.save();
  }

  res.redirect(`./operatii?idAngajat=${idAngajat}`);
})


// Rute ale paginii de editare a utilajelor
router.get('/utilaje', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const vectorOperatii = await Operatii.find().exec();
  const vectorUtilaje = await Utilaje.find().exec();
  res.render('admin/utilaje', { Operatii: vectorOperatii, Utilaje: vectorUtilaje, idAngajat });
})

router.post('/utilaje', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const vectorOperatii = await Operatii.find().exec();

  const numeUtilaj = req.body.nume;
  const valoriForm = Object.entries(req.body);
  const indexFinal = valoriForm.length - 2;
  let indexInitial = 0;
  let numeOperatii = [];
  while (indexInitial <= indexFinal) {
    let i = +valoriForm[indexInitial][1];
    const operatie = vectorOperatii[i-1];
    const nume = operatie.nume;
    numeOperatii.push(nume);
    indexInitial++;
  }
  const utilajNou = new Utilaje({
    nume: numeUtilaj,
    operatii: numeOperatii
  });
  utilajNou.save();
  res.redirect(`./utilaje?idAngajat=${idAngajat}`);
})

router.post('/sterge-utilaj', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const numeUtilaj = req.body.nume;
  Utilaje.findOneAndDelete({ nume: numeUtilaj })
    .then(() => {
      res.redirect(`./utilaje?idAngajat=${idAngajat}`)
    })
    .catch((eroare) => {
      console.error('Eroare: Nu s-a putut sterge utilajul', eroare)
    })
})

module.exports = router;