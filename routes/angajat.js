const express = require('express');
const router = express.Router();

const Angajati = require('../models/angajati');
let Operatii = require('../models/operatii2');
const pieseInCurs = require('../models/piese-in-curs');
const pieseFinalizate = require('../models/piese-finalizate');
const comenziInCurs = require('../models/comenzi-in-curs');
const comenziFinalizate = require('../models/comenzi-finalizate');
const Utilaje = require('../models/utilaje');


// La finalul fiecarui apel al executaOperatie(), verificam daca piesa pe care tocmai am modificat-o este gata.
// Facem asta numarand cate din operatiile sale nu au stadiul "Finalizata" sau "NULL".
// Daca exista care nu au, piesa nu e gata.

const esteGataPiesa = async function (piesa) {
  const vector = piesa.stadiuOperatie;
  let cond = 0;
  vector.forEach(stadiu => {
    if (stadiu === "In lucru" || stadiu === "In asteptare") {
      cond++;
    }
  });
  return (cond === 0);
}


// Daca piesa e gata, se finalizeaza. Adica, se sterge piese din pieseInCurs si se adauga in pieseFinalizate.
// De asemenea, stadiul ei din comandaInCurs se modifica. Functia esteGataComanda se uita la aceste stadii pentru a
// determina cand si daca o comanda este si ea gata.

const finalizeazaPiesa = async function (piesaDeFinalizat) {
  
  // Modificam stadiul piesei in comandaInCurs
  const comandaDeModificat = await comenziInCurs.findOne({ Numar_comanda: piesaDeFinalizat.Numar_comanda }).exec();
  const pieseleComenzii = comandaDeModificat.Piese;
  const stadiilePieselor = comandaDeModificat.stadiuOperatie;
  for (let i = 0; i <= pieseleComenzii.length - 1; i++) {
    if ((piesaDeFinalizat._id).toString() === pieseleComenzii[i]) {
      stadiilePieselor[i] = "Finalizata";
    }
  }
  await comenziInCurs.updateOne({ Numar_comanda: piesaDeFinalizat.Numar_comanda }, { $set: { 'stadiuOperatie': stadiilePieselor } }).exec();

  const dataFinalizare = new Date();
  
  // Durata in productie
  let timpDeExecutie = 0;
  const vectorDurate = piesaDeFinalizat.timpDeExecutieOperatie;
  vectorDurate.forEach(durata => {
    timpDeExecutie += durata;
  })
  timpDeExecutie = parseInt(timpDeExecutie);
  
  const nrOre = parseInt(timpDeExecutie / 3600); // numarul de ore intregi din comanda
  timpDeExecutie -= (nrOre * 3600); //numarul de secunde ramas fara acele ore

  const nrMinute = parseInt(timpDeExecutie / 60);

  // Durata comenzii ca atare
  let durataComanda = parseInt((dataFinalizare - piesaDeFinalizat.dataInitiere)/1000);

  const nrOreComanda = parseInt(durataComanda / 3600);
  durataComanda -= (nrOre * 3600);

  const nrMinuteComanda = parseInt(durataComanda / 60);

  // Informatia finala
  const timpDeExecutieTotal = "Executia comenzii a durat " + nrOreComanda + " ore si " + nrMinuteComanda +
  " minute, din care aproximativ " + nrOre + " ore si " + nrMinute + " minute a petrecut in Productie.";

  // Creeam o piesaFinalizata cu informatiile pieseiInCurs
  const piesaFinalizata = new pieseFinalizate({
    _id: piesaDeFinalizat._id,
    Numar_comanda: piesaDeFinalizat.Numar_comanda,
    RTSP: piesaDeFinalizat.RTSP,
    Cod_client: piesaDeFinalizat.Cod_client,
    nume: piesaDeFinalizat.nume,
    cantitateaTotala: piesaDeFinalizat.cantitateaTotala,
    cantitateRebut: piesaDeFinalizat.cantitateRebut,
    dataInitiere: piesaDeFinalizat.dataInitiere,
    dataFinalizare: dataFinalizare,
    rezumatOperatiiFinalizate: piesaDeFinalizat.rezumatOperatiiFinalizate,
    timpDeExecutieTotal: timpDeExecutieTotal
  });
  piesaFinalizata.save();
  await pieseInCurs.findOneAndDelete({ _id: piesaDeFinalizat._id }).exec();
}


