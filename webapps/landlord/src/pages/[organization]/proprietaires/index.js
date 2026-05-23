import {
  Avatar,
  AvatarFallback
} from '../../../components/ui/avatar';
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
import { fetchProprietaires, QueryKeys } from '../../../utils/restcalls';
import {
  PROPRIETAIRE_TYPES,
  proprietaireDisplayName,
  proprietaireInitials
} from '../../../utils/proprietaire';
import { useContext, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { LuPlusCircle } from 'react-icons/lu';
import Page from '../../../components/Page';
import { StoreContext } from '../../../store';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import { withAuthentication } from '../../../components/Authentication';

const EMPTY_FORM = {
  type: 'physique',
  nom: '',
  prenom: '',
  raisonSociale: '',
  siren: '',
  email: '',
  telephone: '',
  valeurEstimePatrimoine: ''
};

function NewProprietaireDialog({ open, setOpen, onCreated }) {
  const store = useContext(StoreContext);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const set = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  const isPhysique = form.type === 'physique';

  const handleSubmit = async () => {
    if (isPhysique && !form.nom.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }
    if (!isPhysique && !form.raisonSociale.trim()) {
      toast.error('La raison sociale est obligatoire');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      valeurEstimePatrimoine: form.valeurEstimePatrimoine
        ? Number(form.valeurEstimePatrimoine)
        : undefined
    };
    const { status, data } = await store.proprietaire.create(payload);
    setSaving(false);
    if (status !== 200) {
      toast.error('Erreur lors de la création du propriétaire');
      return;
    }
    toast.success('Propriétaire créé');
    setForm(EMPTY_FORM);
    setOpen(false);
    onCreated?.(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau propriétaire</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="prop-type">Type juridique</Label>
            <select
              id="prop-type"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.type}
              onChange={set('type')}
            >
              {PROPRIETAIRE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          {isPhysique ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="prop-prenom">Prénom</Label>
                <Input
                  id="prop-prenom"
                  value={form.prenom}
                  onChange={set('prenom')}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="prop-nom">Nom *</Label>
                <Input id="prop-nom" value={form.nom} onChange={set('nom')} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="prop-rs">Raison sociale *</Label>
                <Input
                  id="prop-rs"
                  value={form.raisonSociale}
                  onChange={set('raisonSociale')}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="prop-siren">SIREN</Label>
                <Input
                  id="prop-siren"
                  value={form.siren}
                  onChange={set('siren')}
                />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="prop-email">Email</Label>
              <Input
                id="prop-email"
                type="email"
                value={form.email}
                onChange={set('email')}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="prop-tel">Téléphone</Label>
              <Input
                id="prop-tel"
                value={form.telephone}
                onChange={set('telephone')}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="prop-valeur">Valeur estimée du patrimoine (€)</Label>
            <Input
              id="prop-valeur"
              type="number"
              value={form.valeurEstimePatrimoine}
              onChange={set('valeurEstimePatrimoine')}
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

function Proprietaires() {
  const store = useContext(StoreContext);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organization } = router.query;
  const [open, setOpen] = useState(false);

  const { data, isError, isLoading } = useQuery({
    queryKey: [QueryKeys.PROPRIETAIRES],
    queryFn: () => fetchProprietaires(store)
  });

  if (isError) {
    toast.error('Erreur lors du chargement des propriétaires');
  }

  const proprietaires = data || [];

  return (
    <Page
      loading={isLoading}
      dataCy="proprietairesPage"
      ActionBar={
        <div className="flex justify-end p-2 md:p-0">
          <Button className="gap-2" onClick={() => setOpen(true)}>
            <LuPlusCircle className="size-4" />
            Ajouter un propriétaire
          </Button>
        </div>
      }
    >
      <h1 className="text-2xl font-semibold mb-4">Propriétaires</h1>
      {proprietaires.length === 0 ? (
        <p className="text-muted-foreground">
          Aucun propriétaire pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proprietaires.map((proprietaire) => (
            <Card
              key={proprietaire._id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() =>
                router.push(
                  `/${organization}/proprietaires/${proprietaire._id}`
                )
              }
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {proprietaireInitials(proprietaire)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {proprietaireDisplayName(proprietaire)}
                    </CardTitle>
                    <CardDescription>
                      <Badge variant="secondary">
                        {proprietaire.type || 'physique'}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {proprietaire.email || proprietaire.telephone || '—'}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <NewProprietaireDialog
        open={open}
        setOpen={setOpen}
        onCreated={() =>
          queryClient.invalidateQueries({
            queryKey: [QueryKeys.PROPRIETAIRES]
          })
        }
      />
    </Page>
  );
}

export default withAuthentication(Proprietaires);
