
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { PublicPrompt } from '@/types/tweet';

interface PromptSelectorProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  publicPrompts: PublicPrompt[];
}

export const PromptSelector = ({
  prompt,
  setPrompt,
  publicPrompts
}: PromptSelectorProps) => {
  return (
    <Select value={prompt} onValueChange={setPrompt}>
      <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 flex-1">
        <SelectValue placeholder="Выберите сохраненный промпт или введите новый" />
      </SelectTrigger>
      <SelectContent>
        {publicPrompts.map((promptItem) => (
          <SelectItem key={promptItem.id} value={promptItem.text}>
            <div className="flex items-center gap-2">
              <Globe className="w-3 h-3 text-blue-400" />
              <span>{promptItem.name} - {promptItem.text.slice(0, 50)}...</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
