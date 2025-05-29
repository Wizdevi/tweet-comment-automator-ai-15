
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download, Copy, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { GeneratedComment, Tweet } from '@/types/tweet';

interface TweetResultsProps {
  generatedComments: GeneratedComment[];
  extractedTweets: Tweet[];
  onDownload: () => void;
  onCopyToClipboard: (text: string) => void;
  onOpenTweetWithComment: (tweetUrl: string, comment: string) => void;
  onOpenOriginalTweet: (tweetUrl: string) => void;
  onToggleExpanded: (index: number) => void;
}

export const TweetResults = ({
  generatedComments,
  extractedTweets,
  onDownload,
  onCopyToClipboard,
  onOpenTweetWithComment,
  onOpenOriginalTweet,
  onToggleExpanded
}: TweetResultsProps) => {
  if (generatedComments.length > 0) {
    return (
      <Card className="bg-gray-800 border-gray-600 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between bg-gray-700 border-b border-gray-600">
          <div>
            <CardTitle className="text-white font-semibold">Результаты работы</CardTitle>
            <CardDescription className="text-gray-300">
              Сгенерированные комментарии готовы к использованию
            </CardDescription>
          </div>
          <Button
            onClick={onDownload}
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
                        onClick={() => onToggleExpanded(index)}
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
                    onClick={() => onOpenOriginalTweet(comment.tweetUrl)}
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
                      onClick={() => onCopyToClipboard(comment.comment)}
                      className="flex-shrink-0 border-gray-600 text-gray-300 hover:bg-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button
                    onClick={() => onOpenTweetWithComment(comment.tweetUrl, comment.comment)}
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
    );
  }

  if (extractedTweets.length > 0) {
    return (
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
    );
  }

  return null;
};
