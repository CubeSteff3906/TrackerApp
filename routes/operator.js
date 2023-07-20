const express = require('express');
const router = express.Router();

const pieseInCurs = require('../models/piese-in-curs');
const comenziInCurs = require('../models/comenzi-in-curs');
const comenziInCreare = require('../models/comenzi-in-creare');
const comenziFinalizate = require('../models/comenzi-finalizate');
const RTSPuri = require('../models/rtsp');
let Operatii = require('../models/operatii2');

// Ruta index, afisarea comenzilor in curs + initierea unor comenzi noi
router.get('/', async (req, res) => {
  const vectorPieseInCurs = await pieseInCurs.find().exec();
  const vectorComenziInCurs = await comenziInCurs.find().exec();
  const vectorComenziFinalizate = await comenziFinalizate.find().exec();
  res.render('operator', { pieseInCurs: vectorPieseInCurs, comenziInCurs: vectorComenziInCurs, comenziFinalizate: vectorComenziFinalizate });
})

// Initierea si stergerea unei comenzi noi (new comenziInCreare); mai intai se adauga toate piesele in comanda,
// dupa aceea se confirma comanda si trece din inCreare in inCurs.

router.get('/comanda-noua', async (req, res) => {
  const vectorPieseInCurs = await pieseInCurs.find().exec();
  const vectorComenziInCreare = await comenziInCreare.find().exec();
  const bazaPieseInCurs = await pieseInCurs.find().lean().exec();
  res.render('operator/comanda-noua', {pieseInCurs: vectorPieseInCurs, comenziInCreare: vectorComenziInCreare, bazaPieseInCurs});
});

router.post('/comanda-noua', async (req, res) => {
  const numar = req.body.numarComanda;
  const piese = [];
  const stadiuPiese = [];

  const comandaNoua = new comenziInCreare({
    Numar_comanda: numar,
    Piese: piese,
    stadiuPiese: stadiuPiese
  });
  comandaNoua.save();

  res.redirect(`./piesa-noua?numarComanda=${numar}`);
})

router.post('/sterge-comanda', async(req, res) => {
  const numar = req.body.id;
  
  filter = {
    Numar_comanda: numar
  }
  await pieseInCurs.deleteMany(filter);
  
  comenziInCreare.findOneAndDelete({ Numar_comanda: numar })
    .then(() => {
      res.redirect('/operator/comanda-noua')
    })
    .catch((eroare) => {
      console.error('Eroare: Nu s-a putut sterge comanda', eroare);
    })
})


// Ruta pentru stergerea comenzilor inCurs introduse eronat

router.post('/sterge-comanda-creata', async (req, res) => {
  const numar = req.body.id;
  
  filter = {
    Numar_comanda: numar
  }
  await pieseInCurs.deleteMany(filter);

  comenziInCurs.findOneAndDelete({ Numar_comanda: numar })
    .then(() => {
      res.redirect('/operator')
    })
    .catch((eroare) => {
      console.error('Eroare: Nu s-a putut sterge comanda', eroare);
    })
})


// Nici nu mai stiu pentru ce e asta, probabil pentru un buton de Inapoi

router.post('/redir', (req, res) => {
  numar = req.body.numar;
  res.redirect(`./piesa-noua?numarComanda=${ numar }`);
})

router.post('/deschide-comanda', async (req, res) => {
  const numar = req.body.numarComanda;
  const comanda = await comenziInCreare.findOne({ Numar_comanda: numar }).exec();
  const comandaNoua = new comenziInCurs({
    Numar_comanda: numar,
    Piese: comanda.Piese,
    stadiuOperatie: comanda.stadiuOperatie
  });
  comandaNoua.save();
  await comenziInCreare.findOneAndDelete({ Numar_comanda: numar }).exec();
  
  res.redirect('/operator');
});


// Rute pentru adaugarea sau stergerea pieselor din comandaInCreare, inainte de a muta la comenziInCurs

router.get('/piesa-noua', async (req, res) => {
  const vectorRTSPuri = await RTSPuri.find().exec();
  const vectorOperatii = await Operatii.find().exec();
  const numar = req.query.numarComanda;

  res.render('operator/piesa-noua', { RTSPuri: vectorRTSPuri, Operatii: vectorOperatii, numar});
})

