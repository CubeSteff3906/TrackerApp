const express = require('express');
const router = express.Router();

const Angajati = require('../models/angajati');
let Operatii = require('../models/operatii2');
const Loturi = require('../models/loturi');
const Utilaje = require('../models/utilaje');

const esteGataLotul = async function (lot) {
  const vector = lot.stadiuOperatie;
  let cond = 0;
  vector.forEach(stadiu => {
    if (stadiu === "In lucru" || stadiu === "In asteptare") {
      cond++;
    }
  });
  return (cond === 0);
}

const areRebut = async function (lot) {
  if (lot.cantitateRebut > 0 ) {
    return true;
  } else {
    return false;
  }
}

const suplimenteazaLot = async function (lot) {

  let stadiuOperatie = ["NULL"];
  let cantitatePieseFinalizate = [lot.cantitateRebut];

  const vectorOperatii = await Operatii.find().exec();
  
  for (let i = 1; i <= vectorOperatii.length; i++) {
    stadiuOperatie.push("NULL");
    cantitatePieseFinalizate.push(-1);
  }
  for (let i = 1; i <= vectorOperatii.length; i++) { // Itereaza prin valorile select urilor din form
    if (lot.stadiuOperatie[i] === "Finalizata") {
      stadiuOperatie[i] = "In asteptare";
      cantitatePieseFinalizate[i] = 0;
    }
  }
  
  const datetime = new Date();
  let data = datetime.toString();
  data = data.slice(0, 10);

  let cod = lot._id;
  let codFinal;

  let text = lot.Identificator;
  if (text.slice(text.length-7, text.length) !== "(Rebut)") {
    text += "(Rebut)";
    codFinal = cod + "-R1";
  } else {
    codFinal = cod.slice(0, cod.length - 1) + (+cod[cod.length - 1] + 1);
  }

  const lotRebut = new Loturi({
    _id: codFinal,
    Data: data,
    Stadiu_lot: "In creare",
    Identificator: text,
    Termen_Livrare: lot.Termen_Livrare,
    Cod_reper: lot.Cod_reper,
    Denumire: lot.Denumire,
    Numar_Lot: lot.Numar_Lot + "-A",
    cantitateaTotala: lot.cantitateRebut,
    Desen: lot.Desen,
    Revizie: lot.Revizie,
    Dimensiune_Semifabricat: lot.Dimensiune_Semifabricat,
    Certificat_Calitate: lot.Certificat_Calitate,
    cantitateRebut: 0,
    esteNecesaraOperatia: lot.esteNecesaraOperatia,
    stadiuOperatie: stadiuOperatie,
    cantitatePieseFinalizate: cantitatePieseFinalizate,
    cantitatePieseInCurs: lot.cantitatePieseInCurs,
    angajatOperatie: lot.angajatOperatie,
    utilajOperatie: lot.utilajOperatie,
    dataInitiere: new Date()
  })
  lotRebut.save();
}

const finalizeazaLot = async function (lot) {

  const dataFinalizare = new Date();
  // Durata in productie
  let timpTotalExecutie = 0;
  const duratePeUtilaje = lot.timpDeExecutieOperatie;
  duratePeUtilaje.forEach(durata => {
    timpTotalExecutie += durata;
  })
  timpTotalExecutie = parseInt(timpTotalExecutie);
  const nrOre = parseInt(timpTotalExecutie / 3600); // numarul de ore intregi din comanda
  timpTotalExecutie -= (nrOre * 3600); //numarul de secunde ramas fara acele ore
  const nrMinute = parseInt(timpTotalExecutie / 60);

  // Durata comenzii ca atare
  let durataComanda = parseInt((dataFinalizare - lot.dataInitiere)/1000);
  const nrOreComanda = parseInt(durataComanda / 3600);
  durataComanda -= (nrOre * 3600);
  const nrMinuteComanda = parseInt(durataComanda / 60);
  
  // Informatia finala
  const timpDeExecutieTotal = "Executia comenzii a durat " + nrOreComanda + " ore si " + nrMinuteComanda +
  " minute, din care aproximativ " + nrOre + " ore si " + nrMinute + " minute a petrecut in Productie.";

  // Creeam o piesaFinalizata cu informatiile pieseiInCurs

  const filtruLot = { Identificator: lot.Identificator };
  const updateLot = { $set: { Stadiu_lot: "Finalizat", dataFinalizare: dataFinalizare, rezumatOperatiiFinalizate: lot.rezumatOperatiiFinalizate, timpDeExecutieTotal: timpDeExecutieTotal } };
  await Loturi.updateOne(filtruLot, updateLot).exec();
}

