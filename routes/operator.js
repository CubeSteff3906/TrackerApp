const express = require('express');
const router = express.Router();

const Loturi = require('../models/loturi');
let Produse = require('../models/produse');
let Revizii = require('../models/revizii');
let Operatii = require('../models/operatii2');

// Ruta index, afisarea comenzilor in curs + initierea unor comenzi noi
router.get('/', async (req, res) => {
  const bazaLoturiInCurs = await Loturi.find({ Stadiu_lot: "In lucru" }).lean().exec();
  const loturiInCreare = await Loturi.find({ Stadiu_lot: "In creare" }).exec();
  const loturiInCurs = await Loturi.find({ Stadiu_lot: "In lucru" }).exec();
  const loturiFinalizate = await Loturi.find({ Stadiu_lot: "Finalizat" }).exec();
  const produse = await Produse.find().exec();
  const operatii = await Operatii.find().exec();
  const idAngajat = req.query.idAngajat;
  console.log(await Loturi.find().exec());
  res.render('operator', { idAngajat, loturiInCreare, loturiInCurs, loturiFinalizate, bazaLoturiInCurs, produse, operatii });
})

router.get('/popup', async (req, res) => {
  const bazaLoturiInCurs = await Loturi.find({ Stadiu_lot: "In lucru" }).lean().exec();
  const loturiInCreare = await Loturi.find({ Stadiu_lot: "In creare" }).exec();
  const loturiInCurs = await Loturi.find({ Stadiu_lot: "In lucru" }).exec();
  const loturiFinalizate = await Loturi.find({ Stadiu_lot: "Finalizat" }).exec();
  const produse = await Produse.find().exec();
  const err = req.query.err;
  const idAngajat = req.query.idAngajat;
  res.render('operator/popup', { bazaLoturiInCurs, loturiInCreare, loturiInCurs, loturiFinalizate, produse, err, idAngajat });
})

router.get('/confirmare', async (req, res) => {
  const bazaLoturiInCurs = await Loturi.find({ Stadiu_lot: "In lucru" }).lean().exec();
  const loturiInCreare = await Loturi.find({ Stadiu_lot: "In creare" }).exec();
  const loturiInCurs = await Loturi.find({ Stadiu_lot: "In lucru" }).exec();
  const loturiFinalizate = await Loturi.find({ Stadiu_lot: "Finalizat" }).exec();
  const produse = await Produse.find().exec();
  const id = req.query.id;
  const idAngajat = req.query.idAngajat;
  const lot = await Loturi.find({ _id: id }).exec();
  const lotDat = lot[0];
  res.render('operator/confirmare', { bazaLoturiInCurs, loturiInCreare, loturiInCurs, loturiFinalizate, produse, lotDat, idAngajat });
})

router.get('/finish-popup', async (req, res) => {
  const bazaLoturiInCurs = await Loturi.find({ Stadiu_lot: "In lucru" }).lean().exec();
  const loturiInCreare = await Loturi.find({ Stadiu_lot: "In creare" }).exec();
  const loturiInCurs = await Loturi.find({ Stadiu_lot: "In lucru" }).exec();
  const loturiFinalizate = await Loturi.find({ Stadiu_lot: "Finalizat" }).exec();
  const produse = await Produse.find().exec();
  const id = req.query.id;
  const idAngajat = req.query.idAngajat;
  const lot = await Loturi.find({ _id: id }).exec();
  const lotDat = lot[0];
  res.render('operator/finish-popup', { bazaLoturiInCurs, loturiInCreare, loturiInCurs, loturiFinalizate, produse, lotDat, idAngajat });
})

