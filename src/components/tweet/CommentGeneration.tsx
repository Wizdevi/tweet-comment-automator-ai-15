
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Play, Save } from 'lucide-react';
import { Tweet } from '@/types/tweet';

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
  console.log('CommentGeneration render - extractedTweets:', extractedTweets.length);

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
        {extractedTweets.length > 0 && (
          <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-300 mb-2">Извлеченные твиты:</p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {extractedTweets.slice(0, 5).map((tweet, index) => (
                <div key={tweet.id} className="text-xs text-gray-400 bg-gray-800/50 rounded p-2">
                  <span className="font-semibold">@{tweet.author}:</span> {tweet.text.slice(0, 60)}...
                </div>
              ))}
              {extractedTweets.length > 5 && (
                <p className="text-xs text-gray-500">И еще {extractedTweets.length - 5} твитов...</p>
              )}
            </div>
          </div>
        )}

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
