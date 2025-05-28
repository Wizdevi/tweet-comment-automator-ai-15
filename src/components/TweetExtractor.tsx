
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Download, Play, Copy, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TweetExtractorProps {
  apiKeys: { apify: string; openai: string };
  addLog: (type: 'info' | 'success' | 'warning' | 'error', message: string, details?: any) => void;
}

interface Tweet {
  id: string;
  text: string;
  url: string;
  author: string;
  createdAt: string;
}

interface GeneratedComment {
  tweetId: string;
  tweetText: string;
  tweetUrl: string;
  comment: string;
  expanded: boolean;
}

export const TweetExtractor = ({ apiKeys, addLog }: TweetExtractorProps) => {
  const [extractionType, setExtractionType] = useState<'tweets' | 'accounts'>('tweets');
  const [urls, setUrls] = useState('');
  const [tweetsPerAccount, setTweetsPerAccount] = useState(5);
  const [prompt, setPrompt] = useState('Напиши умный и вовлекающий комментарий к этому твиту. Комментарий должен быть на русском языке, максимум 280 символов.');
  const [commentsPerTweet, setCommentsPerTweet] = useState(1);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [extractedTweets, setExtractedTweets] = useState<Tweet[]>([]);
  const [generatedComments, setGeneratedComments] = useState<GeneratedComment[]>([]);

  const handleExtractTweets = async () => {
    if (!apiKeys.apify) {
      toast({
        title: "Ошибка",
        description: "Введите Apify API ключ в настройках",
        variant: "destructive"
      });
      return;
    }

    if (!urls.trim()) {
      toast({
        title: "Ошибка", 
        description: "Введите URL для извлечения",
        variant: "destructive"
      });
      return;
    }

    setIsExtracting(true);
    addLog('info', 'Начало извлечения твитов', { type: extractionType, urls: urls.split('\n').length });

    try {
      const urlList = urls.split('\n').filter(url => url.trim());
      const startUrls = urlList.map(url => ({ url: url.trim() }));

      const requestBody = {
        startUrls,
        searchTerms: [],
        maxTweets: extractionType === 'accounts' ? tweetsPerAccount : 1,
        mode: extractionType === 'accounts' ? 'scrape' : 'post',
      };

      addLog('info', 'Отправка запроса в Apify', requestBody);

      const response = await fetch(`https://api.apify.com/v2/acts/web.harvester~twitter-scraper/run-sync-get-dataset-items?token=${apiKeys.apify}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      addLog('success', 'Данные получены от Apify', { count: data.length });

      const tweets: Tweet[] = data.map((item: any, index: number) => ({
        id: item.id || `tweet-${index}`,
        text: item.text || item.full_text || 'Текст недоступен',
        url: item.url || `https://twitter.com/user/status/${item.id}`,
        author: item.author?.username || item.user?.screen_name || 'Неизвестный автор',
        createdAt: item.created_at || new Date().toISOString(),
      }));

      setExtractedTweets(tweets);
      addLog('success', `Успешно извлечено ${tweets.length} твитов`);

      toast({
        title: "Успех",
        description: `Извлечено ${tweets.length} твитов`,
      });

    } catch (error) {
      addLog('error', 'Ошибка при извлечении твитов', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: "destructive"
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerateComments = async () => {
    if (!apiKeys.openai) {
      toast({
        title: "Ошибка",
        description: "Введите OpenAI API ключ в настройках",
        variant: "destructive"
      });
      return;
    }

    if (extractedTweets.length === 0) {
      toast({
        title: "Ошибка",
        description: "Сначала извлеките твиты",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    addLog('info', 'Начало генерации комментариев', { tweets: extractedTweets.length, commentsPerTweet });

    const newComments: GeneratedComment[] = [];

    try {
      for (const tweet of extractedTweets) {
        for (let i = 0; i < commentsPerTweet; i++) {
          const requestBody = {
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'user',
                content: `${prompt}\n\nТвит: "${tweet.text}"`
              }
            ],
            max_tokens: 280,
            temperature: 0.7
          };

          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKeys.openai}`
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
          }

          const data = await response.json();
          const comment = data.choices[0]?.message?.content || 'Не удалось сгенерировать комментарий';

          newComments.push({
            tweetId: tweet.id,
            tweetText: tweet.text,
            tweetUrl: tweet.url,
            comment,
            expanded: false
          });
        }
      }

      setGeneratedComments(newComments);
      addLog('success', `Сгенерировано ${newComments.length} комментариев`);

      toast({
        title: "Успех",
        description: `Сгенерировано ${newComments.length} комментариев`,
      });

    } catch (error) {
      addLog('error', 'Ошибка при генерации комментариев', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопировано",
      description: "Текст скопирован в буфер обмена",
    });
  };

  const downloadJson = () => {
    const dataToExport = {
      extractedTweets,
      generatedComments,
      extractionSettings: {
        type: extractionType,
        tweetsPerAccount,
        prompt,
        commentsPerTweet
      },
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `tweet_data_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    addLog('info', 'Данные экспортированы', { filename: exportFileDefaultName });
  };

  const toggleExpanded = (index: number) => {
    setGeneratedComments(prev => 
      prev.map((comment, i) => 
        i === index ? { ...comment, expanded: !comment.expanded } : comment
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Extraction Settings */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Настройки извлечения</CardTitle>
          <CardDescription className="text-blue-200">
            Выберите тип извлечения и настройте параметры
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white">Тип извлечения</Label>
            <Select value={extractionType} onValueChange={(value: 'tweets' | 'accounts') => setExtractionType(value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tweets">Отдельные твиты</SelectItem>
                <SelectItem value="accounts">Аккаунты пользователей</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white">URL ссылки (по одной на строку)</Label>
            <Textarea
              placeholder={extractionType === 'tweets' 
                ? "https://twitter.com/username/status/1234567890\nhttps://twitter.com/username/status/0987654321" 
                : "https://twitter.com/username1\nhttps://twitter.com/username2"
              }
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder-white/50 min-h-[100px]"
            />
          </div>

          {extractionType === 'accounts' && (
            <div className="space-y-2">
              <Label className="text-white">Количество твитов с каждого аккаунта</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={tweetsPerAccount}
                onChange={(e) => setTweetsPerAccount(parseInt(e.target.value) || 5)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          )}

          <Button 
            onClick={handleExtractTweets}
            disabled={isExtracting || !apiKeys.apify}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isExtracting ? (
              <>Извлечение...</>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Извлечь твиты
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* AI Comment Generation */}
      {extractedTweets.length > 0 && (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Генерация комментариев</CardTitle>
            <CardDescription className="text-blue-200">
              Настройте параметры генерации комментариев с помощью ИИ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Промпт для генерации комментариев</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-white/50 min-h-[80px]"
                placeholder="Введите инструкции для ИИ..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Количество комментариев на твит</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={commentsPerTweet}
                onChange={(e) => setCommentsPerTweet(parseInt(e.target.value) || 1)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <Button 
              onClick={handleGenerateComments}
              disabled={isGenerating || !apiKeys.openai}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isGenerating ? (
                <>Генерация...</>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Сгенерировать комментарии
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {generatedComments.length > 0 && (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Результаты</CardTitle>
              <CardDescription className="text-blue-200">
                Сгенерированные комментарии к твитам
              </CardDescription>
            </div>
            <Button
              onClick={downloadJson}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Download className="mr-2 h-4 w-4" />
              Скачать JSON
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedComments.map((comment, index) => (
              <Card key={index} className="bg-white/5 border-white/10">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-white/80 text-sm mb-2">
                        {comment.expanded ? comment.tweetText : `${comment.tweetText.slice(0, 100)}${comment.tweetText.length > 100 ? '...' : ''}`}
                      </p>
                      {comment.tweetText.length > 100 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(index)}
                          className="text-blue-400 hover:text-blue-300 p-0 h-auto"
                        >
                          {comment.expanded ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-1" />
                              Свернуть
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-1" />
                              Развернуть
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-white/20" />

                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <p className="text-white font-medium flex-1 mr-4">{comment.comment}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(comment.comment)}
                        className="border-white/20 text-white hover:bg-white/10 flex-shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`${comment.tweetUrl}?text=${encodeURIComponent(comment.comment)}`, '_blank')}
                      className="border-green-500/20 text-green-400 hover:bg-green-500/10 w-full"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Перейти к твиту с комментарием
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Extracted Tweets Summary */}
      {extractedTweets.length > 0 && generatedComments.length === 0 && (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Извлеченные твиты</CardTitle>
            <CardDescription className="text-blue-200">
              Найдено {extractedTweets.length} твитов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {extractedTweets.map((tweet, index) => (
                <div key={tweet.id} className="bg-white/5 rounded p-3">
                  <p className="text-white/80 text-sm mb-1">@{tweet.author}</p>
                  <p className="text-white text-sm">{tweet.text.slice(0, 100)}...</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