router.get('/print', async (req, res) => {
  const bazaLoturiInCurs = await Loturi.find({ Stadiu_lot: "In lucru" }).lean().exec();
  const loturiInCreare = await Loturi.find({ Stadiu_lot: "In creare" }).exec();
  const loturiInCurs = await Loturi.find({ Stadiu_lot: "In lucru" }).exec();
  const loturiFinalizate = await Loturi.find({ Stadiu_lot: "Finalizat" }).exec();
  const produse = await Produse.find().exec();
  const id = req.query.id;
  const idAngajat = req.query.idAngajat;
  const tip = req.query.tip;
  const lot = await Loturi.findOne({ _id: id }).exec();

  const operatii = await Operatii.find().exec();

  let vectorOperatii = [];
  operatii.forEach(operatie => {
    vectorOperatii.push(operatie.nume);
  })

  let vectorCurent = [];
  let j = 1;
  for (let i = 0; i <= vectorOperatii.length - 1; i++) {
    if (lot.esteNecesaraOperatia[i+1] === true) {
      vectorCurent.push(j + ". " + vectorOperatii[i]);
      j++;
    }
  }

  console.log(vectorCurent, vectorOperatii);

  res.render('operator/print', { bazaLoturiInCurs, loturiFinalizate, loturiInCreare, loturiInCurs, produse, lot, idAngajat, tip, vectorCurent });
})

router.get('/info-popup', async (req, res) => {
  const bazaLoturiInCurs = await Loturi.find({ Stadiu_lot: "In lucru" }).lean().exec();
  const loturiInCreare = await Loturi.find({ Stadiu_lot: "In creare" }).exec();
  const loturiInCurs = await Loturi.find({ Stadiu_lot: "In lucru" }).exec();
  const loturiFinalizate = await Loturi.find({ Stadiu_lot: "Finalizat" }).exec();
  const produse = await Produse.find().exec();
  const operatii = await Operatii.find().exec();
  const id = req.query.id;
  const idAngajat = req.query.idAngajat;
  const lot = await Loturi.findOne({ _id: id }).exec();
  res.render('operator/info-popup', { bazaLoturiInCurs, loturiInCreare, loturiInCurs, loturiFinalizate, produse, operatii, lot, idAngajat });
})

router.post('/cauta-rtsp', async (req, res) => {
  const codReper = req.body.codReper;
  const idAngajat = req.query.idAngajat;
  if (codReper === '') {
    res.redirect('/operator/popup?err=true');
  } else {
    const reper = await Produse.findOne({ Cod_reper: codReper }).exec();
    if (!reper) {
      res.redirect(`/operator/popup?err=true&idAngajat=${idAngajat}`);
    } else {
      res.redirect(`/operator/piesa-noua?idAngajat=${idAngajat}&codReper=${ codReper }`);
    }
  }
})

// Initierea si stergerea unei comenzi noi (new comenziInCreare); mai intai se adauga toate piesele in comanda,
// dupa aceea se confirma comanda si trece din inCreare in inCurs.



router.post('/lot-nou', async (req, res) => {
  const Identificator = req.body.Identificator;
  const piese = [];
  const stadiuPiese = [];

  const lotNou = new Loturi({
    Stadiu_lot: "In creare",
    Identificator: Identificator,
    Piese: piese,
    stadiuPiese: stadiuPiese
  });
  lotNou.save();

  res.redirect(`./piesa-noua?numarComanda=${numar}`);
})

// Se va apela si pentru Loturi In Curs si pentru Loturi In Creare
router.post('/sterge-lot', async(req, res) => {
  const Numar_Fisa = req.body.id;
  filtru = { _id: Numar_Fisa };
  Loturi.findOneAndDelete(filtru)
    .then(() => {
      const idAngajat = req.query.idAngajat;
      res.redirect(`/operator?idAngajat=${idAngajat}`);
    })
    .catch((eroare) => {
      console.error('Eroare: Nu s-a putut sterge lotul', eroare);
    })
})

router.post('/sterge-revizie', async (req, res) => {
  const idAngajat = req.body.idAngajat;
  const id = req.body.id;

  await Loturi.deleteOne({_id: id}).exec();

  res.redirect(`/operator?idAngajat=${idAngajat}`)
})

router.post('/incepe-lot', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const Identificator = req.body.Identificator;
  const filtru = { Identificator: Identificator };
  const update = { $set: { Stadiu_lot: "In lucru" } };
  await Loturi.updateOne(filtru, update).exec();
  res.redirect(`/operator?idAngajat?${idAngajat}`);
});


