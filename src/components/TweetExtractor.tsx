import { useState } from 'react';
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

    // Force reset state before starting
    setIsExtracting(false);
    console.log('Reset isExtracting to false before starting');
    
    // Use setTimeout to ensure state update is processed
    setTimeout(async () => {
      setIsExtracting(true);
      console.log('Starting tweet extraction, isExtracting set to true');

      try {
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
          description: `Извлечено ${tweets.length} твитов. Раздел генерации комментариев обновлен.`,
        });

        if (onExtractSuccess && tweets.length > 0) {
          setTimeout(() => {
            onExtractSuccess();
          }, 200);
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
        console.log('Tweet extraction finished, setting isExtracting to false');
        setIsExtracting(false);
        
        // Double-check state reset after a short delay
        setTimeout(() => {
          setIsExtracting(false);
          console.log('Double-check: ensured isExtracting is false');
        }, 100);
      }
    }, 10);
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

  console.log('TweetExtractor render - extractedTweets:', extractedTweets.length, 'isExtracting:', isExtracting);

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