router.post('/piesa-noua', async (req, res) => {
  const vectorOperatii = await Operatii.find().exec();

  const id = req.body.id;
  const RTSP = req.body.rtsp;
  const Cod_client = req.body.codclient;
  const nume = req.body.nume;
  const cantitateaTotala = req.body.cantitate;

  const valoriForm = Object.entries(req.body);
  valoriForm.sort((a, b) => a[0].localeCompare(b[0]));

  const indexFinal = valoriForm.length - 6;
  let indexInitial = 0;

  let esteNecesaraOperatia = [false];
  let stadiuOperatie = ["NULL"];
  let cantitatePieseFinalizate = [cantitateaTotala];
  let cantitatePieseInCurs = [-1];
  let angajatOperatie = ["NULL"];
  let utilajOperatie = ["NULL"];

  for (let i = 1; i <= vectorOperatii.length; i++) {
    esteNecesaraOperatia.push(false);
    stadiuOperatie.push("NULL");
    cantitatePieseFinalizate.push(-1);
    cantitatePieseInCurs.push(-1);
    angajatOperatie.push("NULL");
    utilajOperatie.push("NULL");
  }
  while (indexInitial <= indexFinal) { // Itereaza prin valorile select urilor din form
    let i = +valoriForm[indexInitial][1];
    esteNecesaraOperatia[i] = true;
    stadiuOperatie[i] = "In asteptare";
    cantitatePieseFinalizate[i] = 0;
    cantitatePieseInCurs[i] = 0;
    angajatOperatie[i] = "Niciunul";
    utilajOperatie[i] = "Niciunul";
    indexInitial++;
  }

  const datetime = new Date();

  const piesaNoua = new pieseInCurs({ 
    Numar_comanda: id,
    RTSP: RTSP,
    Cod_client: Cod_client,
    nume: nume,
    cantitateaTotala: cantitateaTotala,
    cantitateRebut: 0,
    esteNecesaraOperatia: esteNecesaraOperatia,
    stadiuOperatie: stadiuOperatie,
    cantitatePieseInCurs: cantitatePieseInCurs,
    cantitatePieseFinalizate: cantitatePieseFinalizate,
    angajatOperatie: angajatOperatie,
    utilajOperatie: utilajOperatie,
    dataInitiere: datetime
  });
  piesaNoua.save()
    .then(() => {
      comenziInCreare.updateOne(
        { Numar_comanda: id },
        { $push: {
          Piese: piesaNoua._id,
          stadiuOperatie: "In lucru"
        } }
      ).catch((error) => {
        if (error) {
          console.log(error);
        }
      })
    })
    .catch((error) => {
      console.error(error);
    });

  res.redirect('/operator/comanda-noua');
})

router.post('/sterge-piesa', async (req, res) => {
  const id = req.body.id;
  const piesa = await pieseInCurs.findOne({ _id: id }).exec();

  const filtru = { Numar_comanda: piesa.Numar_comanda };
  const comanda = await comenziInCreare.findOne(filtru).exec();

  const Piese = comanda.Piese;
  const stadiuOperatie = comanda.stadiuOperatie;
  
  const index = Piese.indexOf(id);
  console.log(index);
  const n = Piese.length - 1;
  console.log(Piese, stadiuOperatie);
  for (let i = index; i < n; i++) {
    Piese[i] = Piese[i+1];
    stadiuOperatie[i] = stadiuOperatie[i+1];
  }
  Piese.splice(n);
  stadiuOperatie.splice(n);
  console.log(Piese, stadiuOperatie);
  const update = {
    $set: {
      Piese: Piese,
      stadiuOperatie
    }
  }
  await comenziInCreare.updateOne(filtru, update).exec();

  pieseInCurs.findOneAndDelete({ _id: id })
    .then(() => {
      res.redirect('/operator/comanda-noua')
    })
    .catch((eroare) => {
      console.error('Eroare: Nu s-a putut sterge comanda', eroare);
    })
})

module.exports = router;