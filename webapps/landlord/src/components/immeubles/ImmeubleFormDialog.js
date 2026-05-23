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
import { toast } from 'sonner';

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

function toForm(immeuble) {
  if (!immeuble) {
    return EMPTY_FORM;
  }
  return {
    nom: immeuble.nom || '',
    adresse: immeuble.adresse || '',
    type: immeuble.type || '',
    modeDetention: immeuble.modeDetention?.type || ''
  };
}

// Create or edit an immeuble. Edit mode is enabled when `immeuble` has an _id.
export default function ImmeubleFormDialog({
  open,
  setOpen,
  siteId,
  immeuble,
  onSaved
}) {
  const store = useContext(StoreContext);
  const isEdit = !!immeuble?._id;
  const [form, setForm] = useState(toForm(immeuble));
  const [proprietaires, setProprietaires] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(toForm(immeuble));
      setProprietaires(
        (immeuble?.proprietaires || []).map((link) => ({
          proprietaireId: link.proprietaireId,
          pourcentage: link.pourcentage
        }))
      );
    }
  }, [open, immeuble]);

  const set = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleSubmit = async () => {
    if (!form.nom.trim()) {
      toast.error("Le nom de l'immeuble est obligatoire");
      return;
    }
    setSaving(true);
    const modeDetention = form.modeDetention
      ? { ...(immeuble?.modeDetention || {}), type: form.modeDetention }
      : immeuble?.modeDetention;
    const payload = {
      nom: form.nom,
      adresse: form.adresse,
      type: form.type,
      siteId: siteId || immeuble?.siteId,
      proprietaires,
      modeDetention
    };
    const { status, data } = isEdit
      ? await store.immeuble.update({ ...immeuble, ...payload })
      : await store.immeuble.create(payload);
    setSaving(false);
    if (status !== 200) {
      toast.error(
        isEdit
          ? "Erreur lors de la mise à jour de l'immeuble"
          : "Erreur lors de la création de l'immeuble"
      );
      return;
    }
    toast.success(isEdit ? 'Immeuble mis à jour' : 'Immeuble créé');
    setOpen(false);
    onSaved?.(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier l'immeuble" : 'Nouvel immeuble'}
          </DialogTitle>
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
          <MultiProprietaireSelector
            value={proprietaires}
            onChange={setProprietaires}
          />
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
