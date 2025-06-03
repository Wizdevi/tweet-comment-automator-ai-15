
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { PromptManagementDialog } from './PromptManagementDialog';
import { PublicPrompt } from '@/types/tweet';

interface PromptManagementButtonsProps {
  selectedPrompt?: PublicPrompt;
  onUpdatePrompt: (name: string, text: string) => Promise<{ success: boolean; message: string }>;
  onDeletePrompt: () => Promise<{ success: boolean; message: string }>;
}

export const PromptManagementButtons = ({
  selectedPrompt,
  onUpdatePrompt,
  onDeletePrompt
}: PromptManagementButtonsProps) => {
  const showEditDeleteButtons = selectedPrompt !== undefined;

  if (!showEditDeleteButtons) {
    return null;
  }

  return (
    <div className="flex gap-1">
      <PromptManagementDialog
        prompt={selectedPrompt}
        isPublic={true}
        onSave={onUpdatePrompt}
        onDelete={onDeletePrompt}
        trigger={
          <Button 
            variant="outline" 
            size="sm" 
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
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
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};
