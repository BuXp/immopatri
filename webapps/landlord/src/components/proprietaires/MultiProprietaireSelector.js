import { fetchProprietaires, QueryKeys } from '../../utils/restcalls';
import { LuPlus, LuTrash2 } from 'react-icons/lu';
import { useContext, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { proprietaireDisplayName } from '../../utils/proprietaire';
import { StoreContext } from '../../store';
import { useQuery } from '@tanstack/react-query';

// Controlled selector for owner links: value is an array of
// { proprietaireId, pourcentage }. Used in the Site / Immeuble / Lot forms
// to attach one or several owners with their detention percentage (DAT 2.8).
export default function MultiProprietaireSelector({
  value = [],
  onChange,
  label = 'Propriétaires'
}) {
  const store = useContext(StoreContext);
  const { data } = useQuery({
    queryKey: [QueryKeys.PROPRIETAIRES],
    queryFn: () => fetchProprietaires(store)
  });
  const proprietaires = data || [];
  const [pendingId, setPendingId] = useState('');
  const [pendingPct, setPendingPct] = useState('');

  const byId = (proprietaireId) =>
    proprietaires.find((p) => p._id === proprietaireId);

  const total = value.reduce(
    (sum, link) => sum + (Number(link.pourcentage) || 0),
    0
  );

  const handleAdd = () => {
    if (!pendingId) {
      return;
    }
    if (value.some((link) => link.proprietaireId === pendingId)) {
      return;
    }
    onChange?.([
      ...value,
      {
        proprietaireId: pendingId,
        pourcentage: pendingPct ? Number(pendingPct) : 0
      }
    ]);
    setPendingId('');
    setPendingPct('');
  };

  const handleRemove = (proprietaireId) =>
    onChange?.(value.filter((link) => link.proprietaireId !== proprietaireId));

  const handlePercent = (proprietaireId, pourcentage) =>
    onChange?.(
      value.map((link) =>
        link.proprietaireId === proprietaireId
          ? { ...link, pourcentage: pourcentage ? Number(pourcentage) : 0 }
          : link
      )
    );

  const available = proprietaires.filter(
    (p) => !value.some((link) => link.proprietaireId === p._id)
  );

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {value.length > 0 ? (
          <Badge variant={total === 100 ? 'success' : 'secondary'}>
            Total : {total}%
          </Badge>
        ) : null}
      </div>

      {value.length > 0 ? (
        <div className="grid gap-2">
          {value.map((link) => (
            <div
              key={link.proprietaireId}
              className="flex items-center gap-2"
            >
              <span className="flex-grow text-sm">
                {proprietaireDisplayName(byId(link.proprietaireId)) ||
                  link.proprietaireId}
              </span>
              <Input
                type="number"
                className="w-24"
                value={link.pourcentage}
                onChange={(event) =>
                  handlePercent(link.proprietaireId, event.target.value)
                }
              />
              <span className="text-sm text-muted-foreground">%</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(link.proprietaireId)}
              >
                <LuTrash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <select
          className="flex h-10 flex-grow rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={pendingId}
          onChange={(event) => setPendingId(event.target.value)}
        >
          <option value="">
            {available.length
              ? 'Ajouter un propriétaire…'
              : 'Aucun propriétaire disponible'}
          </option>
          {available.map((proprietaire) => (
            <option key={proprietaire._id} value={proprietaire._id}>
              {proprietaireDisplayName(proprietaire)}
            </option>
          ))}
        </select>
        <Input
          type="number"
          className="w-24"
          placeholder="%"
          value={pendingPct}
          onChange={(event) => setPendingPct(event.target.value)}
        />
        <Button type="button" variant="secondary" onClick={handleAdd}>
          <LuPlus className="size-4" />
        </Button>
      </div>
    </div>
  );
}
