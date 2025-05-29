
export const validateUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url.trim());
    return urlObj.hostname === 'twitter.com' || urlObj.hostname === 'x.com';
  } catch (e) {
    return false;
  }
};

export const normalizeTwitterUrl = (url: string): string => {
  return url.replace('twitter.com', 'x.com');
};

export const extractHandleFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url.trim());
    const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
    return pathParts[0] || '';
  } catch (e) {
    return '';
  }
};

export const openTweetWithComment = (tweetUrl: string, comment: string, addLog: (type: 'info' | 'success' | 'warning' | 'error', message: string, details?: any) => void) => {
  const tweetId = tweetUrl.split('/').pop()?.split('?')[0];
  
  if (!tweetId) {
    addLog('error', 'Не удалось извлечь ID твита', { tweetUrl });
    return;
  }
  
  const replyUrl = `https://twitter.com/intent/tweet?in_reply_to=${tweetId}&text=${encodeURIComponent(comment)}`;
  
  window.open(replyUrl, '_blank');
  
  addLog('info', 'Переход к твиту с предзаполненным комментарием', {
    tweetUrl,
    tweetId,
    commentLength: comment.length,
    replyUrl
  });
};

export const openOriginalTweet = (tweetUrl: string, addLog: (type: 'info' | 'success' | 'warning' | 'error', message: string, details?: any) => void) => {
  window.open(tweetUrl, '_blank');
  
  addLog('info', 'Переход к оригинальному твиту', {
    tweetUrl
  });
};

export const downloadJson = (extractedTweets: any[], generatedComments: any[], extractionSettings: any, addLog: (type: 'info' | 'success' | 'warning' | 'error', message: string, details?: any) => void) => {
  const dataToExport = {
    extractedTweets,
    generatedComments,
    extractionSettings,
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
