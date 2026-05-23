import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../../components/ui/card';
import { fetchProperties, QueryKeys } from '../../../utils/restcalls';
import { LuChevronRight, LuDoorOpen, LuPencil } from 'react-icons/lu';
import { useContext, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import CoproprieteSection from '../../../components/immeubles/CoproprieteSection';
import ImmeubleFormDialog from '../../../components/immeubles/ImmeubleFormDialog';
import Link from 'next/link';
import Page from '../../../components/Page';
import { StoreContext } from '../../../store';
import { useRouter } from 'next/router';
import { withAuthentication } from '../../../components/Authentication';

function ImmeubleDetail() {
  const store = useContext(StoreContext);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organization, id } = router.query;
  const [openEdit, setOpenEdit] = useState(false);

  const immeubleQuery = useQuery({
    queryKey: [QueryKeys.IMMEUBLES, id],
    queryFn: async () => (await store.immeuble.fetchOne(id)).data,
    enabled: !!id
  });
  const immeuble = immeubleQuery.data || {};

  const siteQuery = useQuery({
    queryKey: [QueryKeys.SITES, immeuble.siteId],
    queryFn: async () => (await store.site.fetchOne(immeuble.siteId)).data,
    enabled: !!immeuble.siteId
  });
  const site = siteQuery.data || {};

  const lotsQuery = useQuery({
    queryKey: [QueryKeys.PROPERTIES],
    queryFn: () => fetchProperties(store)
  });
  const lots = (lotsQuery.data || []).filter((lot) => lot.immeubleId === id);

  const isLoading = immeubleQuery.isLoading || lotsQuery.isLoading;

  return (
    <Page loading={isLoading} dataCy="immeubleDetailPage">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link href={`/${organization}/sites`} className="hover:underline">
          Sites
        </Link>
        <LuChevronRight className="size-4" />
        {immeuble.siteId ? (
          <Link
            href={`/${organization}/sites/${immeuble.siteId}`}
            className="hover:underline"
          >
            {site.nom || 'Site'}
          </Link>
        ) : (
          <span>Site</span>
        )}
        <LuChevronRight className="size-4" />
        <span className="text-foreground">{immeuble.nom}</span>
      </nav>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{immeuble.nom}</CardTitle>
              <CardDescription>{immeuble.adresse}</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setOpenEdit(true)}
            >
              <LuPencil className="size-4" />
              Modifier
            </Button>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
          <div>Type : {immeuble.type || '—'}</div>
          <div>Détention : {immeuble.modeDetention?.type || '—'}</div>
          <div>Réf. cadastrale : {immeuble.refCadastrale || '—'}</div>
          <div>IBAN : {immeuble.iban || '—'}</div>
        </CardContent>
      </Card>

      {immeuble.modeDetention?.type === 'copropriete' && (
        <CoproprieteSection immeuble={immeuble} />
      )}

      <h2 className="text-xl font-semibold mb-3">Lots ({lots.length})</h2>
      {lots.length === 0 ? (
        <p className="text-muted-foreground">
          Aucun lot rattaché à cet immeuble. Rattachez un bien via le champ
          Immeuble de sa fiche.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lots.map((lot) => (
            <Card
              key={lot._id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() =>
                router.push(`/${organization}/properties/${lot._id}`)
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <LuDoorOpen className="size-5" />
                  {lot.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  {lot.type}
                  {lot.statut ? (
                    <Badge variant="secondary">{lot.statut}</Badge>
                  ) : null}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {lot.loyerTotal != null
                  ? `Loyer : ${lot.loyerTotal} €`
                  : lot.price != null
                    ? `Loyer : ${lot.price} €`
                    : '—'}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ImmeubleFormDialog
        open={openEdit}
        setOpen={setOpenEdit}
        siteId={immeuble.siteId}
        immeuble={immeuble}
        onSaved={() =>
          queryClient.invalidateQueries({
            queryKey: [QueryKeys.IMMEUBLES, id]
          })
        }
      />
    </Page>
  );
}

export default withAuthentication(ImmeubleDetail);
