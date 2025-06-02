
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Edit, Trash2, Plus } from 'lucide-react';
import { SavedPrompt, PublicPrompt } from '@/types/tweet';

interface PromptManagementDialogProps {
  prompt?: SavedPrompt | PublicPrompt;
  isPublic?: boolean;
  onSave: (name: string, text: string) => Promise<{ success: boolean; message: string }>;
  onDelete?: () => Promise<{ success: boolean; message: string }>;
  trigger: React.ReactNode;
}

export const PromptManagementDialog = ({ 
  prompt, 
  isPublic = false, 
  onSave, 
  onDelete, 
  trigger 
}: PromptManagementDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(prompt?.name || '');
  const [text, setText] = useState(prompt?.text || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !text.trim()) return;

    setIsLoading(true);
    try {
      const result = await onSave(name.trim(), text.trim());
      if (result.success) {
        setOpen(false);
        setName('');
        setText('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsLoading(true);
    try {
      const result = await onDelete();
      if (result.success) {
        setOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="bg-gray-800 border-gray-600 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">
            {prompt ? 'Редактировать промпт' : 'Создать публичный промпт'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-200">Название промпта</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="Введите название промпта"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-200">Текст промпта</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white min-h-[120px]"
              placeholder="Введите текст промпта"
            />
          </div>
          <div className="flex gap-2 justify-end">
            {prompt && onDelete && (
              <Button
                onClick={handleDelete}
                disabled={isLoading}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={isLoading || !name.trim() || !text.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
