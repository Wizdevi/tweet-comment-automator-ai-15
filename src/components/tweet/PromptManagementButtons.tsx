
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus } from 'lucide-react';
import { PromptManagementDialog } from './PromptManagementDialog';
import { SavedPrompt, PublicPrompt } from '@/types/tweet';

interface PromptManagementButtonsProps {
  selectedPrompt?: (SavedPrompt & { type: 'personal' }) | (PublicPrompt & { type: 'public' });
  canEditPublicPrompt: boolean;
  onCreatePublicPrompt: (name: string, text: string) => Promise<{ success: boolean; message: string }>;
  onUpdatePrompt: (name: string, text: string) => Promise<{ success: boolean; message: string }>;
  onDeletePrompt: () => Promise<{ success: boolean; message: string }>;
}

export const PromptManagementButtons = ({
  selectedPrompt,
  canEditPublicPrompt,
  onCreatePublicPrompt,
  onUpdatePrompt,
  onDeletePrompt
}: PromptManagementButtonsProps) => {
  const showEditDeleteButtons = selectedPrompt !== undefined;

  return (
    <div className="flex gap-2">
      <PromptManagementDialog
        onSave={onCreatePublicPrompt}
        trigger={
          <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
            <Plus className="w-4 h-4 mr-2" />
            Создать публичный
          </Button>
        }
      />
      {showEditDeleteButtons && (
        <div className="flex gap-1">
          <PromptManagementDialog
            prompt={selectedPrompt}
            isPublic={selectedPrompt.type === 'public'}
            onSave={onUpdatePrompt}
            onDelete={selectedPrompt.type === 'public' && canEditPublicPrompt ? onDeletePrompt : undefined}
            trigger={
              <Button 
                variant="outline" 
                size="sm" 
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                disabled={selectedPrompt.type === 'public' && !canEditPublicPrompt}
              >
                <Edit className="w-4 h-4" />
              </Button>
            }
          />
          <Button
            onClick={onDeletePrompt}
            variant="outline"
            size="sm"
            className="border-red-600 text-red-400 hover:bg-red-700 hover:text-white"
            disabled={selectedPrompt.type === 'personal' || (selectedPrompt.type === 'public' && !canEditPublicPrompt)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
