import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { TweetExtractorProps } from '@/types/tweet';
import { useTweetExtractor } from '@/hooks/useTweetExtractor';
import { extractTweets, generateComments } from '@/services/tweetApiService';
import { openTweetWithComment, openOriginalTweet, downloadJson } from '@/utils/tweetUtils';
import { ExtractionSettings } from '@/components/tweet/ExtractionSettings';
import { CommentGeneration } from '@/components/tweet/CommentGeneration';
import { TweetResults } from '@/components/tweet/TweetResults';

export const TweetExtractor = ({ apiKeys, addLog, onExtractSuccess }: TweetExtractorProps) => {
  const {
    extractionType,
    setExtractionType,
    urls,
    setUrls,
    tweetsPerAccount,
    setTweetsPerAccount,
    prompt,
    setPrompt,
    commentsPerTweet,
    setCommentsPerTweet,
    isExtracting,
    setIsExtracting,
    isGenerating,
    setIsGenerating,
    extractedTweets,
    setExtractedTweets,
    generatedComments,
    setGeneratedComments,
    savedPrompts,
    savePrompt,
    toggleExpanded
  } = useTweetExtractor();

  // Защита от зависших состояний - автоматический сброс через 10 минут
  useEffect(() => {
    if (isExtracting) {
      const timeoutId = setTimeout(() => {
        console.warn('Force resetting isExtracting after timeout');
        setIsExtracting(false);
        addLog('warning', 'Принудительный сброс состояния извлечения по таймауту', {
          timeout: '10 minutes',
          component: 'TweetExtractor'
        });
        toast({
          title: "Таймаут операции",
          description: "Состояние извлечения сброшено. Попробуйте снова.",
          variant: "destructive"
        });
      }, 600000); // 10 минут

      return () => clearTimeout(timeoutId);
    }
  }, [isExtracting, setIsExtracting, addLog]);

  // Функция полного сброса состояния
  const handleForceReset = () => {
    console.log('Выполнение полного сброса состояния...');
    
    // Сброс всех состояний
    setIsExtracting(false);
    setIsGenerating(false);
    setExtractedTweets([]);
    setGeneratedComments([]);
    
    // Очистка localStorage
    localStorage.removeItem('is_extracting');
    localStorage.removeItem('extracted_tweets');
    localStorage.removeItem('generated_comments');
    
    addLog('info', 'Выполнен полный сброс состояния извлечения', {
      component: 'TweetExtractor',
      action: 'force_reset'
    });
    
    toast({
      title: "Сброс выполнен",
      description: "Состояние извлечения полностью сброшено",
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

    // Принудительно сбрасываем состояние перед началом
    setIsExtracting(false);
    setIsGenerating(false);
    setGeneratedComments([]); // Очищаем предыдущие комментарии
    console.log('Reset state before starting');
    
    // Используем setTimeout для гарантии обработки state update
    setTimeout(async () => {
      try {
        setIsExtracting(true);
        console.log('Starting tweet extraction, isExtracting set to true');

        const tweets = await extractTweets(extractionType, urls, tweetsPerAccount, apiKeys, addLog);
        
        console.log('Tweets extracted successfully:', tweets.length);
        setExtractedTweets(tweets);
        
        addLog('success', `Успешно извлечено ${tweets.length} твитов`, { 
          tweets: tweets.map(t => ({ id: t.id, author: t.author })),
          extractionType,
          urlsProcessed: urls.split('\n').filter(url => url.trim()).length,
          tweetsPerAccount: extractionType === 'accounts' ? tweetsPerAccount : 1
        });

        toast({
          title: "Успех",
          description: `Извлечено ${tweets.length} твитов. Переключение на генерацию комментариев...`,
        });

        // Сначала переключаемся на вкладку извлечения и показываем результаты
        if (onExtractSuccess && tweets.length > 0) {
          onExtractSuccess();
        }

        // Автоматически запускаем генерацию комментариев с задержкой для UX
        if (tweets.length > 0 && apiKeys.openai) {
          addLog('info', 'Подготовка к автогенерации комментариев');
          
          // Небольшая задержка чтобы пользователь увидел извлеченные твиты
          setTimeout(() => {
            console.log('Starting auto-generation of comments');
            handleGenerateCommentsAuto(tweets);
          }, 1500);
        } else if (tweets.length > 0 && !apiKeys.openai) {
          addLog('warning', 'OpenAI API ключ не найден - автогенерация комментариев пропущена');
          toast({
            title: "Внимание",
            description: "OpenAI API ключ не найден. Добавьте ключ в настройках для автогенерации комментариев.",
            variant: "destructive"
          });
        }

      } catch (error) {
        console.error('Error during tweet extraction:', error);
        const errorDetails = {
          errorMessage: error instanceof Error ? error.message : 'Неизвестная ошибка',
          errorName: error instanceof Error ? error.name : 'UnknownError',
          errorStack: error instanceof Error ? error.stack : undefined,
          errorCode: error instanceof Error && error.message.includes('Failed to fetch') ? 'CORS_FETCH_ERROR' : 
                    error instanceof Error && error.message.includes('invalid-input') ? 'INVALID_INPUT_FORMAT' : 'UNKNOWN_ERROR',
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
        // Множественный сброс состояния для гарантии
        console.log('Tweet extraction finished, setting isExtracting to false');
        setIsExtracting(false);
        
        // Дополнительные попытки сброса с интервалами
        setTimeout(() => {
          setIsExtracting(false);
          console.log('Double-check: ensured isExtracting is false');
        }, 100);
        
        setTimeout(() => {
          setIsExtracting(false);
          console.log('Triple-check: final ensure isExtracting is false');
        }, 500);
        
        // Логирование для отладки
        setTimeout(() => {
          console.log('Final state check - isExtracting should be false:', !isExtracting);
        }, 1000);
      }
    }, 10);
  };

  // Автоматическая генерация комментариев
  const handleGenerateCommentsAuto = async (tweets: typeof extractedTweets) => {
    console.log('Starting handleGenerateCommentsAuto with tweets:', tweets.length);
    
    setIsGenerating(true);
    addLog('info', 'Запуск автоматической генерации комментариев', { 
      tweetsCount: tweets.length,
      commentsPerTweet 
    });

    // Показать сообщение о начале генерации
    toast({
      title: "Автогенерация запущена",
      description: `Генерируются комментарии для ${tweets.length} твитов...`,
    });

    try {
      console.log('Calling generateComments...');
      const newComments = await generateComments(tweets, prompt, commentsPerTweet, apiKeys, addLog);
      
      console.log('Generated comments:', newComments.length);
      setGeneratedComments(newComments);
      addLog('success', `Автогенерация завершена: ${newComments.length} комментариев`, { 
        totalComments: newComments.length,
        tweetsProcessed: tweets.length
      });

      toast({
        title: "Автогенерация завершена",
        description: `Автоматически сгенерировано ${newComments.length} комментариев`,
      });

    } catch (error) {
      console.error('Error in auto-generation:', error);
      const errorDetails = {
        errorMessage: error instanceof Error ? error.message : 'Неизвестная ошибка',
        errorName: error instanceof Error ? error.name : 'UnknownError',
        commentsGenerated: generatedComments.length,
        timestamp: new Date().toISOString(),
        autoGeneration: true
      };

      addLog('error', 'Ошибка при автогенерации комментариев', errorDetails);
      toast({
        title: "Ошибка автогенерации",
        description: errorDetails.errorMessage,
        variant: "destructive"
      });
    } finally {
      console.log('Auto-generation finished, setting isGenerating to false');
      setIsGenerating(false);
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

    try {
      const newComments = await generateComments(extractedTweets, prompt, commentsPerTweet, apiKeys, addLog);
      
      setGeneratedComments(newComments);
      addLog('success', `Генерация завершена: ${newComments.length} комментариев`, { 
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
        commentsGenerated: generatedComments.length,
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
    }
  };

  const handleSavePrompt = () => {
    const result = savePrompt();
    toast({
      title: result.success ? "Успех" : "Ошибка",
      description: result.message,
      variant: result.success ? "default" : "destructive"
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопировано",
      description: "Текст скопирован в буфер обмена",
    });
  };

  const handleDownloadJson = () => {
    const extractionSettings = {
      type: extractionType,
      tweetsPerAccount,
      prompt,
      commentsPerTweet
    };
    downloadJson(extractedTweets, generatedComments, extractionSettings, addLog);
  };

  const handleOpenTweetWithComment = (tweetUrl: string, comment: string) => {
    openTweetWithComment(tweetUrl, comment, addLog);
  };

  const handleOpenOriginalTweet = (tweetUrl: string) => {
    openOriginalTweet(tweetUrl, addLog);
  };

  console.log('TweetExtractor render - extractedTweets:', extractedTweets.length, 'isExtracting:', isExtracting, 'isGenerating:', isGenerating);

  return (
    <div className="space-y-6">
      <ExtractionSettings
        extractionType={extractionType}
        setExtractionType={setExtractionType}
        urls={urls}
        setUrls={setUrls}
        tweetsPerAccount={tweetsPerAccount}
        setTweetsPerAccount={setTweetsPerAccount}
        isExtracting={isExtracting}
        hasApiKey={!!apiKeys.apify}
        onExtract={handleExtractTweets}
        onForceReset={handleForceReset}
      />

      <CommentGeneration
        prompt={prompt}
        setPrompt={setPrompt}
        commentsPerTweet={commentsPerTweet}
        setCommentsPerTweet={setCommentsPerTweet}
        savedPrompts={savedPrompts}
        isGenerating={isGenerating}
        hasApiKey={!!apiKeys.openai}
        onGenerate={handleGenerateComments}
        onSavePrompt={handleSavePrompt}
        extractedTweets={extractedTweets}
      />

      <TweetResults
        generatedComments={generatedComments}
        extractedTweets={extractedTweets}
        onDownload={handleDownloadJson}
        onCopyToClipboard={copyToClipboard}
        onOpenTweetWithComment={handleOpenTweetWithComment}
        onOpenOriginalTweet={handleOpenOriginalTweet}
        onToggleExpanded={toggleExpanded}
      />
    </div>
  );
};
