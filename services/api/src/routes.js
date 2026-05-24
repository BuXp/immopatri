import * as accountingManager from './managers/accountingmanager.js';
import * as alerteManager from './managers/alertemanager.js';
import * as dashboardManager from './managers/dashboardmanager.js';
import * as emailManager from './managers/emailmanager.js';
import * as immeubleManager from './managers/immeublemanager.js';
import * as leaseManager from './managers/leasemanager.js';
import * as occupantManager from './managers/occupantmanager.js';
import * as propertyManager from './managers/propertymanager.js';
import * as proprietaireManager from './managers/proprietairemanager.js';
import * as realmManager from './managers/realmmanager.js';
import * as rentManager from './managers/rentmanager.js';
import * as siteManager from './managers/sitemanager.js';
import { Middlewares, Service } from '@immopatri/common';
import express from 'express';

export default function routes() {
  const { ACCESS_TOKEN_SECRET } = Service.getInstance().envConfig.getValues();
  const router = express.Router();
  router.use(
    // protect the api access by checking the access token
    Middlewares.needAccessToken(ACCESS_TOKEN_SECRET),
    // update req with the user organizations
    Middlewares.checkOrganization(),
    // forbid access to tenant
    Middlewares.notRoles(['tenant'])
  );

  const realmsRouter = express.Router();
  realmsRouter.get('/', realmManager.all);
  realmsRouter.get('/:id', realmManager.one);
  realmsRouter.post('/', Middlewares.asyncWrapper(realmManager.add));
  realmsRouter.patch('/:id', Middlewares.asyncWrapper(realmManager.update));
  router.use('/realms', realmsRouter);

  const dashboardRouter = express.Router();
  dashboardRouter.get('/', Middlewares.asyncWrapper(dashboardManager.all));
  router.use('/dashboard', dashboardRouter);

  const leasesRouter = express.Router();
  leasesRouter.get('/', Middlewares.asyncWrapper(leaseManager.all));
  leasesRouter.get('/:id', Middlewares.asyncWrapper(leaseManager.one));
  leasesRouter.post('/', Middlewares.asyncWrapper(leaseManager.add));
  leasesRouter.patch('/:id', Middlewares.asyncWrapper(leaseManager.update));
  leasesRouter.delete('/:ids', Middlewares.asyncWrapper(leaseManager.remove));
  router.use('/leases', leasesRouter);

  const occupantsRouter = express.Router();
  occupantsRouter.get('/', Middlewares.asyncWrapper(occupantManager.all));
  occupantsRouter.get('/:id', Middlewares.asyncWrapper(occupantManager.one));
  occupantsRouter.post('/', Middlewares.asyncWrapper(occupantManager.add));
  occupantsRouter.patch(
    '/:id',
    Middlewares.asyncWrapper(occupantManager.update)
  );
  occupantsRouter.delete(
    '/:ids',
    Middlewares.asyncWrapper(occupantManager.remove)
  );
  router.use('/tenants', occupantsRouter);

  const rentsRouter = express.Router();
  rentsRouter.patch(
    '/payment/:id/:term',
    Middlewares.asyncWrapper(rentManager.updateByTerm)
  );
  rentsRouter.get(
    '/tenant/:id',
    Middlewares.asyncWrapper(rentManager.rentsOfOccupant)
  );
  rentsRouter.get(
    '/tenant/:id/:term',
    Middlewares.asyncWrapper(rentManager.rentOfOccupantByTerm)
  );
  rentsRouter.get('/:year/:month', Middlewares.asyncWrapper(rentManager.all));
  router.use('/rents', rentsRouter);

  const propertiesRouter = express.Router();
  propertiesRouter.get('/', Middlewares.asyncWrapper(propertyManager.all));
  propertiesRouter.get('/:id', Middlewares.asyncWrapper(propertyManager.one));
  propertiesRouter.post('/', Middlewares.asyncWrapper(propertyManager.add));
  propertiesRouter.patch(
    '/:id',
    Middlewares.asyncWrapper(propertyManager.update)
  );
  propertiesRouter.delete(
    '/:ids',
    Middlewares.asyncWrapper(propertyManager.remove)
  );
  router.use('/properties', propertiesRouter);

  // ── ImmoPatri: hierarchie patrimoniale Sites > Immeubles > Lots (DAT Sprint 1) ──
  const sitesRouter = express.Router();
  sitesRouter.get('/', Middlewares.asyncWrapper(siteManager.all));
  sitesRouter.get('/:id', Middlewares.asyncWrapper(siteManager.one));
  sitesRouter.post('/', Middlewares.asyncWrapper(siteManager.add));
  sitesRouter.patch('/:id', Middlewares.asyncWrapper(siteManager.update));
  sitesRouter.delete('/:ids', Middlewares.asyncWrapper(siteManager.remove));
  router.use('/sites', sitesRouter);

  const immeublesRouter = express.Router();
  immeublesRouter.get('/', Middlewares.asyncWrapper(immeubleManager.all));
  immeublesRouter.get('/:id', Middlewares.asyncWrapper(immeubleManager.one));
  immeublesRouter.get(
    '/:id/repartition',
    Middlewares.asyncWrapper(immeubleManager.repartition)
  );
  immeublesRouter.post('/', Middlewares.asyncWrapper(immeubleManager.add));
  immeublesRouter.patch(
    '/:id',
    Middlewares.asyncWrapper(immeubleManager.update)
  );
  immeublesRouter.delete(
    '/:ids',
    Middlewares.asyncWrapper(immeubleManager.remove)
  );
  router.use('/immeubles', immeublesRouter);

  // ── ImmoPatri: proprietaires multiples (DAT Sprint 2) ──
  const proprietairesRouter = express.Router();
  proprietairesRouter.get('/', Middlewares.asyncWrapper(proprietaireManager.all));
  proprietairesRouter.get(
    '/:id/patrimoine',
    Middlewares.asyncWrapper(proprietaireManager.patrimoine)
  );
  proprietairesRouter.get(
    '/:id',
    Middlewares.asyncWrapper(proprietaireManager.one)
  );
  proprietairesRouter.post(
    '/',
    Middlewares.asyncWrapper(proprietaireManager.add)
  );
  proprietairesRouter.patch(
    '/:id',
    Middlewares.asyncWrapper(proprietaireManager.update)
  );
  proprietairesRouter.delete(
    '/:ids',
    Middlewares.asyncWrapper(proprietaireManager.remove)
  );
  router.use('/proprietaires', proprietairesRouter);

  // ── ImmoPatri: alertes de conformité DPE & diagnostics (DAT Sprint 3) ──
  const alertesRouter = express.Router();
  alertesRouter.get('/', Middlewares.asyncWrapper(alerteManager.all));
  alertesRouter.post('/scan', Middlewares.asyncWrapper(alerteManager.scan));
  alertesRouter.post(
    '/notify',
    Middlewares.asyncWrapper(alerteManager.notify)
  );
  alertesRouter.patch(
    '/:id/acquittement',
    Middlewares.asyncWrapper(alerteManager.acknowledge)
  );
  router.use('/alertes', alertesRouter);

  router.get(
    '/accounting/:year',
    Middlewares.asyncWrapper(accountingManager.all)
  );
  router.get(
    '/csv/tenants/incoming/:year',
    Middlewares.asyncWrapper(accountingManager.csv.incomingTenants)
  );
  router.get(
    '/csv/tenants/outgoing/:year',
    Middlewares.asyncWrapper(accountingManager.csv.outgoingTenants)
  );
  router.get(
    '/csv/settlements/:year',
    Middlewares.asyncWrapper(accountingManager.csv.settlements)
  );

  const emailRouter = express.Router();
  emailRouter.post('/', Middlewares.asyncWrapper(emailManager.send));
  router.use('/emails', emailRouter);

  const apiRouter = express.Router();
  apiRouter.use('/api/v2', router);

  return apiRouter;
}
