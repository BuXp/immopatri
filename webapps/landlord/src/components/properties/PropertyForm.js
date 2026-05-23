import * as Yup from 'yup';
import {
  AddressField,
  NumberField,
  SelectField,
  SubmitButton,
  TextField
} from '@immopatri/commonui/components';
import { fetchImmeubles, QueryKeys } from '../../utils/restcalls';
import { Form, Formik } from 'formik';
import { useContext, useMemo } from 'react';
import { Label } from '../ui/label';
import MultiProprietaireSelector from '../proprietaires/MultiProprietaireSelector';
import { observer } from 'mobx-react-lite';
import PropertyIcon from './PropertyIcon';
import { Section } from '../formfields/Section';
import { StoreContext } from '../../store';
import { toJS } from 'mobx';
import types from './types';
import { useQuery } from '@tanstack/react-query';
import useTranslation from 'next-translate/useTranslation';

const validationSchema = Yup.object().shape({
  type: Yup.string().required(),
  name: Yup.string().required(),
  description: Yup.string(),
  phone: Yup.string(),
  digicode: Yup.string(),
  address: Yup.object().shape({
    street1: Yup.string(),
    street2: Yup.string(),
    city: Yup.string(),
    zipCode: Yup.string(),
    state: Yup.string(),
    country: Yup.string()
  }),
  rent: Yup.number().min(0).required()
});

const PropertyForm = observer(({ onSubmit }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  const { data: immeubles } = useQuery({
    queryKey: [QueryKeys.IMMEUBLES],
    queryFn: () => fetchImmeubles(store)
  });

  const initialValues = useMemo(
    () => ({
      type: store.property.selected?.type || '',
      name: store.property.selected?.name || '',
      description: store.property.selected?.description || '',
      surface: store.property.selected?.surface || '',
      phone: store.property.selected?.phone || '',
      digicode: store.property.selected?.digicode || '',
      address: store.property.selected?.address || {
        street1: '',
        street2: '',
        city: '',
        zipCode: '',
        state: '',
        country: ''
      },
      rent: store.property.selected?.price || '',
      immeubleId: store.property.selected?.immeubleId || '',
      proprietaires: toJS(store.property.selected?.proprietaires || []).map(
        (link) => ({
          proprietaireId: link.proprietaireId,
          pourcentage: link.pourcentage
        })
      )
    }),
    [store.property.selected]
  );

  const propertyTypes = useMemo(
    () =>
      types.map((type) => ({
        id: type.id,
        value: type.id,
        label: t(type.labelId),
        renderIcon: () => <PropertyIcon type={type.id} />
      })),
    [t]
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ values, isSubmitting, setFieldValue }) => {
        return (
          <Form autoComplete="off">
            <Section label={t('Property information')}>
              <div className="sm:flex sm:gap-2">
                <SelectField
                  label={t('Property Type')}
                  name="type"
                  values={propertyTypes}
                />
                <TextField label={t('Name')} name="name" />
              </div>
              <TextField label={t('Description')} name="description" />

              {[
                'store',
                'building',
                'apartment',
                'room',
                'office',
                'garage'
              ].includes(values.type) && (
                <div className="sm:flex sm:gap-2">
                  <NumberField label={t('Surface')} name="surface" />
                  <TextField label={t('Phone')} name="phone" />
                  <TextField label={t('Digicode')} name="digicode" />
                </div>
              )}
            </Section>
            <Section label={t('Address')}>
              <AddressField />
            </Section>
            <Section label="Rattachement patrimonial">
              <div className="grid gap-1.5">
                <Label htmlFor="lot-immeuble">Immeuble</Label>
                <select
                  id="lot-immeuble"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={values.immeubleId}
                  onChange={(event) =>
                    setFieldValue('immeubleId', event.target.value)
                  }
                >
                  <option value="">—</option>
                  {(immeubles || []).map((immeuble) => (
                    <option key={immeuble._id} value={immeuble._id}>
                      {immeuble.nom}
                    </option>
                  ))}
                </select>
              </div>
              <MultiProprietaireSelector
                value={values.proprietaires}
                onChange={(next) => setFieldValue('proprietaires', next)}
              />
            </Section>
            <Section label={t('Rent')}>
              <NumberField
                label={t('Rent excluding tax and expenses')}
                name="rent"
              />
            </Section>
            <SubmitButton
              size="large"
              label={!isSubmitting ? t('Save') : t('Saving')}
            />
          </Form>
        );
      }}
    </Formik>
  );
});

export default PropertyForm;
