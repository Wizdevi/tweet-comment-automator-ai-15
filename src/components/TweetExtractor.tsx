import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Download, Play, Copy, ExternalLink, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TweetExtractorProps {
  apiKeys: { apify: string; openai: string };
  addLog: (type: 'info' | 'success' | 'warning' | 'error', message: string, details?: any) => void;
  onExtractSuccess?: () => void;
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

export const TweetExtractor = ({ apiKeys, addLog, onExtractSuccess }: TweetExtractorProps) => {
  const [extractionType, setExtractionType] = useState<'tweets' | 'accounts'>('tweets');
  const [urls, setUrls] = useState('');
  const [tweetsPerAccount, setTweetsPerAccount] = useState(5);
  const [prompt, setPrompt] = useState('Напиши умный и вовлекающий комментарий к этому твиту. Комментарий должен быть на русском языке, максимум 280 символов.');
  const [commentsPerTweet, setCommentsPerTweet] = useState(1);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [extractedTweets, setExtractedTweets] = useState<Tweet[]>([]);
  const [generatedComments, setGeneratedComments] = useState<GeneratedComment[]>([]);
  const [savedPrompts, setSavedPrompts] = useState<string[]>([]);

  // Загрузка сохраненных данных при монтировании компонента
  useEffect(() => {
    // Загрузка сохраненных промптов
    const saved = localStorage.getItem('saved_prompts');
    if (saved) {
      try {
        setSavedPrompts(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved prompts:', e);
      }
    }

    // Загрузка сохраненных данных формы
    const savedUrls = localStorage.getItem('extractor_urls');
    if (savedUrls) {
      setUrls(savedUrls);
    }

    const savedExtractionType = localStorage.getItem('extractor_type');
    if (savedExtractionType) {
      setExtractionType(savedExtractionType as 'tweets' | 'accounts');
    }

    const savedTweetsPerAccount = localStorage.getItem('extractor_tweets_per_account');
    if (savedTweetsPerAccount) {
      setTweetsPerAccount(parseInt(savedTweetsPerAccount) || 5);
    }

    const savedPrompt = localStorage.getItem('extractor_prompt');
    if (savedPrompt) {
      setPrompt(savedPrompt);
    }

    const savedCommentsPerTweet = localStorage.getItem('extractor_comments_per_tweet');
    if (savedCommentsPerTweet) {
      setCommentsPerTweet(parseInt(savedCommentsPerTweet) || 1);
    }

    // Загрузка извлеченных твитов
    const savedTweets = localStorage.getItem('extracted_tweets');
    if (savedTweets) {
      try {
        setExtractedTweets(JSON.parse(savedTweets));
      } catch (e) {
        console.error('Failed to load extracted tweets:', e);
      }
    }

    // Загрузка сгенерированных комментариев
    const savedComments = localStorage.getItem('generated_comments');
    if (savedComments) {
      try {
        setGeneratedComments(JSON.parse(savedComments));
      } catch (e) {
        console.error('Failed to load generated comments:', e);
      }
    }
  }, []);

  // Сохранение данных формы при изменении
  useEffect(() => {
    localStorage.setItem('extractor_urls', urls);
  }, [urls]);

  useEffect(() => {
    localStorage.setItem('extractor_type', extractionType);
  }, [extractionType]);

  useEffect(() => {
    localStorage.setItem('extractor_tweets_per_account', tweetsPerAccount.toString());
  }, [tweetsPerAccount]);

  useEffect(() => {
    localStorage.setItem('extractor_prompt', prompt);
  }, [prompt]);

  useEffect(() => {
    localStorage.setItem('extractor_comments_per_tweet', commentsPerTweet.toString());
  }, [commentsPerTweet]);

  useEffect(() => {
    localStorage.setItem('extracted_tweets', JSON.stringify(extractedTweets));
  }, [extractedTweets]);

  useEffect(() => {
    localStorage.setItem('generated_comments', JSON.stringify(generatedComments));
  }, [generatedComments]);

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url.trim());
      return urlObj.hostname === 'twitter.com' || urlObj.hostname === 'x.com';
    } catch (e) {
      return false;
    }
  };

  const normalizeTwitterUrl = (url: string): string => {
    return url.replace('twitter.com', 'x.com');
  };

  const extractHandleFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url.trim());
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
      return pathParts[0] || '';
    } catch (e) {
      return '';
    }
  };

  const openTweetWithComment = (tweetUrl: string, comment: string) => {
    // Извлекаем ID твита из URL
    const tweetId = tweetUrl.split('/').pop()?.split('?')[0];
    
    if (!tweetId) {
      addLog('error', 'Не удалось извлечь ID твита', { tweetUrl });
      return;
    }
    
    // URL для ответа на твит с предзаполненным текстом
    const replyUrl = `https://twitter.com/intent/tweet?in_reply_to=${tweetId}&text=${encodeURIComponent(comment)}`;
    
    window.open(replyUrl, '_blank');
    
    addLog('info', 'Переход к твиту с предзаполненным комментарием', {
      tweetUrl,
      tweetId,
      commentLength: comment.length,
      replyUrl
    });
  };

  const openOriginalTweet = (tweetUrl: string) => {
    window.open(tweetUrl, '_blank');
    
    addLog('info', 'Переход к оригинальному твиту', {
      tweetUrl
    });
  };

  const handleExtractTweets = async () => {
    if (!apiKeys.apify) {
      const errorMsg = 'Apify API ключ не найден';
      toast({
        title: "Ошибка конфигурации",
        description: errorMsg,
        variant: "destructive"
      });
      addLog('error', errorMsg, { 
        errorType: 'MISSING_API_KEY', 
        errorCode: 'APIFY_001',
        component: 'TweetExtractor' 
      });
      return;
    }

    if (!urls.trim()) {
      const errorMsg = 'URL список пуст';
      toast({
        title: "Ошибка валидации", 
        description: "Введите URL для извлечения",
        variant: "destructive"
      });
      addLog('error', errorMsg, { 
        errorType: 'EMPTY_URL_LIST', 
        errorCode: 'VALIDATION_001',
        component: 'TweetExtractor' 
      });
      return;
    }

    setIsExtracting(true);
    const requestId = `extract_${Date.now()}`;
    addLog('info', 'Начало извлечения твитов', { 
      type: extractionType, 
      urlsCount: urls.split('\n').length, 
      requestId,
      timestamp: new Date().toISOString(),
      actor: 'web.harvester~twitter-scraper'
    });

    try {
      const urlList = urls.split('\n').filter(url => url.trim());
      
      // Валидация URL
      const invalidUrls = urlList.filter(url => !validateUrl(url.trim()));
      if (invalidUrls.length > 0) {
        const errorMsg = `Неверные URL найдены: ${invalidUrls.join(', ')}`;
        addLog('error', errorMsg, { 
          errorType: 'INVALID_URLS', 
          errorCode: 'VALIDATION_002',
          invalidUrls, 
          requestId 
        });
        throw new Error(errorMsg);
      }

      const actorId = 'web.harvester~twitter-scraper';
      let requestBody: any;

      if (extractionType === 'accounts') {
        const handles = urlList.map(url => extractHandleFromUrl(normalizeTwitterUrl(url.trim())));
        requestBody = {
          handles: handles,
          tweetsDesired: tweetsPerAccount,
          withReplies: false,
          includeUserInfo: true,
          proxyConfig: {
            useApifyProxy: true,
            apifyProxyGroups: ["RESIDENTIAL"]
          }
        };
      } else {
        const startUrls = urlList.map(url => ({
          url: normalizeTwitterUrl(url.trim())
        }));
        requestBody = {
          startUrls: startUrls,
          tweetsDesired: 1,
          withReplies: false,
          includeUserInfo: true,
          proxyConfig: {
            useApifyProxy: true,
            apifyProxyGroups: ["RESIDENTIAL"]
          }
        };
      }

      addLog('info', 'Отправка запроса в Apify API с исправленным форматом startUrls', { 
        actorId, 
        requestBody, 
        requestId,
        apiEndpoint: `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items`,
        urlFormat: extractionType === 'tweets' ? 'startUrls as objects with url field' : 'handles as strings'
      });

      const apiUrl = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apiKeys.apify}&timeout=300`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      addLog('info', 'Получен ответ от Apify API', { 
        status: response.status, 
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        requestId,
        actor: actorId
      });

      if (!response.ok) {
        let errorDetails: any = {
          httpStatus: response.status,
          httpStatusText: response.statusText,
          requestId,
          apiUrl,
          requestBody,
          errorCode: `HTTP_${response.status}`,
          actor: actorId
        };

        try {
          const errorText = await response.text();
          errorDetails.responseBody = errorText;
          
          try {
            const errorJson = JSON.parse(errorText);
            errorDetails.parsedError = errorJson;
            if (errorJson.error) {
              errorDetails.errorMessage = errorJson.error.message;
              errorDetails.errorType = errorJson.error.type;
              errorDetails.errorCode = errorJson.error.type || `HTTP_${response.status}`;
            }
          } catch (e) {
            errorDetails.rawError = errorText;
          }
        } catch (e) {
          errorDetails.responseReadError = e.message;
        }

        addLog('error', `Apify API вернул ошибку: HTTP ${response.status}`, errorDetails);
        
        const userErrorMsg = errorDetails.errorMessage || 
                           errorDetails.rawError || 
                           `HTTP ${response.status}: ${response.statusText}`;
        
        throw new Error(`Ошибка Apify API: ${userErrorMsg}`);
      }

      const data = await response.json();
      addLog('success', 'Данные успешно получены от Apify', { 
        dataLength: data.length, 
        sampleData: data.slice(0, 2),
        requestId,
        actor: actorId
      });

      const tweets: Tweet[] = data.map((item: any, index: number) => ({
        id: item.id || item.tweetId || item.tweet_id || `tweet-${Date.now()}-${index}`,
        text: item.text || item.full_text || item.tweet_text || item.content || 'Текст недоступен',
        url: item.url || item.tweetUrl || item.tweet_url || `https://x.com/user/status/${item.id || item.tweetId}`,
        author: item.author?.username || item.user?.screen_name || item.username || item.handle || 'Неизвестный автор',
        createdAt: item.created_at || item.createdAt || item.timestamp || new Date().toISOString(),
      }));

      setExtractedTweets(tweets);
      addLog('success', `Успешно извлечено ${tweets.length} твитов`, { 
        tweets: tweets.map(t => ({ id: t.id, author: t.author })),
        requestId,
        actor: actorId,
        inputFormat: 'corrected_startUrls_format'
      });

      toast({
        title: "Успех",
        description: `Извлечено ${tweets.length} твитов. Раздел генерации комментариев доступен ниже.`,
      });

      if (onExtractSuccess && tweets.length > 0) {
        onExtractSuccess();
      }

    } catch (error) {
      const errorDetails = {
        errorMessage: error instanceof Error ? error.message : 'Неизвестная ошибка',
        errorName: error instanceof Error ? error.name : 'UnknownError',
        errorStack: error instanceof Error ? error.stack : undefined,
        errorCode: error instanceof Error && error.message.includes('Failed to fetch') ? 'CORS_FETCH_ERROR' : 
                  error instanceof Error && error.message.includes('invalid-input') ? 'INVALID_INPUT_FORMAT' : 'UNKNOWN_ERROR',
        requestId,
        timestamp: new Date().toISOString(),
        extractionType,
        urlsProvided: urls.split('\n').filter(url => url.trim()).length,
        actor: 'web.harvester~twitter-scraper'
      };

      addLog('error', 'Критическая ошибка при извлечении твитов', errorDetails);
      
      let userMessage = errorDetails.errorMessage;
      if (errorDetails.errorCode === 'CORS_FETCH_ERROR') {
        userMessage = 'Ошибка сетевого запроса. Возможно проблема с CORS или актор временно недоступен.';
      } else if (errorDetails.errorCode === 'INVALID_INPUT_FORMAT') {
        userMessage = 'Ошибка формата входных данных. Проверьте правильность URL.';
      }
      
      toast({
        title: "Ошибка извлечения",
        description: userMessage,
        variant: "destructive"
      });
    } finally {
      setIsExtracting(false);
      addLog('info', 'Завершение процесса извлечения', { requestId, timestamp: new Date().toISOString() });
    }
  };

  const handleGenerateComments = async () => {
    if (!apiKeys.openai) {
      const errorMsg = 'OpenAI API ключ не найден';
      toast({
        title: "Ошибка конфигурации",
        description: errorMsg,
        variant: "destructive"
      });
      addLog('error', errorMsg, { errorType: 'MISSING_OPENAI_KEY', component: 'TweetExtractor' });
      return;
    }

    if (extractedTweets.length === 0) {
      const errorMsg = 'Нет извлеченных твитов для генерации комментариев';
      toast({
        title: "Ошибка состояния",
        description: "Сначала извлеките твиты",
        variant: "destructive"
      });
      addLog('error', errorMsg, { errorType: 'NO_TWEETS', component: 'TweetExtractor' });
      return;
    }

    setIsGenerating(true);
    const generationId = `generate_${Date.now()}`;
    addLog('info', 'Начало генерации комментариев', { 
      tweets: extractedTweets.length, 
      commentsPerTweet,
      generationId,
      totalCommentsToGenerate: extractedTweets.length * commentsPerTweet
    });

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

          addLog('info', `Генерация комментария ${i + 1}/${commentsPerTweet} для твита ${tweet.id}`, {
            tweetId: tweet.id,
            generationId,
            requestBody
          });

          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKeys.openai}`
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            const errorText = await response.text();
            const errorDetails = {
              httpStatus: response.status,
              httpStatusText: response.statusText,
              responseBody: errorText,
              tweetId: tweet.id,
              generationId
            };
            
            addLog('error', `OpenAI API ошибка для твита ${tweet.id}`, errorDetails);
            throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
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

          addLog('success', `Комментарий сгенерирован для твита ${tweet.id}`, {
            tweetId: tweet.id,
            commentLength: comment.length,
            generationId
          });
        }
      }

      setGeneratedComments(newComments);
      addLog('success', `Генерация завершена: ${newComments.length} комментариев`, { 
        generationId,
        totalComments: newComments.length,
        tweetsProcessed: extractedTweets.length
      });

      toast({
        title: "Успех",
        description: `Сгенерировано ${newComments.length} комментариев`,
      });

    } catch (error) {
      const errorDetails = {
        errorMessage: error instanceof Error ? error.message : 'Неизвестная ошибка',
        errorName: error instanceof Error ? error.name : 'UnknownError',
        generationId,
        commentsGenerated: newComments.length,
        timestamp: new Date().toISOString()
      };

      addLog('error', 'Ошибка при генерации комментариев', errorDetails);
      toast({
        title: "Ошибка генерации",
        description: errorDetails.errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      addLog('info', 'Завершение процесса генерации', { generationId, timestamp: new Date().toISOString() });
    }
  };

  const savePrompt = () => {
    if (!prompt.trim()) {
      toast({
        title: "Ошибка",
        description: "Промпт не может быть пустым",
        variant: "destructive"
      });
      return;
    }

    if (savedPrompts.includes(prompt)) {
      toast({
        title: "Информация",
        description: "Такой промпт уже сохранен",
      });
      return;
    }

    const newPrompts = [...savedPrompts, prompt];
    setSavedPrompts(newPrompts);
    localStorage.setItem('saved_prompts', JSON.stringify(newPrompts));
    
    toast({
      title: "Успех",
      description: "Промпт сохранен",
    });
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
      <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-600 shadow-lg">
        <CardHeader className="bg-gray-700/80 border-b border-gray-600">
          <CardTitle className="text-white font-semibold">Параметры извлечения</CardTitle>
          <CardDescription className="text-gray-300">
            Настройте параметры для извлечения данных из Twitter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <Label className="text-gray-200 font-medium">Тип извлечения</Label>
            <Select value={extractionType} onValueChange={(value: 'tweets' | 'accounts') => setExtractionType(value)}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tweets">Отдельные твиты</SelectItem>
                <SelectItem value="accounts">Аккаунты пользователей</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-200 font-medium">URL ссылки (по одной на строку)</Label>
            <Textarea
              placeholder={extractionType === 'tweets' 
                ? "https://x.com/username/status/1234567890\nhttps://x.com/username/status/0987654321" 
                : "https://x.com/username1\nhttps://x.com/username2"
              }
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 min-h-[100px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400">
              Поддерживаются ссылки с twitter.com и x.com
            </p>
          </div>

          {extractionType === 'accounts' && (
            <div className="space-y-2">
              <Label className="text-gray-200 font-medium">Количество твитов с каждого аккаунта</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={tweetsPerAccount}
                onChange={(e) => setTweetsPerAccount(parseInt(e.target.value) || 5)}
                className="bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          <Button 
            onClick={handleExtractTweets}
            disabled={isExtracting || !apiKeys.apify}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isExtracting ? (
              <>Извлечение данных...</>
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
                  onClick={savePrompt}
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
              onClick={handleGenerateComments}
              disabled={isGenerating || !apiKeys.openai}
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
      )}

      {/* Results */}
      {generatedComments.length > 0 && (
        <Card className="bg-gray-800 border-gray-600 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between bg-gray-700 border-b border-gray-600">
            <div>
              <CardTitle className="text-white font-semibold">Результаты работы</CardTitle>
              <CardDescription className="text-gray-300">
                Сгенерированные комментарии готовы к использованию
              </CardDescription>
            </div>
            <Button
              onClick={downloadJson}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Экспорт данных
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {generatedComments.map((comment, index) => (
              <Card key={index} className="bg-gray-700 border-gray-600">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-gray-300 text-sm mb-2">
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openOriginalTweet(comment.tweetUrl)}
                      className="flex-shrink-0 ml-2 border-gray-600 text-gray-300 hover:bg-gray-600"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>

                  <Separator className="bg-gray-600" />

                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <p className="text-white font-medium flex-1 mr-4">{comment.comment}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(comment.comment)}
                        className="flex-shrink-0 border-gray-600 text-gray-300 hover:bg-gray-600"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>

                    <Button
                      onClick={() => openTweetWithComment(comment.tweetUrl, comment.comment)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
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
        <Card className="bg-gray-800 border-gray-600 shadow-md">
          <CardHeader>
            <CardTitle className="text-white font-semibold">Извлеченные твиты</CardTitle>
            <CardDescription className="text-gray-300">
              Найдено {extractedTweets.length} твитов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {extractedTweets.map((tweet, index) => (
                <div key={tweet.id} className="bg-gray-700 rounded p-3 border border-gray-600">
                  <p className="text-gray-300 text-sm mb-1">@{tweet.author}</p>
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