// Rute pentru adaugarea sau stergerea pieselor din comandaInCreare, inainte de a muta la comenziInCurs

router.get('/piesa-noua', async (req, res) => {
  const bazaLoturiInCurs = await Loturi.find({ Stadiu_lot: "In lucru" }).lean().exec();
  const loturiInCreare = await Loturi.find({ Stadiu_lot: "In creare" }).exec();
  const loturiInCurs = await Loturi.find({ Stadiu_lot: "In lucru" }).exec();
  const loturiFinalizate = await Loturi.find({ Stadiu_lot: "Finalizat" }).exec();
  const produse = await Produse.find().exec();
  const operatii = await Operatii.find().exec();
  const idAngajat = req.query.idAngajat;
  const codReper = req.query.codReper;

  const produs = await Produse.findOne({ Cod_reper: codReper }).exec();
  const revizii = await Revizii.find().exec();
  const vectorRevizii = [];

  revizii.forEach(revizie => {
    const str = revizie._id;
    if (str.startsWith(codReper)) {
      vectorRevizii.push(revizie);
    }
  })
  const n = operatii.length;

  

  res.render('operator/piesa-noua', { loturiInCreare, loturiInCurs, loturiFinalizate, bazaLoturiInCurs,idAngajat, produse, operatii, produs, vectorRevizii, n});
})

router.post('/piesa-noua', async (req, res) => {
  const vectorOperatii = await Operatii.find().exec();

  const Numar_Fisa = req.body.Numar_Fisa;
  let Data = req.body.Data;
  const Identificator = req.body.Identificator;
  let Termen_Livrare = req.body.Termen_Livrare;
  const Numar_Lot = req.body.Numar_Lot;
  const cantitateaTotala = req.body.Cantitate;
  const Cod_Reper = req.body.Cod_Reper;
  const Denumire_Reper = req.body.Denumire_Reper;
  const Desen = req.body.Desen;
  const Revizie = req.body.Revizie;
  const Dimensiune_Semifabricat = req.body.Dimensiune_Semifabricat;
  const Certificat_Calitate = req.body.Certificat_Calitate;

  Termen_Livrare = Termen_Livrare.toString();
  Termen_Livrare = Termen_Livrare.slice(0, 10);


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

  let data2 = Data.slice(8,10) + "." + Data.slice(5,7) + "." + Data.slice(0,4);
  let data3 = Termen_Livrare.slice(8, 10) + "." + Termen_Livrare.slice(5, 7) + "." + Termen_Livrare.slice(0, 4);

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

  esteNecesaraOperatia = esteNecesaraOperatia.splice(0, vectorOperatii.length + 1);
  stadiuOperatie = stadiuOperatie.splice(0, vectorOperatii.length + 1);
  cantitatePieseFinalizate = cantitatePieseFinalizate.splice(0, vectorOperatii.length + 1);
  cantitatePieseInCurs = cantitatePieseInCurs.splice(0, vectorOperatii.length + 1);
  angajatOperatie = angajatOperatie.splice(0, vectorOperatii.length + 1);
  utilajOperatie = utilajOperatie.splice(0, vectorOperatii.length + 1);

  const datetime = new Date();

  const lotNou = new Loturi({
    _id: Numar_Fisa,
    Data: data2,
    Stadiu_lot: "In creare",
    Identificator: Identificator,
    Termen_Livrare: data3,
    Cod_reper: Cod_Reper,
    Denumire: Denumire_Reper,
    Numar_Lot: Numar_Lot,
    cantitateaTotala: cantitateaTotala,
    cantitateRebut: 0,
    Desen: Desen,
    Revizie: Revizie,
    Dimensiune_Semifabricat: Dimensiune_Semifabricat,
    Certificat_Calitate: Certificat_Calitate,
    esteNecesaraOperatia: esteNecesaraOperatia,
    stadiuOperatie: stadiuOperatie,
    cantitatePieseInCurs: cantitatePieseInCurs,
    cantitatePieseFinalizate: cantitatePieseFinalizate,
    angajatOperatie: angajatOperatie,
    utilajOperatie: utilajOperatie,
    dataInitiere: datetime
  });
  lotNou.save();
  const idAngajat = req.query.idAngajat;
  res.redirect(`/operator?idAngajat=${idAngajat}`);
})

