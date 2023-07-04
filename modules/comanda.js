
const comenziInCurs = require('../models/comenzi-in-curs')
const comenziFinalizate = require('../models/comenzi-finalizate')

class Comanda {
  constructor(databaseElement) {
    this.id = databaseElement._id;
    this.RTSP = databaseElement.RTSP;
    this.Cod_client = databaseElement.Cod_client;
    this.nume = databaseElement.nume;
    this.cantitateaTotala = databaseElement.cantitateaTotala;
    this.esteNecesaraOperatia = databaseElement.esteNecesaraOperatia;
    this.numeOperatie = databaseElement.numeOperatie;
    this.stadiuOperatii = databaseElement.stadiuOperatii;
    this.cantitatePieseFinalizate = databaseElement.cantitatePieseFinalizate;
    this.angajatOperatie = databaseElement.angajatOperatie;
    this.utilajOperatie = databaseElement.utilajOperatie;
  }

  updateazaDB(idComanda) {
    comenziInCurs.updateOne(
      { _id: idComanda },
      { $set: {
        _id: this.id,
        RTSP: this.RTSP,
        Cod_client: this.Cod_client,
        nume: this.nume,
        cantitateaTotala: this.cantitateaTotala,
        esteNecesaraOperatia: this.esteNecesaraOperatia,
        numeOperatie: this.numeOperatie,
        stadiuOperatii: this.stadiuOperatii,
        cantitatePieseFinalizate: this.cantitatePieseFinalizate,
        angajatOperatie: this.angajatOperatie,
        utilajOperatie: this.utilajOperatie
      }}
    );
  }

  esteGata() {
    this.stadiuOperatii.forEach(stadiu => {
      if (stadiu === "In curs" || stadiu === "In asteptare" ) {
        return false;
      }
    });
    return true;
  }

  inchideComanda() {
    const comanda = comenziInCurs.findOne({ _id: this.id })
    const comandaFinalizata = {
      _id: comanda.id,
      RTSP: comanda.RTSP,
      Cod_client: comanda.Cod_client,
      nume: comanda.nume,
      cantitateaTotala: comanda.cantitateaTotala
    };
    comandaFinalizata.save();
    comanda.drop();
  }

}