import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog';
import { useContext, useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import MultiProprietaireSelector from '../proprietaires/MultiProprietaireSelector';
import { StoreContext } from '../../store';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';

const EMPTY_FORM = {
  nom: '',
  ville: '',
  codePostal: '',
  adresse: '',
  banquePrincipale: '',
  taxeFonciere: '',
  notes: ''
};

function toForm(site) {
  if (!site) {
    return EMPTY_FORM;
  }
  return {
    nom: site.nom || '',
    ville: site.ville || '',
    codePostal: site.codePostal || '',
    adresse: site.adresse || '',
    banquePrincipale: site.banquePrincipale || '',
    taxeFonciere: site.taxeFonciere ?? '',
    notes: site.notes || ''
  };
}

// Create or edit a site. Edit mode is enabled when `site` carries an _id.
export default function SiteFormDialog({ open, setOpen, site, onSaved }) {
  const store = useContext(StoreContext);
  const isEdit = !!site?._id;
  const [form, setForm] = useState(toForm(site));
  const [proprietaires, setProprietaires] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(toForm(site));
      setProprietaires(
        (site?.proprietaires || []).map((link) => ({
          proprietaireId: link.proprietaireId,
          pourcentage: link.pourcentage
        }))
      );
    }
  }, [open, site]);

  const set = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

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
    const { status, data } = isEdit
      ? await store.site.update({ ...site, ...payload })
      : await store.site.create(payload);
    setSaving(false);
    if (status !== 200) {
      toast.error(
        isEdit
          ? 'Erreur lors de la mise à jour du site'
          : 'Erreur lors de la création du site'
      );
      return;
    }
    toast.success(isEdit ? 'Site mis à jour' : 'Site créé');
    setOpen(false);
    onSaved?.(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier le site' : 'Nouveau site'}</DialogTitle>
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
            {isEdit ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
