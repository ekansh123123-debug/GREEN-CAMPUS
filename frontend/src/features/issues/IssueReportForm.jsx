import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import FormField from '../../components/ui/FormField';
import Button from '../../components/ui/Button';
import ImageUploadField from '../../components/ui/ImageUploadField';
import SimilarIssueModal from './SimilarIssueModal';
import { apiClient } from '../../lib/apiClient';
import {
  CAMPUS_BUILDINGS,
  CAMPUS_FLOORS,
} from '../../lib/constants';
import { Send, Search } from 'lucide-react';

function detectCategory(text) {
  const lower = (text || '').toLowerCase();
  if (/water|leak|tap|pipe|drain|flush|sink|washbasin/i.test(lower)) return 'Water';
  if (/light|fan|bulb|tube|switch|wire|power|ac|electric|socket|fuse/i.test(lower)) return 'Electricity';
  if (/waste|garbage|trash|dustbin|litter|debris|dump/i.test(lower)) return 'Waste Management';
  if (/toilet|restroom|washroom|urinal|sanit|soap|smell|stink/i.test(lower)) return 'Sanitation';
  if (/bench|desk|door|window|chair|board|table|wall|ceiling|floor|paint/i.test(lower)) return 'Infrastructure';
  if (/pc|computer|lab|keyboard|mouse|lan|wifi|terminal|monitor|server|screen/i.test(lower)) return 'Laboratory Equipment';
  return 'Cleanliness';
}

export default function IssueReportForm() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [building] = useState(CAMPUS_BUILDINGS[0]);
  const [floor, setFloor] = useState(CAMPUS_FLOORS[0]);
  const [roomArea, setRoomArea] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [similarIssues, setSimilarIssues] = useState([]);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [hasDismissedSimilar, setHasDismissedSimilar] = useState(false);

  // Live Similar Issue Check (Deterministic Building + Floor filter)
  useEffect(() => {
    let isMounted = true;
    async function checkSimilar() {
      if (!building || !floor) return;
      try {
        const matches = await apiClient.get(
          `/issues/similar?building=${encodeURIComponent(building)}&floor=${encodeURIComponent(floor)}`
        );
        if (isMounted) {
          setSimilarIssues(matches || []);
        }
      } catch {
        if (isMounted) setSimilarIssues([]);
      }
    }
    checkSimilar();
    return () => {
      isMounted = false;
    };
  }, [building, floor]);

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

  const handleUpvoteExisting = async (issueId) => {
    try {
      await apiClient.post(`/issues/${issueId}/upvote`);
      setShowSimilarModal(false);
      navigate(`/issues/${issueId}`);
    } catch (err) {
      alert(err.message || 'Could not upvote issue.');
    }
  };

  const validate = () => {
    const errs = {};
    if (!title.trim() || title.length < 5) {
      errs.title = 'Title must be at least 5 characters long.';
    }
    if (!description.trim() || description.length < 10) {
      errs.description = 'Please provide a clear description of at least 10 characters.';
    }
    if (!roomArea.trim()) {
      errs.roomArea = 'Please specify the room number, lab, or specific area.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const executeSubmission = async () => {
    setSubmitting(true);
    try {
      let uploadedUrl = null;
      if (imageFile) {
        const uploadResult = await apiClient.uploadImage(imageFile);
        uploadedUrl = uploadResult.url;
      }

      const detectedCategory = detectCategory(`${title} ${description}`);

      await apiClient.post('/issues', {
        title: title.trim(),
        description: description.trim(),
        category: detectedCategory,
        building: building || CAMPUS_BUILDINGS[0],
        floor,
        room_area: roomArea.trim(),
        image_url: uploadedUrl,
      });

      navigate('/issues');
    } catch (err) {
      setErrors({ form: err.message || 'Failed to submit report. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    // Check if there are similar issues not yet reviewed
    if (similarIssues.length > 0 && !hasDismissedSimilar) {
      setShowSimilarModal(true);
      return;
    }

    await executeSubmission();
  };

  const handleProceedAnyway = async () => {
    setShowSimilarModal(false);
    setHasDismissedSimilar(true);
    if (validate()) {
      await executeSubmission();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      <PageHeader
        title="Report Campus Issue"
        description="Submit a maintenance or facility concern to campus administration and maintenance staff. Deterministic duplicate checking is active."
      />

      {similarIssues.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Search className="w-5 h-5 text-amber-700 shrink-0" />
            <span>
              <strong>{similarIssues.length} similar active issue(s)</strong> already logged on{' '}
              {floor}.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full sm:w-auto border-amber-400 text-amber-900 hover:bg-amber-100 shrink-0 min-h-[38px]"
            onClick={() => setShowSimilarModal(true)}
          >
            Review Existing
          </Button>
        </div>
      )}

      {errors.form && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Floor Level" id="floor" required>
            <select
              id="floor"
              value={floor}
              onChange={(e) => {
                setFloor(e.target.value);
                setHasDismissedSimilar(false);
              }}
              className="w-full min-h-[44px] px-3.5 py-2.5 border border-slate-300 rounded-lg text-base sm:text-sm focus:border-campus-600 focus:ring-1 focus:ring-campus-600 bg-white"
            >
              {CAMPUS_FLOORS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Specific Room / Area"
            id="roomArea"
            required
            error={errors.roomArea}
            helperText="E.g., Classroom 204, Chemistry Lab 2, Washroom 101"
          >
            <input
              type="text"
              id="roomArea"
              value={roomArea}
              onChange={(e) => setRoomArea(e.target.value)}
              placeholder="E.g., Room 204"
              className="w-full min-h-[44px] px-3.5 py-2.5 border border-slate-300 rounded-lg text-base sm:text-sm focus:border-campus-600 focus:ring-1 focus:ring-campus-600"
            />
          </FormField>
        </div>

        {/* Title & Description */}
        <FormField
          label="Issue Title"
          id="title"
          required
          error={errors.title}
          helperText="Summarize the issue clearly in one sentence."
        >
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="E.g., Broken water faucet leaking in ground floor corridor"
            className="w-full min-h-[44px] px-3.5 py-2.5 border border-slate-300 rounded-lg text-base sm:text-sm focus:border-campus-600 focus:ring-1 focus:ring-campus-600"
          />
        </FormField>

        <FormField
          label="Detailed Description"
          id="description"
          required
          error={errors.description}
          helperText="Describe what is damaged, safety risks, or observations for maintenance staff."
        >
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide specific details to help the maintenance team bring the right tools and replacement parts..."
            className="w-full p-3.5 border border-slate-300 rounded-lg text-base sm:text-sm focus:border-campus-600 focus:ring-1 focus:ring-campus-600"
          />
        </FormField>

        {/* Evidence Photo */}
        <ImageUploadField
          label="Evidence Photo (Optional)"
          onFileSelect={handleFileSelect}
          previewUrl={imagePreview}
          onClear={handleClearImage}
        />

        <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
          <Button variant="secondary" onClick={() => navigate('/issues')} disabled={submitting} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting} icon={Send} className="w-full sm:w-auto">
            Submit Issue Report
          </Button>
        </div>
      </form>

      {/* Similar Issue Modal */}
      <SimilarIssueModal
        isOpen={showSimilarModal}
        similarIssues={similarIssues}
        onUpvoteExisting={handleUpvoteExisting}
        onProceedAnyway={handleProceedAnyway}
        onClose={() => setShowSimilarModal(false)}
      />
    </div>
  );
}
