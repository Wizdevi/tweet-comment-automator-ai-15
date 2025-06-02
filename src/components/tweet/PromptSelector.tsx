
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { SavedPrompt, PublicPrompt } from '@/types/tweet';

interface PromptSelectorProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  savedPrompts: SavedPrompt[];
  publicPrompts: PublicPrompt[];
}

export const PromptSelector = ({
  prompt,
  setPrompt,
  savedPrompts,
  publicPrompts
}: PromptSelectorProps) => {
  // Объединяем личные и публичные промпты для отображения
  const allPrompts = [
    ...savedPrompts.map(p => ({ ...p, type: 'personal' as const })),
    ...publicPrompts.map(p => ({ ...p, type: 'public' as const }))
  ];

  return (
    <Select value={prompt} onValueChange={setPrompt}>
      <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 flex-1">
        <SelectValue placeholder="Выберите сохраненный промпт или введите новый" />
      </SelectTrigger>
      <SelectContent>
        {allPrompts.map((promptItem) => (
          <SelectItem key={`${promptItem.type}-${promptItem.id}`} value={promptItem.text}>
            <div className="flex items-center gap-2">
              {promptItem.type === 'public' && <Globe className="w-3 h-3 text-blue-400" />}
              <span>{promptItem.name} - {promptItem.text.slice(0, 50)}...</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
