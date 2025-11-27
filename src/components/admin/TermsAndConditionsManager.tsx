import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { DocumentIcon, SaveIcon } from '@/components/icons';
import { getTermsAndConditions, updateTermsAndConditions, TermsAndConditions } from '@/services/termsService';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export const TermsAndConditionsManager: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [terms, setTerms] = useState<TermsAndConditions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      return;
    }

    const loadTerms = async () => {
      try {
        setLoading(true);
        const termsData = await getTermsAndConditions();
        if (termsData) {
          setTerms(termsData);
          setContent(termsData.content);
        }
      } catch (error: any) {
        toast.error(error.message || 'Unable to load Terms and Conditions');
      } finally {
        setLoading(false);
      }
    };

    loadTerms();
  }, [currentUser]);

  // Check if content has changed
  useEffect(() => {
    if (terms) {
      setHasChanges(content !== terms.content);
    }
  }, [content, terms]);

  const handleSave = async () => {
    if (!currentUser || currentUser.role !== 'admin' || !content.trim()) {
      toast.error('Please enter Terms and Conditions content');
      return;
    }

    setSaving(true);
    try {
      await updateTermsAndConditions(content.trim(), currentUser.username);
      
      // Reload terms
      const updatedTerms = await getTermsAndConditions();
      if (updatedTerms) {
        setTerms(updatedTerms);
        setHasChanges(false);
        toast.success('Terms and Conditions updated successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Unable to update Terms and Conditions');
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <Card>
        <CardHeader title="Terms and Conditions" icon={<DocumentIcon />} />
        <div className="p-6">
          <p className="text-center text-gray-400">Only Admin can manage Terms and Conditions</p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader title="Terms and Conditions" icon={<DocumentIcon />} />
        <div className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Terms and Conditions" icon={<DocumentIcon />} />
        <div className="p-6 space-y-4">
          {terms && (
            <div className="text-sm text-gray-400 mb-4">
              <p>Version: {terms.version}</p>
              <p>Last updated: {new Date(terms.updatedAt).toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
              <p>Updated by: {terms.updatedBy}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-64 p-4 bg-dark-700 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Enter Terms and Conditions content here..."
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowPreview(true)}
              disabled={!content.trim()}
            >
              Preview
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={saving}
              disabled={!hasChanges || !content.trim()}
              className="flex-1"
            >
              <SaveIcon className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>

          {hasChanges && (
            <p className="text-sm text-yellow-400">
              You have unsaved changes
            </p>
          )}
        </div>
      </Card>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Terms and Conditions Preview"
        size="lg"
      >
        <div className="max-h-96 overflow-y-auto">
          <div className="prose prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans">
              {content || 'No content to preview'}
            </pre>
          </div>
        </div>
      </Modal>
    </div>
  );
};

