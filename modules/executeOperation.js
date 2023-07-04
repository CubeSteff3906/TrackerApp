const executaOperatie = function (Comanda, operatieSelectata) {
  const comenziInCurs = require('../models/comenzi-in-curs');
  const angajati = require('../models/angajati')
  if (Comanda.stadiuOperatie[operatieSelectata] === "In asteptare") { // Se initiaza o operatie noua
    Comanda.stadiuOperatie[operatieSelectata] = "In lucru";
    Comanda.angajatOperatie[operatieSelectata] = angajati.findOne({ _id: req.query.idAngajat }).nume;
    Comanda.utilajOperatie[operatieSelectata] = req.body.utilajSelectat;
  } else if (Comanda.stadiuOperatie[operatieSelectata] === "In lucru") { // Se finalizeaza o operatie
    Comanda.cantitatePieseFinalizate[operatieSelectata] += req.body.cantitateFinalizata;
    if (Comanda.cantitatePieseFinalizate[operatieSelectata] < Comanda.cantitateaTotala) {
      Comanda.stadiuOperatie[operatieSelectata] = "In asteptare";
    } else {
      Comanda.stadiuOperatii[operatieSelectata] = "Finalizata";
    }
    Comanda.angajatOperatie[operatieSelectata] = "Niciunul";
    Comanda.utilajOperatie[operatieSelectata] = "Niciunul";
  }
  Comanda.updateDatabaseElement(comenziInCurs.findOne({ id: req.query.idComanda }))
}

module.exports = executaOperatie;