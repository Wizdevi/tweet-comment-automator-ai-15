
import React from 'react';
import { Tweet } from '@/types/tweet';

interface TweetPreviewProps {
  extractedTweets: Tweet[];
}

export const TweetPreview = ({ extractedTweets }: TweetPreviewProps) => {
  if (extractedTweets.length === 0) {
    return null;
  }

  return (
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
  );
};
