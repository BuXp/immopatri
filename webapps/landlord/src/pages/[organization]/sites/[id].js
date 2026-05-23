import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../../components/ui/dialog';
import { fetchImmeubles, QueryKeys } from '../../../utils/restcalls';
import { useContext, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import Link from 'next/link';
import { LuBuilding, LuChevronRight, LuPlusCircle } from 'react-icons/lu';
import Page from '../../../components/Page';
import { StoreContext } from '../../../store';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import { withAuthentication } from '../../../components/Authentication';

const MODES = [
  'monopropriete',
  'copropriete',
  'indivision',
  'sci',
  'sas',
  'sarl',
  'autre'
];

const EMPTY_FORM = { nom: '', adresse: '', type: '', modeDetention: '' };

function NewImmeubleDialog({ open, setOpen, siteId, onCreated }) {
  const store = useContext(StoreContext);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const set = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleSubmit = async () => {
    if (!form.nom.trim()) {
      toast.error("Le nom de l'immeuble est obligatoire");
      return;
    }
    setSaving(true);
    const payload = {
      nom: form.nom,
      adresse: form.adresse,
      type: form.type,
      siteId,
      modeDetention: form.modeDetention
        ? { type: form.modeDetention }
        : undefined
    };
    const { status, data } = await store.immeuble.create(payload);
    setSaving(false);
    if (status !== 200) {
      toast.error("Erreur lors de la création de l'immeuble");
      return;
    }
    toast.success('Immeuble créé');
    setForm(EMPTY_FORM);
    setOpen(false);
    onCreated?.(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel immeuble</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="imm-nom">Nom / numéro *</Label>
            <Input id="imm-nom" value={form.nom} onChange={set('nom')} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="imm-adresse">Adresse</Label>
            <Input
              id="imm-adresse"
              value={form.adresse}
              onChange={set('adresse')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="imm-type">Type</Label>
              <Input id="imm-type" value={form.type} onChange={set('type')} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="imm-mode">Mode de détention</Label>
              <select
                id="imm-mode"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.modeDetention}
                onChange={set('modeDetention')}
              >
                <option value="">—</option>
                {MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SiteDetail() {
  const store = useContext(StoreContext);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organization, id } = router.query;
  const [open, setOpen] = useState(false);

  const siteQuery = useQuery({
    queryKey: [QueryKeys.SITES, id],
    queryFn: async () => (await store.site.fetchOne(id)).data,
    enabled: !!id
  });
  const immeublesQuery = useQuery({
    queryKey: [QueryKeys.IMMEUBLES, id],
    queryFn: () => fetchImmeubles(store, id),
    enabled: !!id
  });

  const site = siteQuery.data || {};
  const immeubles = immeublesQuery.data || [];
  const isLoading = siteQuery.isLoading || immeublesQuery.isLoading;

  return (
    <Page
      loading={isLoading}
      dataCy="siteDetailPage"
      ActionBar={
        <div className="flex justify-end p-2 md:p-0">
          <Button className="gap-2" onClick={() => setOpen(true)}>
            <LuPlusCircle className="size-4" />
            Ajouter un immeuble
          </Button>
        </div>
      }
    >
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link href={`/${organization}/sites`} className="hover:underline">
          Sites
        </Link>
        <LuChevronRight className="size-4" />
        <span className="text-foreground">{site.nom}</span>
      </nav>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{site.nom}</CardTitle>
          <CardDescription>
            {[site.adresse, site.codePostal, site.ville]
              .filter(Boolean)
              .join(', ')}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
          <div>Banque : {site.banquePrincipale || '—'}</div>
          <div>
            Taxe foncière :{' '}
            {site.taxeFonciere != null ? `${site.taxeFonciere} €` : '—'}
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold mb-3">
        Immeubles ({immeubles.length})
      </h2>
      {immeubles.length === 0 ? (
        <p className="text-muted-foreground">
          Aucun immeuble rattaché à ce site.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {immeubles.map((immeuble) => (
            <Card
              key={immeuble._id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() =>
                router.push(`/${organization}/immeubles/${immeuble._id}`)
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <LuBuilding className="size-5" />
                  {immeuble.nom}
                </CardTitle>
                <CardDescription>{immeuble.adresse}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {immeuble.modeDetention?.type || immeuble.type || '—'}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NewImmeubleDialog
        open={open}
        setOpen={setOpen}
        siteId={id}
        onCreated={() =>
          queryClient.invalidateQueries({
            queryKey: [QueryKeys.IMMEUBLES, id]
          })
        }
      />
    </Page>
  );
}

export default withAuthentication(SiteDetail);