// Atunci cand toate stadiile operatiilor componente ale comenzii sunt "Finalizate", comanda este gata.
// Numaram cate nu sunt. Daca exista comenzi care au alt stadiu decat "Finalizate", comanda nu este gata.

const esteGataComanda = async function (comanda) {
  const vector = comanda.stadiuOperatie;
  let cond = 0;
  vector.forEach(stadiu => {
    if (stadiu === "In lucru") {
      cond++;
    }
  });
  return (cond === 0);
}

// Cand comanda e gata, o inchidem. Asta inseamna ca o stergem din comenzi in curs si o trecem in comenzi finalizate.
// Fiecare piesa a fost deja finalizata la timpul ei, prin esteGataPiesa() -> inchidePiesa()

const inchideComanda = async function (comanda) {
  const comandaDeIncheiat = new comenziFinalizate({
    Numar_comanda: comanda.Numar_comanda,
    Piese: comanda.Piese
  });
  comandaDeIncheiat.save();
  await comenziInCurs.findOneAndDelete({ Numar_comanda: comanda.Numar_comanda }).exec();
}


// Functia big daddy de executie a operatiilor.
// Toate procesele existente in fabrica pot fi reduse la o succesiune de operatii de initiere (fie ele prelucrari,
// inspectii, etc.) si de finalizare a acestor operatii initiate.

