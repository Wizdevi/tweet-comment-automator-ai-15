
export interface Tweet {
  id: string;
  text: string;
  url: string;
  author: string;
  createdAt: string;
}

export interface GeneratedComment {
  tweetId: string;
  tweetText: string;
  tweetUrl: string;
  comment: string;
  expanded: boolean;
}

export interface ApiKeys {
  apify: string;
  openai: string;
}

export interface TweetExtractorProps {
  apiKeys: ApiKeys;
  addLog: (type: 'info' | 'success' | 'warning' | 'error', message: string, details?: any) => void;
  onExtractSuccess?: () => void;
}

export interface ExtractionSettings {
  extractionType: 'tweets' | 'accounts';
  urls: string;
  tweetsPerAccount: number;
  prompt: string;
  commentsPerTweet: number;
}