const executaOperatie = async function (Identificator, idAngajat, operatieSelectata, tipOperatie, utilajSelectat, nrRebut) {

  const filtruLot = { _id: Identificator };
  const filtruAngajat = { _id: idAngajat };

  const angajatCurent = await Angajati.findOne(filtruAngajat).exec();
  let lot = await Loturi.findOne(filtruLot).exec();

  let update = {};
  // Se calculeaza operatia precedenta si cea succesiva celei curente in queue-ul operatiilor comenzii
  let operatiePrecedenta = operatieSelectata - 1;
  while (lot.stadiuOperatie[operatiePrecedenta] === "NULL" && operatiePrecedenta > 0) {
    operatiePrecedenta--;
  }
  let operatieUlterioara = operatieSelectata + 1;
  while (lot.stadiuOperatie[operatieUlterioara] === "NULL") {
    operatieUlterioara++;
  }

  // Constructia obiectelor de update in functie de tipul operatiei
  if (tipOperatie === "Initiere") {

    // Cand initiem o operatie, pornim intotdeauna cu numarul de piese care au trecut prin toate operatiile
    // precedente si asteapta operatia noastra.
    const cantitatePieseInCurs = lot.cantitatePieseInCurs;
    cantitatePieseInCurs[operatieSelectata] = lot.cantitatePieseFinalizate[operatiePrecedenta];

    const stadiuOperatie = lot.stadiuOperatie;
    stadiuOperatie[operatieSelectata] = "In lucru";

    const angajatOperatie = lot.angajatOperatie;
    angajatOperatie[operatieSelectata] = angajatCurent.nume;

    const utilajOperatie = lot.utilajOperatie;
    utilajOperatie[operatieSelectata] = utilajSelectat;

    const dataInitiereOperatie = lot.dataInitiereOperatie;
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
    const cantitatePieseFinalizate = lot.cantitatePieseFinalizate;
    cantitatePieseFinalizate[operatiePrecedenta] = 0;
    await Loturi.updateOne(filtruLot, { $set: { 'cantitatePieseFinalizate': cantitatePieseFinalizate } }).exec();

  } else if (tipOperatie === "Finalizare") {

    // Am folosit utilajSelectat pentru a trimite numarul pieselor finalizate

    // numar = numarul de piese deja gata + numarul de piese gata acum
    const numar = lot.cantitatePieseFinalizate[operatieSelectata] + parseInt(utilajSelectat);
    
    // numarPieseNeterminate (dar nu stricate) = cu cate am inceput - cate am terminat - cate am stricat
    const numarPieseNeterminate = lot.cantitatePieseInCurs[operatieSelectata] - utilajSelectat - nrRebut;
    
    const dataFinalizareOperatie = new Date();

    const operatie = await Operatii.findOne({ id: operatieSelectata }).exec();

    let rezumatOperatieCurenta = angajatCurent.nume + " a terminat " + utilajSelectat +
    " x " + lot.Denumire + " dupa operatia de " + (operatie.nume).toLowerCase();

    if (lot.utilajOperatie[operatieSelectata] !== "null" && lot.utilajOperatie[operatieSelectata] !== null ) {
      rezumatOperatieCurenta = rezumatOperatieCurenta + " la utilajul " + lot.utilajOperatie[operatieSelectata];
    }

    let data1 = (lot.dataInitiereOperatie[operatieSelectata]).toString();
    let data2 = dataFinalizareOperatie.toString();

    const ziua1 = data1.slice(8, 10) + data1.slice(3, 7) + data1.slice(10, 15);
    const ziua2 = data2.slice(8, 10) + data2.slice(3, 7) + data2.slice(10, 15);

    const ora1 = data1.slice(15, 24);
    const ora2 = data2.slice(15, 24);

    rezumatOperatieCurenta = rezumatOperatieCurenta + ". A inceput operatia pe data de " + ziua1 + " la ora" + ora1 +
    " si a terminat pe data de " + ziua2 + " la ora" + ora2 + ".";

    const timpDeExecutieOperatie = (dataFinalizareOperatie - lot.dataInitiereOperatie[operatieSelectata]) / 1000;

    let stadiu;
    if (numarPieseNeterminate > 0) {
      stadiu = "In asteptare";
    } else {
      stadiu = "Finalizata";
    }

    // Mai am de efectuat operatieSelectata pentru toate piesele pe care nu le-am terminat dar nici nu le-am stricat
    const cantitatePieseInCurs = lot.cantitatePieseInCurs;
    cantitatePieseInCurs[operatieSelectata] = numarPieseNeterminate;

    // Noul numar de piese ce au finalizat operatieSelectata este cel existent + cate am terminat acum
    // De asemenea, cele pe care le-am stricat trebuie mentionate la 0 pentru a putea incepe din nou productia pentru
    // ele
    const cantitatePieseFinalizate = lot.cantitatePieseFinalizate;
    cantitatePieseFinalizate[operatieSelectata] = numar;

    // Cate am stricat in total = cate am stricat deja + cate am stricat acum
    let cantitateRebut = lot.cantitateRebut;
    cantitateRebut += parseInt(nrRebut);

    const stadiuOperatie = lot.stadiuOperatie;
    stadiuOperatie[operatieSelectata] = stadiu;
 
    const angajatOperatie = lot.angajatOperatie;
    angajatOperatie[operatieSelectata] = "Niciunul";

    const utilajOperatie = lot.utilajOperatie;
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
    await Loturi.updateOne(filtruLot, update).exec();
  } catch (err) {
    console.log(err);
  }

  lot = await Loturi.findOne(filtruLot).exec();
  if (await esteGataLotul(lot) === true) {
    if (await areRebut(lot)) {
      await suplimenteazaLot(lot);
    }
    await finalizeazaLot(lot);
  }
}


