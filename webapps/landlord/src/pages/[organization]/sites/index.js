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
import { fetchSites, QueryKeys } from '../../../utils/restcalls';
import { useContext, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { LuBuilding2, LuPlusCircle } from 'react-icons/lu';
import MultiProprietaireSelector from '../../../components/proprietaires/MultiProprietaireSelector';
import Page from '../../../components/Page';
import { StoreContext } from '../../../store';
import { Textarea } from '../../../components/ui/textarea';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import { withAuthentication } from '../../../components/Authentication';

const EMPTY_FORM = {
  nom: '',
  ville: '',
  codePostal: '',
  adresse: '',
  banquePrincipale: '',
  taxeFonciere: '',
  notes: ''
};

function NewSiteDialog({ open, setOpen, onCreated }) {
  const store = useContext(StoreContext);
  const [form, setForm] = useState(EMPTY_FORM);
  const [proprietaires, setProprietaires] = useState([]);
  const [saving, setSaving] = useState(false);
  const set = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const reset = () => {
    setForm(EMPTY_FORM);
    setProprietaires([]);
  };

  const handleSubmit = async () => {
    if (!form.nom.trim()) {
      toast.error('Le nom du site est obligatoire');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      taxeFonciere: form.taxeFonciere ? Number(form.taxeFonciere) : undefined,
      proprietaires
    };
    const { status, data } = await store.site.create(payload);
    setSaving(false);
    if (status !== 200) {
      toast.error('Erreur lors de la création du site');
      return;
    }
    toast.success('Site créé');
    reset();
    setOpen(false);
    onCreated?.(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau site</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="site-nom">Nom du site *</Label>
            <Input id="site-nom" value={form.nom} onChange={set('nom')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="site-ville">Ville</Label>
              <Input id="site-ville" value={form.ville} onChange={set('ville')} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="site-cp">Code postal</Label>
              <Input
                id="site-cp"
                value={form.codePostal}
                onChange={set('codePostal')}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="site-adresse">Adresse</Label>
            <Input
              id="site-adresse"
              value={form.adresse}
              onChange={set('adresse')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="site-banque">Banque principale</Label>
              <Input
                id="site-banque"
                value={form.banquePrincipale}
                onChange={set('banquePrincipale')}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="site-taxe">Taxe foncière (€)</Label>
              <Input
                id="site-taxe"
                type="number"
                value={form.taxeFonciere}
                onChange={set('taxeFonciere')}
              />
            </div>
          </div>
          <MultiProprietaireSelector
            value={proprietaires}
            onChange={setProprietaires}
          />
          <div className="grid gap-1.5">
            <Label htmlFor="site-notes">Notes</Label>
            <Textarea
              id="site-notes"
              value={form.notes}
              onChange={set('notes')}
            />
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

function Sites() {
  const store = useContext(StoreContext);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organization } = router.query;
  const [open, setOpen] = useState(false);

  const { data, isError, isLoading } = useQuery({
    queryKey: [QueryKeys.SITES],
    queryFn: () => fetchSites(store)
  });

  if (isError) {
    toast.error('Erreur lors du chargement des sites');
  }

  const sites = data || [];

  return (
    <Page
      loading={isLoading}
      dataCy="sitesPage"
      ActionBar={
        <div className="flex justify-end p-2 md:p-0">
          <Button className="gap-2" onClick={() => setOpen(true)}>
            <LuPlusCircle className="size-4" />
            Ajouter un site
          </Button>
        </div>
      }
    >
      <h1 className="text-2xl font-semibold mb-4">Sites</h1>
      {sites.length === 0 ? (
        <p className="text-muted-foreground">
          Aucun site pour le moment. Créez votre premier site.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => (
            <Card
              key={site._id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() =>
                router.push(`/${organization}/sites/${site._id}`)
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <LuBuilding2 className="size-5" />
                  {site.nom}
                </CardTitle>
                <CardDescription>
                  {[site.codePostal, site.ville].filter(Boolean).join(' ')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {site.banquePrincipale
                  ? `Banque : ${site.banquePrincipale}`
                  : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <NewSiteDialog
        open={open}
        setOpen={setOpen}
        onCreated={() =>
          queryClient.invalidateQueries({ queryKey: [QueryKeys.SITES] })
        }
      />
    </Page>
  );
}

export default withAuthentication(Sites);
