
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Play, Copy, ExternalLink, Loader2, Twitter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TweetExtractorProps {
  apiKeys: { apify: string; openai: string };
  addLog: (type: 'info' | 'success' | 'warning' | 'error', message: string, details?: any) => void;
}

interface ExtractedTweet {
  id: string;
  text: string;
  url: string;
  author: string;
  timestamp: string;
  generatedComment?: string;
}

export const TweetExtractor = ({ apiKeys, addLog }: TweetExtractorProps) => {
  const [extractionType, setExtractionType] = useState<'tweets' | 'accounts'>('tweets');
  const [urls, setUrls] = useState('');
  const [tweetsPerAccount, setTweetsPerAccount] = useState(5);
  const [commentPrompt, setCommentPrompt] = useState('Напиши умный и вдумчивый комментарий к этому твиту. Комментарий должен быть конструктивным и релевантным теме.');
  const [commentsPerTweet, setCommentsPerTweet] = useState(1);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [extractedTweets, setExtractedTweets] = useState<ExtractedTweet[]>([]);

  const validateUrls = (urlList: string[]): { valid: string[]; invalid: string[] } => {
    const valid: string[] = [];
    const invalid: string[] = [];

    urlList.forEach(url => {
      try {
        const urlObj = new URL(url.trim());
        if (urlObj.hostname === 'twitter.com' || urlObj.hostname === 'x.com') {
          // Convert x.com to twitter.com for consistency
          const twitterUrl = url.replace('x.com', 'twitter.com');
          valid.push(twitterUrl);
        } else {
          invalid.push(url);
        }
      } catch (e) {
        invalid.push(url);
      }
    });

    return { valid, invalid };
  };

  const extractTweets = async () => {
    if (!apiKeys.apify) {
      toast({
        title: "Ошибка",
        description: "Необходимо указать Apify API ключ в настройках",
        variant: "destructive"
      });
      return;
    }

    const urlList = urls.split('\n').filter(url => url.trim());
    if (urlList.length === 0) {
      toast({
        title: "Ошибка",
        description: "Введите хотя бы одну ссылку",
        variant: "destructive"
      });
      return;
    }

    const { valid, invalid } = validateUrls(urlList);
    
    if (invalid.length > 0) {
      addLog('warning', 'Найдены невалидные URL', { invalid });
      toast({
        title: "Предупреждение",
        description: `${invalid.length} невалидных URL будут пропущены`,
        variant: "destructive"
      });
    }

    if (valid.length === 0) {
      toast({
        title: "Ошибка",
        description: "Не найдено валидных URL",
        variant: "destructive"
      });
      return;
    }

    setIsExtracting(true);
    addLog('info', 'Начато извлечение твитов', { urls: valid, type: extractionType });

    try {
      const startUrls = valid.map(url => ({ url }));
      
      const requestData = {
        startUrls,
        maxDepth: extractionType === 'accounts' ? tweetsPerAccount : 1,
        cookieJson: "",
        includeSearchResults: false,
        searchTerms: []
      };

      console.log('Apify request data:', requestData);

      const response = await fetch(`https://api.apify.com/v2/acts/web.harvester~twitter-scraper/run-sync-get-dataset-items?token=${apiKeys.apify}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Apify API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Apify response:', data);

      const tweets: ExtractedTweet[] = data.map((item: any, index: number) => ({
        id: item.id || `tweet-${index}`,
        text: item.text || item.full_text || 'Текст твита недоступен',
        url: item.url || valid[index] || '',
        author: item.author || item.screen_name || 'Неизвестный автор',
        timestamp: item.created_at || new Date().toISOString()
      }));

      setExtractedTweets(tweets);
      addLog('success', `Успешно извлечено ${tweets.length} твитов`, tweets);
      
      toast({
        title: "Успех",
        description: `Извлечено ${tweets.length} твитов`,
      });

    } catch (error) {
      console.error('Tweet extraction error:', error);
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

  const generateComments = async () => {
    if (!apiKeys.openai) {
      toast({
        title: "Ошибка",
        description: "Необходимо указать OpenAI API ключ в настройках",
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
    addLog('info', 'Начата генерация комментариев', { tweetsCount: extractedTweets.length, prompt: commentPrompt });

    try {
      const updatedTweets = [];
      
      for (const tweet of extractedTweets) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKeys.openai}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: commentPrompt
              },
              {
                role: 'user',
                content: `Твит от ${tweet.author}: "${tweet.text}"`
              }
            ],
            max_tokens: 280,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        const generatedComment = data.choices[0]?.message?.content || 'Не удалось сгенерировать комментарий';

        updatedTweets.push({
          ...tweet,
          generatedComment
        });
      }

      setExtractedTweets(updatedTweets);
      addLog('success', `Успешно сгенерированы комментарии для ${updatedTweets.length} твитов`, updatedTweets);
      
      toast({
        title: "Успех",
        description: `Сгенерированы комментарии для ${updatedTweets.length} твитов`,
      });

    } catch (error) {
      console.error('Comment generation error:', error);
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

  const downloadJson = () => {
    const dataStr = JSON.stringify(extractedTweets, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `tweets_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    addLog('info', 'JSON файл скачан', { filename: exportFileDefaultName, tweetsCount: extractedTweets.length });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопировано",
      description: "Текст скопирован в буфер обмена",
    });
  };

  const createCommentUrl = (tweetUrl: string, comment: string) => {
    const encodedComment = encodeURIComponent(comment);
    return `${tweetUrl}?text=${encodedComment}`;
  };

  return (
    <div className="space-y-6">
      {/* Extraction Settings */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Twitter className="w-5 h-5 text-blue-400" />
            Настройки извлечения
          </CardTitle>
          <CardDescription className="text-blue-200">
            Настройте параметры для извлечения твитов
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="extraction-type" className="text-white">Тип извлечения</Label>
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

            {extractionType === 'accounts' && (
              <div className="space-y-2">
                <Label htmlFor="tweets-per-account" className="text-white">Количество твитов с каждого аккаунта</Label>
                <Input
                  id="tweets-per-account"
                  type="number"
                  min="1"
                  max="50"
                  value={tweetsPerAccount}
                  onChange={(e) => setTweetsPerAccount(parseInt(e.target.value) || 5)}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="urls" className="text-white">
              {extractionType === 'tweets' ? 'Ссылки на твиты' : 'Ссылки на аккаунты'} (по одной на строку)
            </Label>
            <Textarea
              id="urls"
              placeholder={extractionType === 'tweets' 
                ? "https://twitter.com/username/status/123456789\nhttps://twitter.com/username/status/987654321"
                : "https://twitter.com/username\nhttps://twitter.com/another_user"
              }
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              className="min-h-[120px] bg-white/10 border-white/20 text-white placeholder-white/50"
            />
          </div>

          <Button 
            onClick={extractTweets} 
            disabled={isExtracting || !urls.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isExtracting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Извлечение...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Извлечь твиты
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Comment Generation Settings */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Генерация комментариев</CardTitle>
          <CardDescription className="text-blue-200">
            Настройте параметры для генерации комментариев с помощью ИИ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comment-prompt" className="text-white">Промпт для генерации комментариев</Label>
            <Textarea
              id="comment-prompt"
              value={commentPrompt}
              onChange={(e) => setCommentPrompt(e.target.value)}
              className="min-h-[100px] bg-white/10 border-white/20 text-white placeholder-white/50"
              placeholder="Введите инструкции для ИИ..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments-per-tweet" className="text-white">Количество комментариев на твит</Label>
            <Input
              id="comments-per-tweet"
              type="number"
              min="1"
              max="5"
              value={commentsPerTweet}
              onChange={(e) => setCommentsPerTweet(parseInt(e.target.value) || 1)}
              className="bg-white/10 border-white/20 text-white placeholder-white/50"
            />
          </div>

          <Button 
            onClick={generateComments} 
            disabled={isGenerating || extractedTweets.length === 0}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Генерация...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Сгенерировать комментарии
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {extractedTweets.length > 0 && (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Результаты</CardTitle>
              <CardDescription className="text-blue-200">
                Извлеченные твиты и сгенерированные комментарии
              </CardDescription>
            </div>
            <Button 
              onClick={downloadJson}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Download className="mr-2 h-4 w-4" />
              Скачать JSON
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {extractedTweets.map((tweet, index) => (
              <Card key={tweet.id} className="bg-white/10 border-white/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-200">
                          @{tweet.author}
                        </Badge>
                        <span className="text-xs text-white/60">{new Date(tweet.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-white text-sm leading-relaxed">{tweet.text}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(tweet.url, '_blank')}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>

                  {tweet.generatedComment && (
                    <>
                      <Separator className="bg-white/20" />
                      <div className="space-y-2">
                        <Label className="text-green-400 font-medium">Сгенерированный комментарий:</Label>
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                          <p className="text-white text-sm leading-relaxed">{tweet.generatedComment}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => copyToClipboard(tweet.generatedComment!)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Copy className="mr-2 h-3 w-3" />
                            Копировать
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => window.open(createCommentUrl(tweet.url, tweet.generatedComment!), '_blank')}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <ExternalLink className="mr-2 h-3 w-3" />
                            Комментировать
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