router.get('/', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const angajat = await Angajati.findOne({ _id: idAngajat }).exec();
  let nume = angajat.nume;
  nume = nume.toUpperCase();
  res.render('angajat', {idAngajat, nume } );
})

router.post('/', async (req, res) => {
  const idAngajat = req.body.idAngajat;
  const Identificator = req.body.idLot;
  const angajat = await Angajati.findOne({ _id: idAngajat }).exec();
  let nume = angajat.nume;
  nume = nume.toUpperCase();
  const lot = await Loturi.findOne({ _id: Identificator }).exec();
  if (lot) {
    res.redirect(`angajat/operatii-piesa?idAngajat=${idAngajat}&Identificator=${Identificator}`);
  } else {
    res.redirect(`/popup?idAngajat=${idAngajat}&tipEroare=comandaLipsa&nume=${nume}`);
  }
})

router.get('/operatii-piesa', async (req, res) => {
  const Identificator = req.query.Identificator;
  const idAngajat = req.query.idAngajat;
  const vectorOperatii = await Operatii.find().exec();
  let denumiriOperatii = ['NULL'];
  vectorOperatii.forEach(operatie => {
    denumiriOperatii.push(operatie.nume);
  });
  let index = 0;
  const loturi = await Loturi.find({ _id: Identificator }).exec();
  const piesaCurenta = loturi[0];
  res.render('angajat/operatii-piesa', { Identificator, idAngajat, piesaCurenta, denumiriOperatii, index });
})

router.post('/operatii-piesa', async(req, res) => {
  const idAngajat = req.body.idAngajat;
  const Identificator = req.body.idPiesa;
  const operatieCurenta = req.body.operatieCurenta;
  const tipOperatie = req.body.tipOperatie;

  res.redirect(`./meniu-operatie?Identificator=${Identificator}&idAngajat=${idAngajat}&operatieCurenta=${operatieCurenta}&tipOperatie=${tipOperatie}`);
})


router.get('/meniu-operatie', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const Identificator = req.query.Identificator;
  const tipOperatie = req.query.tipOperatie;

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

  const lot = await Loturi.findOne({ _id: Identificator }).exec(); 

  res.render('angajat/meniu-operatie', { Identificator, idAngajat, operatieCurenta, indexOperatieCurenta, tipOperatie, numeAngajat, lot, Utilaje: utilajeDisponibile });
})

router.get('/meniu-operatie2', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const Identificator = req.query.idPiesa;
  const tipOperatie = req.query.tipOperatie;
  const operatieCurenta = req.query.operatieCurenta;
  const index = req.query.index;
  const nrRebut = req.query.nrRebut;

  const lot = await Loturi.findOne({ _id: Identificator}).exec();

  res.render('angajat/meniu-operatie2', { Identificator, idAngajat, operatieCurenta, index, tipOperatie, lot, nrRebut });
})

router.get('/meniu-operatie3', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const Identificator = req.query.idPiesa;
  const tipOperatie = req.query.tipOperatie;
  const operatieCurenta = req.query.operatieCurenta;
  const index = req.query.index;
  const nrRebut = req.query.nrRebut;
  const nrFin = req.query.nrFin;

  const lot = await Loturi.findOne({ _id: Identificator }).exec();

  res.render('angajat/meniu-operatie3', { Identificator, idAngajat, operatieCurenta, index, tipOperatie, lot, nrRebut, nrFin });
})

router.post('/meniu-operatie3', async (req, res) => {
  const idAngajat = req.body.idAngajat;
  const Identificator = req.body.idPiesa;
  const tipOperatie = req.body.tipOperatie;
  const index = req.body.index;
  const nrRebut = req.body.nrRebut;
  const nrFin = req.body.nrFin;

  await executaOperatie(Identificator, idAngajat, index, tipOperatie, nrFin, nrRebut);

  res.redirect(`/`);
})

module.exports = router;