router.post('/sterge-piesa', async (req, res) => {
  const id = req.body.id;
  const piesa = await Piese.findOne({ _id: id }).exec();

  const filtru = { Numar_comanda: piesa.Numar_comanda };
  const comanda = await Comenzi.findOne(filtru).exec();

  const Piese = comanda.Piese;
  const stadiuOperatie = comanda.stadiuOperatie;
  
  const index = Piese.indexOf(id);
  const n = Piese.length - 1;
  for (let i = index; i < n; i++) {
    Piese[i] = Piese[i+1];
    stadiuOperatie[i] = stadiuOperatie[i+1];
  }
  Piese.splice(n);
  stadiuOperatie.splice(n);
  const update = {
    $set: {
      Piese: Piese,
      stadiuOperatie
    }
  }
  await Comenzi.updateOne(filtru, update).exec();
  Piese.findOneAndDelete({ _id: id })
    .then(() => {
      const idAngajat = req.query.idAngajat;
      res.redirect(`/operator?idAngajat=${idAngajat}`);
    })
    .catch((eroare) => {
      console.error('Eroare: Nu s-a putut sterge piesa', eroare);
    })
})


router.get('/catalog', async (req, res) => {
  const filtru = req.query.filtru;
  const produse = await Produse.find().exec();
  const revizii = await Revizii.find().exec();
  const operatii = await Operatii.find().exec();
  const idAngajat = req.query.idAngajat;
  res.render('operator/catalog', { produse, revizii, operatii, filtru, idAngajat });
})

router.post('/catalog', async (req, res) => {
  const filtru = req.body.filtru;
  const idAngajat = req.body.idAngajat;
  res.redirect(`/operator/catalog?filtru=${filtru}&idAngajat=${idAngajat}`);
})

router.get('/catalog-popup', async (req, res) => {
  const filtru = req.query.filtru;
  let codReper = req.query.codReper;
  const idAngajat = req.query.idAngajat
  let produs;
  let codClient;
  let denumire;
  let Desen;
  let Rev;
  let revizieRecenta;
  if (codReper !== "null") {
    produs = await Produse.find({ Cod_reper: codReper }).exec();
    produs = produs[0];
    denumire = produs.Denumire;
    const v = produs.Revizii;
    const lungime = v.length;
    revizieRecenta = produs.Revizii[lungime-1];
    revizieRecenta = await Revizii.find({ _id: revizieRecenta }).exec();
    codClient = revizieRecenta[0].Cod_Echivalent_Client;
    codReper = codReper+"-"+lungime;
    Desen = revizieRecenta[0].Desen;
    Rev = revizieRecenta[0].Revizie;
  }
  const produse = await Produse.find().exec();
  const revizii = await Revizii.find().exec();
  const operatii = await Operatii.find().exec();
  res.render('operator/catalog-popup', { produse, revizii, operatii, filtru, codReper, produs, denumire, codClient, Desen, Rev, idAngajat });
})

