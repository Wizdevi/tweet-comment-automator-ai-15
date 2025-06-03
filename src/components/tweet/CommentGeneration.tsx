
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Play, Save } from 'lucide-react';
import { Tweet, SavedPrompt } from '@/types/tweet';
import { usePublicPrompts } from '@/hooks/usePublicPrompts';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { PromptSelector } from './PromptSelector';
import { PromptManagementButtons } from './PromptManagementButtons';
import { TweetPreview } from './TweetPreview';
import { useState } from 'react';
import { PromptManagementDialog } from './PromptManagementDialog';

interface CommentGenerationProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  commentsPerTweet: number;
  setCommentsPerTweet: (count: number) => void;
  savedPrompts: SavedPrompt[];
  isGenerating: boolean;
  hasApiKey: boolean;
  onGenerate: () => void;
  onSavePrompt: () => void;
  extractedTweets: Tweet[];
}

export const CommentGeneration = ({
  prompt,
  setPrompt,
  commentsPerTweet,
  setCommentsPerTweet,
  savedPrompts,
  isGenerating,
  hasApiKey,
  onGenerate,
  onSavePrompt,
  extractedTweets
}: CommentGenerationProps) => {
  const { user } = useAuth();
  const { publicPrompts, createPublicPrompt, updatePublicPrompt, deletePublicPrompt } = usePublicPrompts();

  console.log('CommentGeneration render - extractedTweets:', extractedTweets.length);

  // Находим выбранный промпт
  const selectedPrompt = publicPrompts.find(p => p.text === prompt);

  const handleUpdatePrompt = async (name: string, text: string) => {
    if (!selectedPrompt) return { success: false, message: 'Промпт не найден' };

    const result = await updatePublicPrompt(selectedPrompt.id, name, text);
    toast({
      title: result.success ? "Успех" : "Ошибка",
      description: result.message,
      variant: result.success ? "default" : "destructive"
    });

    if (result.success) {
      setPrompt(text); // Обновляем текущий промпт
    }

    return result;
  };

  const handleDeletePrompt = async () => {
    if (!selectedPrompt) return { success: false, message: 'Промпт не найден' };

    const result = await deletePublicPrompt(selectedPrompt.id);
    toast({
      title: result.success ? "Успех" : "Ошибка",
      description: result.message,
      variant: result.success ? "default" : "destructive"
    });

    if (result.success) {
      setPrompt(''); // Очищаем промпт если он был удален
    }

    return result;
  };

  const handleSaveNewPrompt = async (name: string, text: string) => {
    const result = await createPublicPrompt(name, text);
    toast({
      title: result.success ? "Успех" : "Ошибка",
      description: result.message,
      variant: result.success ? "default" : "destructive"
    });
    return result;
  };

  return (
    <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-600 shadow-lg" data-section="comments">
      <CardHeader className="bg-gray-700/80 border-b border-gray-600">
        <CardTitle className="text-white font-semibold">Генерация комментариев ИИ</CardTitle>
        <CardDescription className="text-gray-300">
          {extractedTweets.length > 0 
            ? `Найдено ${extractedTweets.length} твитов. Настройте параметры для автоматической генерации комментариев.`
            : "Извлеките твиты для генерации комментариев"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <TweetPreview extractedTweets={extractedTweets} />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-gray-200 font-medium">Выбор промпта</Label>
            <PromptManagementButtons
              selectedPrompt={selectedPrompt}
              onUpdatePrompt={handleUpdatePrompt}
              onDeletePrompt={handleDeletePrompt}
            />
          </div>
          <PromptSelector
            prompt={prompt}
            setPrompt={setPrompt}
            publicPrompts={publicPrompts}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-gray-200 font-medium">Промпт для генерации комментариев</Label>
            <PromptManagementDialog
              prompt={{ name: '', text: prompt, id: '', created_at: '', updated_at: '', created_by: '', is_active: true }}
              onSave={handleSaveNewPrompt}
              trigger={
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <Save className="w-4 h-4 mr-2" />
                  Сохранить промпт
                </Button>
              }
            />
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 min-h-[80px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 flex-1"
            placeholder="Введите инструкции для ИИ или выберите из сохраненных промптов..."
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-gray-200 font-medium">Количество комментариев на твит (по умолчанию: 3)</Label>
            <span className="text-blue-400 font-semibold">{commentsPerTweet}</span>
          </div>
          <Slider
            value={[commentsPerTweet]}
            onValueChange={(value) => setCommentsPerTweet(value[0])}
            max={20}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>1</span>
            <span>20</span>
          </div>
        </div>

        <Button 
          onClick={onGenerate}
          disabled={isGenerating || !hasApiKey || extractedTweets.length === 0}
          className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
        >
          {isGenerating ? (
            <>Генерация комментариев...</>
          ) : extractedTweets.length === 0 ? (
            <>Сначала извлеките твиты</>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Сгенерировать комментарии для {extractedTweets.length} твитов
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
