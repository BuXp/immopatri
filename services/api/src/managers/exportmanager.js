import {
  buildEtatLocatifRows,
  buildPatrimoineRows
} from './exportbuilders.js';
import { Collections } from '@immopatri/common';
import ExcelJS from 'exceljs';

async function sendXlsx(res, sheetName, columns, rows, fileName) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns;
  rows.forEach((row) => sheet.addRow(row));
  sheet.getRow(1).font = { bold: true };
  res.header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.header(
    'Content-Disposition',
    `attachment; filename="${fileName}"`
  );
  await workbook.xlsx.write(res);
  res.end();
}

export async function etatLocatif(req, res) {
  const realm = req.realm;
  const [lots, immeubles, sites] = await Promise.all([
    Collections.Property.find({ realmId: realm._id }).lean(),
    Collections.Immeuble.find({ realmId: realm._id }).lean(),
    Collections.Site.find({ realmId: realm._id }).lean()
  ]);
  const immeublesById = Object.fromEntries(
    immeubles.map((immeuble) => [String(immeuble._id), immeuble])
  );
  const sitesById = Object.fromEntries(
    sites.map((site) => [String(site._id), site])
  );
  const rows = buildEtatLocatifRows(lots, immeublesById, sitesById);
  await sendXlsx(
    res,
    'État locatif',
    [
      { header: 'Site', key: 'site', width: 20 },
      { header: 'Immeuble', key: 'immeuble', width: 20 },
      { header: 'Lot', key: 'lot', width: 20 },
      { header: 'Numéro', key: 'numero', width: 10 },
      { header: 'Surface', key: 'surface', width: 10 },
      { header: 'Statut', key: 'statut', width: 12 },
      { header: 'Loyer HC', key: 'loyerHC', width: 12 },
      { header: 'Charges', key: 'charges', width: 12 },
      { header: 'Loyer total', key: 'loyerTotal', width: 12 },
      { header: 'Tantièmes', key: 'tantiemes', width: 10 },
      { header: 'Nb propriétaires', key: 'nbProprietaires', width: 16 }
    ],
    rows,
    'etat-locatif.xlsx'
  );
}

export async function patrimoine(req, res) {
  const realm = req.realm;
  const [proprietaires, lots] = await Promise.all([
    Collections.Proprietaire.find({ realmId: realm._id }).lean(),
    Collections.Property.find({ realmId: realm._id }).lean()
  ]);
  const rows = buildPatrimoineRows(proprietaires, lots);
  await sendXlsx(
    res,
    'Patrimoine',
    [
      { header: 'Propriétaire', key: 'proprietaire', width: 28 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Nb lots', key: 'nbLots', width: 10 },
      { header: 'Loyer mensuel (€)', key: 'loyerMensuel', width: 16 },
      {
        header: 'Valeur estimée (€)',
        key: 'valeurEstimePatrimoine',
        width: 18
      }
    ],
    rows,
    'patrimoine.xlsx'
  );
}