const executaOperatie = async function (idPiesa, idAngajat, operatieSelectata, tipOperatie, utilajSelectat, nrRebut) {
  
  const angajatCurent = await Angajati.findOne({ _id: idAngajat }).exec();

  let Piesa = await pieseInCurs.findOne({ _id: idPiesa }).exec();
  const filtru = { _id: idPiesa };

  let update = {};

  // Se calculeaza operatia precedenta si cea succesiva celei curente in queue-ul operatiilor comenzii
  let operatiePrecedenta = operatieSelectata - 1;
  while (Piesa.stadiuOperatie[operatiePrecedenta] === "NULL" && operatiePrecedenta > 0) {
    operatiePrecedenta--;
  }
  let operatieUlterioara = operatieSelectata + 1;
  while (Piesa.stadiuOperatie[operatieUlterioara] === "NULL") {
    operatieUlterioara++;
  }

  // Constructia obiectelor de update in functie de tipul operatiei
  if (tipOperatie === "Initiere") {

    // Cand initiem o operatie, pornim intotdeauna cu numarul de piese care au trecut prin toate operatiile
    // precedente si asteapta operatia noastra.
    const cantitatePieseInCurs = Piesa.cantitatePieseInCurs;
    cantitatePieseInCurs[operatieSelectata] = Piesa.cantitatePieseFinalizate[operatiePrecedenta];

    const stadiuOperatie = Piesa.stadiuOperatie;
    stadiuOperatie[operatieSelectata] = "In lucru";

    const angajatOperatie = Piesa.angajatOperatie;
    angajatOperatie[operatieSelectata] = angajatCurent.nume;

    const utilajOperatie = Piesa.utilajOperatie;
    utilajOperatie[operatieSelectata] = utilajSelectat;

    const dataInitiereOperatie = Piesa.dataInitiereOperatie;
    dataInitiereOperatie[operatieSelectata] = new Date();

    update = {
      $set: {
        'cantitatePieseInCurs': cantitatePieseInCurs,
        'stadiuOperatie': stadiuOperatie,
        'angajatOperatie': angajatOperatie,
        'utilajOperatie': utilajOperatie,
        'dataInitiereOperatie': dataInitiereOperatie
      }
    };

    // Piesele ce au fost preluate in noua operatie, trebuie sa nu mai figureze in cea precedenta:
    const cantitatePieseFinalizate = Piesa.cantitatePieseFinalizate;
    cantitatePieseFinalizate[operatiePrecedenta] = 0;
    await pieseInCurs.updateOne(filtru, { $set: { 'cantitatePieseFinalizate': cantitatePieseFinalizate } }).exec();

  } else if (tipOperatie === "Finalizare") {

    // Am folosit utilajSelectat pentru a trimite numarul pieselor finalizate

    // numar = numarul de piese deja gata + numarul de piese gata acum
    const numar = Piesa.cantitatePieseFinalizate[operatieSelectata] + parseInt(utilajSelectat);
    
    // numarPieseNeterminate (dar nu stricate) = cu cate am inceput - cate am terminat - cate am stricat
    const numarPieseNeterminate = Piesa.cantitatePieseInCurs[operatieSelectata] - utilajSelectat - nrRebut;
    
    const dataFinalizareOperatie = new Date();

    const operatie = await Operatii.findOne({ id: operatieSelectata }).exec();

    const rezumatOperatieCurenta = (angajatCurent.nume).charAt(0).toUpperCase() + " a terminat " + utilajSelectat +
    " x " + Piesa.nume + " dupa operatia de " + operatie.nume + " la utilajul " + Piesa.utilajOperatie[operatieSelectata] +
    "." + "\n" + "A inceput operatia la " + Piesa.dataInitiereOperatie[operatieSelectata] + " si a terminat la " +
    dataFinalizareOperatie + ".";

    const timpDeExecutieOperatie = (dataFinalizareOperatie - Piesa.dataInitiereOperatie[operatieSelectata]) / 1000;

    let stadiu;
    if (numar < Piesa.cantitateaTotala) {
      stadiu = "In asteptare";
    } else {
      stadiu = "Finalizata";
    }

    // Mai am de efectuat operatieSelectata pentru toate piesele pe care nu le-am terminat dar nici nu le-am stricat
    const cantitatePieseInCurs = Piesa.cantitatePieseInCurs;
    cantitatePieseInCurs[operatieSelectata] = numarPieseNeterminate;

    // Noul numar de piese ce au finalizat operatieSelectata este cel existent + cate am terminat acum
    // De asemenea, cele pe care le-am stricat trebuie mentionate la 0 pentru a putea incepe din nou productia pentru
    // ele
    const cantitatePieseFinalizate = Piesa.cantitatePieseFinalizate;
    cantitatePieseFinalizate[operatieSelectata] = numar;
    cantitatePieseFinalizate[0] = parseInt(nrRebut);

    // Cate am stricat in total = cate am stricat deja + cate am stricat acum
    let cantitateRebut = Piesa.cantitateRebut;
    cantitateRebut += parseInt(nrRebut);

    const stadiuOperatie = Piesa.stadiuOperatie;
    stadiuOperatie[operatieSelectata] = stadiu;
 
    const angajatOperatie = Piesa.angajatOperatie;
    angajatOperatie[operatieSelectata] = "Niciunul";

    const utilajOperatie = Piesa.utilajOperatie;
    utilajOperatie[operatieSelectata] = "Niciunul";

    update = {
      $set: {
        'cantitateRebut': cantitateRebut,
        'cantitatePieseInCurs': cantitatePieseInCurs,
        'cantitatePieseFinalizate': cantitatePieseFinalizate,
        'stadiuOperatie': stadiuOperatie,
        'angajatOperatie': angajatOperatie,
        'utilajOperatie': utilajOperatie
      },
      $push: {
        'rezumatOperatiiFinalizate': rezumatOperatieCurenta,
        'timpDeExecutieOperatie': timpDeExecutieOperatie
      }
    };

  }

  try{
    await pieseInCurs.updateOne(filtru, update).exec();
  } catch (err) {
    console.log(err);
  }

  // Cautam din nou piesa (in ideea de a avea obiectul updatat cu care sa lucram) si efectuam controlul de
  // finalizare
  Piesa = await pieseInCurs.findOne(filtru).exec();
  if (await esteGataPiesa(Piesa) === true) {
    await finalizeazaPiesa(Piesa);
    const comanda = await comenziInCurs.findOne({ Numar_comanda: Piesa.Numar_comanda }).exec();
    console.log(await esteGataComanda(comanda) === true);
    if (await esteGataComanda(comanda) === true) {
      await inchideComanda(comanda);
    }
  }
}


