
import { useState, useEffect, useCallback } from 'react';
import { Tweet, GeneratedComment, ExtractionSettings, SavedPrompt } from '@/types/tweet';

export const useTweetExtractor = () => {
  const [extractionType, setExtractionType] = useState<'tweets' | 'accounts'>('tweets');
  const [urls, setUrls] = useState('');
  const [tweetsPerAccount, setTweetsPerAccount] = useState(5);
  const [prompt, setPrompt] = useState('Напиши умный и вовлекающий комментарий к этому твиту. Используй разговорный стиль общения. Комментарий должен быть на английском языке, не более 280 символов.');
  const [commentsPerTweet, setCommentsPerTweet] = useState(3);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [extractedTweets, setExtractedTweets] = useState<Tweet[]>([]);
  const [generatedComments, setGeneratedComments] = useState<GeneratedComment[]>([]);

  // Load saved data on mount
  useEffect(() => {
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

    // Load user's preferred comments per tweet value, default to 3 if not set
    const savedCommentsPerTweet = localStorage.getItem('extractor_comments_per_tweet');
    const commentsValue = savedCommentsPerTweet ? parseInt(savedCommentsPerTweet) : 3;
    setCommentsPerTweet(Math.max(1, Math.min(20, commentsValue))); // Ensure value is between 1-20

    const savedTweets = localStorage.getItem('extracted_tweets');
    if (savedTweets) {
      try {
        setExtractedTweets(JSON.parse(savedTweets));
      } catch (e) {
        console.error('Failed to load extracted tweets:', e);
      }
    }

    const savedComments = localStorage.getItem('generated_comments');
    if (savedComments) {
      try {
        setGeneratedComments(JSON.parse(savedComments));
      } catch (e) {
        console.error('Failed to load generated comments:', e);
      }
    }

    const savedExtracting = localStorage.getItem('is_extracting');
    if (savedExtracting === 'true') {
      setIsExtracting(true);
      localStorage.removeItem('is_extracting');
    }
  }, []);

  // Save data when state changes
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
    // Save user's preference for comments per tweet
    localStorage.setItem('extractor_comments_per_tweet', commentsPerTweet.toString());
  }, [commentsPerTweet]);

  useEffect(() => {
    localStorage.setItem('extracted_tweets', JSON.stringify(extractedTweets));
  }, [extractedTweets]);

  useEffect(() => {
    localStorage.setItem('generated_comments', JSON.stringify(generatedComments));
  }, [generatedComments]);

  useEffect(() => {
    if (isExtracting) {
      localStorage.setItem('is_extracting', 'true');
    } else {
      localStorage.removeItem('is_extracting');
    }
  }, [isExtracting]);

  const toggleExpanded = useCallback((index: number) => {
    setGeneratedComments(prev => 
      prev.map((comment, i) => 
        i === index ? { ...comment, expanded: !comment.expanded } : comment
      )
    );
  }, []);

  return {
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
    toggleExpanded
  };
};
