import { Tweet, ApiKeys } from '@/types/tweet';
import { validateUrl, normalizeTwitterUrl, extractHandleFromUrl } from '@/utils/tweetUtils';

export const extractTweets = async (
  extractionType: 'tweets' | 'accounts',
  urls: string,
  tweetsPerAccount: number,
  apiKeys: ApiKeys,
  addLog: (type: 'info' | 'success' | 'warning' | 'error', message: string, details?: any) => void
): Promise<Tweet[]> => {
  const requestId = `extract_${Date.now()}`;
  addLog('info', 'Начало извлечения твитов', { 
    type: extractionType, 
    urlsCount: urls.split('\n').length, 
    requestId,
    timestamp: new Date().toISOString(),
    actor: 'web.harvester~twitter-scraper'
  });

  const urlList = urls.split('\n').filter(url => url.trim());
  
  // Validate URLs
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
  let tweets: Tweet[] = [];

  if (extractionType === 'accounts') {
    const handles = urlList.map(url => extractHandleFromUrl(normalizeTwitterUrl(url.trim())));
    
    const requestBody = {
      handles: handles,
      tweetsDesired: tweetsPerAccount,
      withReplies: false,
      includeUserInfo: true,
      addUserInfo: true,
      includeConversation: false,
      proxyConfig: {
        useApifyProxy: true,
        apifyProxyGroups: ["RESIDENTIAL"]
      }
    };

    addLog('info', `Извлечение ${tweetsPerAccount} твитов с каждого из ${handles.length} аккаунтов`, { 
      actorId, 
      requestBody, 
      requestId,
      apiEndpoint: `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items`,
      handles,
      totalExpectedTweets: handles.length * tweetsPerAccount
    });

    const apiUrl = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apiKeys.apify}&timeout=600`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    addLog('info', `Получен ответ от Apify API для ${handles.length} аккаунтов`, { 
      status: response.status, 
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      requestId,
      actor: actorId,
      handles
    });

    if (!response.ok) {
      let errorDetails: any = {
        httpStatus: response.status,
        httpStatusText: response.statusText,
        requestId,
        apiUrl,
        requestBody,
        errorCode: `HTTP_${response.status}`,
        actor: actorId,
        handles
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

      addLog('error', `Apify API вернул ошибку для ${handles.length} аккаунтов: HTTP ${response.status}`, errorDetails);
      
      const userErrorMsg = errorDetails.errorMessage || 
                         errorDetails.rawError || 
                         `HTTP ${response.status}: ${response.statusText}`;
      
      throw new Error(`Ошибка Apify API для ${handles.length} аккаунтов: ${userErrorMsg}`);
    }

    const data = await response.json();
    addLog('success', `Данные успешно получены от Apify для ${handles.length} аккаунтов`, { 
      dataLength: data.length, 
      sampleData: data.slice(0, 2),
      requestId,
      actor: actorId,
      handles,
      expectedTweets: handles.length * tweetsPerAccount,
      actualTweets: data.length
    });

    // Check if data is empty and provide helpful error
    if (!data || data.length === 0) {
      const warningMsg = `Апify актор не смог извлечь твиты для указанных аккаунтов: ${handles.join(', ')}`;
      addLog('warning', warningMsg, {
        handles,
        possibleReasons: [
          'Аккаунты могут быть приватными',
          'Аккаунты могут не существовать',
          'Временные проблемы с Twitter API',
          'Аккаунты могут не иметь недавних твитов'
        ],
        suggestions: [
          'Проверьте правильность имен аккаунтов',
          'Убедитесь что аккаунты публичные',
          'Попробуйте другие аккаунты'
        ]
      });
      
      // Return empty array instead of throwing error
      return [];
    }

    tweets = data.map((item: any, index: number) => ({
      id: item.id || item.tweetId || item.tweet_id || `tweet-${Date.now()}-${index}`,
      text: item.text || item.full_text || item.tweet_text || item.content || 'Текст недоступен',
      url: item.url || item.tweetUrl || item.tweet_url || `https://x.com/user/status/${item.id || item.tweetId}`,
      author: item.author?.username || item.user?.screen_name || item.username || item.handle || 'Неизвестный автор',
      createdAt: item.created_at || item.createdAt || item.timestamp || new Date().toISOString(),
    }));

    addLog('info', `Обработано ${tweets.length} твитов из ${handles.length} аккаунтов`, {
      handles,
      tweetsCount: tweets.length,
      tweetsPerAccountRequested: tweetsPerAccount,
      actualTweetsPerAccount: tweets.length / handles.length
    });
  } else {
    const startUrls = urlList.map(url => ({
      url: normalizeTwitterUrl(url.trim())
    }));
    const requestBody = {
      startUrls: startUrls,
      tweetsDesired: 1,
      withReplies: false,
      includeUserInfo: true,
      addUserInfo: true,
      includeConversation: false,
      proxyConfig: {
        useApifyProxy: true,
        apifyProxyGroups: ["RESIDENTIAL"]
      }
    };

    addLog('info', 'Отправка запроса в Apify API для извлечения отдельных твитов', { 
      actorId, 
      requestBody, 
      requestId,
      apiEndpoint: `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items`,
      urlFormat: 'startUrls as objects with url field'
    });

    const apiUrl = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apiKeys.apify}&timeout=600`;
    
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

    // Check if data is empty and provide helpful error
    if (!data || data.length === 0) {
      const warningMsg = 'Апify актор не смог извлечь указанные твиты';
      addLog('warning', warningMsg, {
        urls: startUrls,
        possibleReasons: [
          'Твиты могут быть удалены',
          'Твиты могут быть из приватных аккаунтов',
          'Неверные URL твитов',
          'Временные проблемы с Twitter API'
        ],
        suggestions: [
          'Проверьте правильность URL твитов',
          'Убедитесь что твиты существуют и публичные',
          'Попробуйте другие твиты'
        ]
      });
      
      // Return empty array instead of throwing error
      return [];
    }

    tweets = data.map((item: any, index: number) => ({
      id: item.id || item.tweetId || item.tweet_id || `tweet-${Date.now()}-${index}`,
      text: item.text || item.full_text || item.tweet_text || item.content || 'Текст недоступен',
      url: item.url || item.tweetUrl || item.tweet_url || `https://x.com/user/status/${item.id || item.tweetId}`,
      author: item.author?.username || item.user?.screen_name || item.username || item.handle || 'Неизвестный автор',
      createdAt: item.created_at || item.createdAt || item.timestamp || new Date().toISOString(),
    }));
  }

  return tweets;
};

export const generateComments = async (
  extractedTweets: Tweet[],
  prompt: string,
  commentsPerTweet: number,
  apiKeys: ApiKeys,
  addLog: (type: 'info' | 'success' | 'warning' | 'error', message: string, details?: any) => void
): Promise<any[]> => {
  const generationId = `generate_${Date.now()}`;
  addLog('info', 'Начало генерации комментариев', { 
    tweets: extractedTweets.length, 
    commentsPerTweet,
    generationId,
    totalCommentsToGenerate: extractedTweets.length * commentsPerTweet
  });

  const newComments: any[] = [];

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

  return newComments;
};
