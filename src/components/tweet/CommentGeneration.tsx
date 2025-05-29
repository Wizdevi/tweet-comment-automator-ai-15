
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Save } from 'lucide-react';

interface CommentGenerationProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  commentsPerTweet: number;
  setCommentsPerTweet: (count: number) => void;
  savedPrompts: string[];
  isGenerating: boolean;
  hasApiKey: boolean;
  onGenerate: () => void;
  onSavePrompt: () => void;
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
  onSavePrompt
}: CommentGenerationProps) => {
  return (
    <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-600 shadow-lg" data-section="comments">
      <CardHeader className="bg-gray-700/80 border-b border-gray-600">
        <CardTitle className="text-white font-semibold">Генерация комментариев ИИ</CardTitle>
        <CardDescription className="text-gray-300">
          Настройте параметры для автоматической генерации комментариев
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="space-y-2">
          <Label className="text-gray-200 font-medium">Выбор промпта</Label>
          <Select value={prompt} onValueChange={setPrompt}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
              <SelectValue placeholder="Выберите сохраненный промпт или введите новый" />
            </SelectTrigger>
            <SelectContent>
              {savedPrompts.map((savedPrompt, index) => (
                <SelectItem key={index} value={savedPrompt}>
                  {savedPrompt.slice(0, 50)}...
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-200 font-medium">Промпт для генерации комментариев</Label>
          <div className="flex gap-2">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 min-h-[80px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 flex-1"
              placeholder="Введите инструкции для ИИ..."
            />
            <Button
              onClick={onSavePrompt}
              variant="outline"
              size="sm"
              className="h-fit border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Save className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-200 font-medium">Количество комментариев на твит</Label>
          <Input
            type="number"
            min="1"
            max="5"
            value={commentsPerTweet}
            onChange={(e) => setCommentsPerTweet(parseInt(e.target.value) || 1)}
            className="bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <Button 
          onClick={onGenerate}
          disabled={isGenerating || !hasApiKey}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          {isGenerating ? (
            <>Генерация комментариев...</>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Сгенерировать комментарии
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