router.get('/', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const angajat = await Angajati.findOne({ _id: idAngajat }).exec();
  let nume = angajat.nume;
  nume = nume.toUpperCase();
  res.render('angajat', {idAngajat, nume } );
})

router.post('/', (req, res) => {
  const idAngajat = req.body.idAngajat;
  const idComanda = req.body.idComanda;
  res.redirect(`angajat/selectie-operatii?idAngajat=${idAngajat}&idComanda=${idComanda}`);
})

router.get('/selectie-operatii', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const idComanda = req.query.idComanda;
  const pieseComandaCurenta = await pieseInCurs.find({ Numar_comanda: idComanda }).exec();
  res.render('angajat/selectie-operatii', { idAngajat, idComanda, pieseComandaCurenta, idComanda });
})

router.post('/selectie-operatii', (req, res) => {
  const idAngajat = req.body.idAngajat;
  const idPiesaCurenta = req.body.idPiesa;
  const idComanda = req.body.idComanda;
  res.redirect(`./operatii-piesa?idComanda=${idComanda}&idAngajat=${idAngajat}&idPiesaCurenta=${idPiesaCurenta}`);
})


router.get('/operatii-piesa', async (req, res) => {
  const idComanda = req.query.idComanda;
  const idAngajat = req.query.idAngajat;
  const idPiesaCurenta = req.query.idPiesaCurenta;
  const piesaCurenta = await pieseInCurs.findOne({ _id: idPiesaCurenta }).exec();
  const vectorOperatii = await Operatii.find().exec();
  let denumiriOperatii = ['NULL'];
  vectorOperatii.forEach(operatie => {
    denumiriOperatii.push(operatie.nume);
  });
  let index = 0;
  res.render('angajat/operatii-piesa', { idComanda, idAngajat, piesaCurenta, denumiriOperatii, index });
})

router.post('/operatii-piesa', async(req, res) => {
  const idAngajat = req.body.idAngajat;
  const idPiesa = req.body.idPiesa;
  const operatieCurenta = req.body.operatieCurenta;
  const tipOperatie = req.body.tipOperatie;
  const idComanda = req.body.idComanda;

  res.redirect(`./meniu-operatie?idComanda=${idComanda}&idAngajat=${idAngajat}&idPiesa=${idPiesa}&operatieCurenta=${operatieCurenta}&tipOperatie=${tipOperatie}`);
})


router.get('/meniu-operatie', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const idPiesa = req.query.idPiesa;
  const tipOperatie = req.query.tipOperatie;
  const idComanda = req.query.idComanda;

  const vectorOperatii = await Operatii.find().exec();
  let denumiriOperatii = ['NULL'];
  vectorOperatii.forEach(operatie => {
    denumiriOperatii.push(operatie.nume);
  });

  const indexOperatieCurenta = req.query.operatieCurenta;
  const operatieCurenta = denumiriOperatii[indexOperatieCurenta];

  const utilajeDisponibile = [];
  const vectorUtilaje = await Utilaje.find().exec();
  vectorUtilaje.forEach(utilaj => {
    const vector = utilaj.operatii;
    if (vector.includes(denumiriOperatii[indexOperatieCurenta])) {
      utilajeDisponibile.push(utilaj.nume);
    }
  });

  const angajat = await Angajati.findOne({ _id: idAngajat }).exec();
  const numeAngajat = angajat.nume;

  const Piesa = await pieseInCurs.findOne({ _id: idPiesa}).exec();

  res.render('angajat/meniu-operatie', { idComanda, idAngajat, idPiesa, operatieCurenta, indexOperatieCurenta, tipOperatie, numeAngajat, Piesa, Utilaje: utilajeDisponibile });
})

router.post('/meniu-operatie', async (req, res) => {
  const idAngajat = req.body.idAngajat;
  const idPiesa = req.body.idPiesa;
  const operatieCurenta = req.body.operatieCurenta;
  const tipOperatie = req.body.tipOperatie;
  const utilajSelectat = req.body.utilaj;
  let nrRebut = req.body.nrRebut;
  if (!nrRebut) {
    nrRebut = 0;
  }
  await executaOperatie(idPiesa, idAngajat, operatieCurenta, tipOperatie, utilajSelectat, nrRebut);
  res.redirect('/');
})

module.exports = router;