router.post('/catalog-popup', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const tip = req.body.tip;
  const Cod_Reper = req.body.Cod_Reper;
  const Cod_Client = req.body.Cod_Client;
  const Denumire = req.body.Denumire;
  const Desen = req.body.Desen;
  const Revizie = req.body.Revizie;
  const filtru = req.body.filtru;

  const vectorOperatii = await Operatii.find().exec();

  const n = vectorOperatii.length;

  const valoriForm = Object.entries(req.body);
  valoriForm.sort((a, b) => a[0].localeCompare(b[0]));
  // Ordinea valorile din form este: casute bifate in ordine crescatoare, dupa valori input
  const indexFinal = valoriForm.length - 7;
  let indexInitial = 0;
  let esteNecesaraOperatia = [false];
  let Numar_Program = ["NULL"];
  for (let i = 1; i <= vectorOperatii.length; i++) {
    esteNecesaraOperatia.push(false);
    Numar_Program.push("NULL")
  }
  while (indexInitial <= indexFinal) {
    let i = +valoriForm[indexInitial][1];
    esteNecesaraOperatia[i] = true;
    Numar_Program[i] = "Nedefinit";
    indexInitial++;
  }


  Numar_Program = Numar_Program.slice(0, n+1);
  esteNecesaraOperatia = esteNecesaraOperatia.slice(0,n+1);

  if (tip === "produs") {

    const string = Cod_Reper + "-0";
    const revizieInitiala = new Revizii({
      _id: string,
      Cod_Echivalent_Client: Cod_Client,
      Desen: Desen,
      Revizie: Revizie,
      esteNecesaraOperatia: esteNecesaraOperatia,
      Numar_Program: Numar_Program
    });
    revizieInitiala.save();
    const v = [revizieInitiala._id];
    const produsNou = new Produse({
      Cod_reper: Cod_Reper,
      Denumire: Denumire,
      Revizii: v
    });
    produsNou.save();
  } else {
    const cod = Cod_Reper.slice(0, 11);
    const revizie = new Revizii({
      _id: Cod_Reper,
      Cod_Echivalent_Client: Cod_Client,
      Desen: Desen,
      Revizie: Revizie,
      esteNecesaraOperatia: esteNecesaraOperatia,
      Numar_Program: Numar_Program
    });
    revizie.save();
    const filtruProdus = { Cod_reper: cod };
    const produs = await Produse.find(filtruProdus).exec();
    const vector = produs[0].Revizii;
    vector.push(Cod_Reper);
    const updateProdus = {
      $set: {
        Revizii: vector
      }
    };
    await Produse.updateOne(filtruProdus, updateProdus).exec();
  }
  
  res.redirect(`./catalog?filtru=${filtru}&idAngajat=${idAngajat}`);
})

router.get('/numere-program', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const filtru = req.query.filtru;
  const Cod_reper = req.query.codReper;
  const produse = await Produse.find().exec();
  const revizii = await Revizii.find().exec();
  const operatii = await Operatii.find().exec();
  let revizie = Cod_reper; // RTSP-xx-xxx
  if (Cod_reper.length === 11) {
    revizie = revizie + "-0";
  }
  const reviziaTinta = await Revizii.find({ _id: revizie }).exec();
  setTimeout(() => {
    // No comment
  }, 500);
  const operatiiRevizie = reviziaTinta[0].esteNecesaraOperatia;
  // let areProgram = ["null"];
  let denumiriOperatii = [];
  for (let i = 0; i <= operatii.length - 1; i++) {
    if (operatiiRevizie[+operatii[i].id] === true) {
      denumiriOperatii.push(operatii[i].nume);
      // areProgram.push(element.areProgram);
    }
  }
  res.render('operator/numere-program', { produse, revizii, operatii, filtru, operatiiRevizie, revizie, denumiriOperatii, idAngajat /*, areProgram*/  });
})

router.post('/numere-program', async (req, res) => {
  const idAngajat = req.query.idAngajat;
  const Revizie = req.query.revizie;
  const valorileCampurilor = Object.values(req.body);
  const produs = await Revizii.find({ _id: Revizie }).exec();
  const vectorPrograme = produs[0].Numar_Program;
  let j = 0;
  for (let i = 1; i <= vectorPrograme.length; i++) {
    if (vectorPrograme[i] === "Nedefinit") {
      vectorPrograme[i] = valorileCampurilor[j];
      j++;
    }
  }
  const filtruRevizie = {_id: Revizie};
  const update = {
    $set: {
      Numar_Program: vectorPrograme
    }
  }
  await Revizii.updateOne(filtruRevizie,update).exec();
  res.redirect(`/operator/catalog?filtru=null&idAngajat=${idAngajat}`);
})

router.post('/deschide-comanda', async (req, res) => {
  const CodReper = req.query.lot;
  const idAngajat = req.query.idAngajat;
  const filtru = {_id: CodReper};
  const update = {
    $set: {
      Stadiu_lot: "In lucru"
    }
  }
  await Loturi.updateOne(filtru, update).exec();
  res.redirect(`/operator?idAngajat=${idAngajat}`);
})

module.exports = router;