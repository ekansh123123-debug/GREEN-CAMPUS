import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import FormField from '../../components/ui/FormField';
import Button from '../../components/ui/Button';
import ImageUploadField from '../../components/ui/ImageUploadField';
import { apiClient } from '../../lib/apiClient';
import {
  MARKETPLACE_CATEGORIES,
  ITEM_CONDITIONS,
  EXCHANGE_TYPES,
} from '../../lib/constants';
import { PlusCircle } from 'lucide-react';

export default function CreateListingPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(MARKETPLACE_CATEGORIES[0]);
  const [condition, setCondition] = useState(ITEM_CONDITIONS[1]); // Like New
  const [exchangeType, setExchangeType] = useState(EXCHANGE_TYPES.DONATE);
  const [priceInr, setPriceInr] = useState('');
  const [desiredExchangeItem, setDesiredExchangeItem] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleFileSelect = (file) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const validate = () => {
    const errs = {};
    if (!title.trim() || title.length < 5) {
      errs.title = 'Title must be at least 5 characters long.';
    }
    if (!description.trim() || description.length < 10) {
      errs.description = 'Please describe the item condition and specifications (min 10 chars).';
    }
    if (exchangeType === EXCHANGE_TYPES.SELL) {
      const price = Number(priceInr);
      if (!priceInr || isNaN(price) || price <= 0) {
        errs.priceInr = 'Please provide a valid price in INR greater than 0.';
      }
    }
    if (exchangeType === EXCHANGE_TYPES.EXCHANGE) {
      if (!desiredExchangeItem.trim() || desiredExchangeItem.length < 3) {
        errs.desiredExchangeItem = 'Please specify what academic item you wish to barter for.';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      let uploadedUrl = null;
      if (imageFile) {
        const uploadResult = await apiClient.uploadImage(imageFile);
        uploadedUrl = uploadResult.url;
      }

      await apiClient.post('/listings', {
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        exchange_type: exchangeType,
        price_inr: exchangeType === EXCHANGE_TYPES.SELL ? Number(priceInr) : 0,
        desired_exchange_item: exchangeType === EXCHANGE_TYPES.EXCHANGE ? desiredExchangeItem.trim() : null,
        image_url: uploadedUrl,
      });

      navigate('/marketplace');
    } catch (err) {
      setErrors({ form: err.message || 'Failed to create listing' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader
        title="List Academic Resource for Exchange"
        description="Share textbooks, drafters, calculators, and lab items with peer engineering students at DYPCOE Akurdi."
      />

      {errors.form && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Category" id="category" required>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:border-campus-600 focus:ring-1 focus:ring-campus-600"
            >
              {MARKETPLACE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Item Condition" id="condition" required>
            <select
              id="condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:border-campus-600 focus:ring-1 focus:ring-campus-600"
            >
              {ITEM_CONDITIONS.map((cond) => (
                <option key={cond} value={cond}>
                  {cond}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField
          label="Item Title"
          id="title"
          required
          error={errors.title}
          helperText="E.g., Casio fx-991EX Scientific Calculator or Engineering Mechanics (Bhavikatti)"
        >
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="E.g., Engineering Drawing Mini-Drafter with Scales"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-campus-600 focus:ring-1 focus:ring-campus-600"
          />
        </FormField>

        {/* Exchange Type Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Exchange Type <span className="text-rose-600">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setExchangeType(EXCHANGE_TYPES.DONATE)}
              className={`p-3 rounded-lg border text-left transition-all ${
                exchangeType === EXCHANGE_TYPES.DONATE
                  ? 'border-campus-600 bg-campus-50/50 ring-1 ring-campus-600'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="font-semibold text-sm text-slate-900">Donate (Free)</div>
              <div className="text-xs text-slate-500 mt-1">Free academic handover to a junior or peer.</div>
            </button>

            <button
              type="button"
              onClick={() => setExchangeType(EXCHANGE_TYPES.SELL)}
              className={`p-3 rounded-lg border text-left transition-all ${
                exchangeType === EXCHANGE_TYPES.SELL
                  ? 'border-campus-600 bg-campus-50/50 ring-1 ring-campus-600'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="font-semibold text-sm text-slate-900">Sell (Direct INR)</div>
              <div className="text-xs text-slate-500 mt-1">Affordable student pricing. Offline cash/UPI.</div>
            </button>

            <button
              type="button"
              onClick={() => setExchangeType(EXCHANGE_TYPES.EXCHANGE)}
              className={`p-3 rounded-lg border text-left transition-all ${
                exchangeType === EXCHANGE_TYPES.EXCHANGE
                  ? 'border-campus-600 bg-campus-50/50 ring-1 ring-campus-600'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="font-semibold text-sm text-slate-900">Barter Exchange</div>
              <div className="text-xs text-slate-500 mt-1">Swap for another academic book or tool.</div>
            </button>
          </div>
        </div>

        {/* Dynamic fields based on exchange type */}
        {exchangeType === EXCHANGE_TYPES.SELL && (
          <FormField
            label="Price in INR (₹)"
            id="priceInr"
            required
            error={errors.priceInr}
            helperText="Direct peer-to-peer settlement during handover."
          >
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-500 text-sm font-medium">₹</span>
              <input
                type="number"
                id="priceInr"
                min="10"
                step="10"
                value={priceInr}
                onChange={(e) => setPriceInr(e.target.value)}
                placeholder="400"
                className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:border-campus-600 focus:ring-1 focus:ring-campus-600"
              />
            </div>
          </FormField>
        )}

        {exchangeType === EXCHANGE_TYPES.EXCHANGE && (
          <FormField
            label="Desired Barter Item"
            id="desiredExchangeItem"
            required
            error={errors.desiredExchangeItem}
            helperText="Specify what equipment, book, or kit you are willing to trade for."
          >
            <input
              type="text"
              id="desiredExchangeItem"
              value={desiredExchangeItem}
              onChange={(e) => setDesiredExchangeItem(e.target.value)}
              placeholder="E.g., Casio fx-991EX or 2nd Year Data Structures Textbook"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-campus-600 focus:ring-1 focus:ring-campus-600"
            />
          </FormField>
        )}

        <FormField
          label="Detailed Description"
          id="description"
          required
          error={errors.description}
          helperText="Mention edition, highlighting, completeness, or handover location."
        >
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain edition, author, marks/wear, and convenient on-campus meeting points like Library or Canteen..."
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-campus-600 focus:ring-1 focus:ring-campus-600"
          />
        </FormField>

        {/* Item Photo */}
        <ImageUploadField
          label="Item Photo (Optional)"
          helperText="Accepted: JPEG, PNG, WebP up to 5 MB. Clear photos get requested faster."
          onFileSelect={handleFileSelect}
          previewUrl={imagePreview}
          onClear={handleClearImage}
        />

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate('/marketplace')} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting} icon={PlusCircle}>
            Publish Resource Listing
          </Button>
        </div>
      </form>
    </div>
  );
}
