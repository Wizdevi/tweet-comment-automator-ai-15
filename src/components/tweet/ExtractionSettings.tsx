
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Play, RotateCcw } from 'lucide-react';

interface ExtractionSettingsProps {
  extractionType: 'tweets' | 'accounts';
  setExtractionType: (type: 'tweets' | 'accounts') => void;
  urls: string;
  setUrls: (urls: string) => void;
  tweetsPerAccount: number;
  setTweetsPerAccount: (count: number) => void;
  isExtracting: boolean;
  hasApiKey: boolean;
  onExtract: () => void;
  onForceReset?: () => void;
}

export const ExtractionSettings = ({
  extractionType,
  setExtractionType,
  urls,
  setUrls,
  tweetsPerAccount,
  setTweetsPerAccount,
  isExtracting,
  hasApiKey,
  onExtract,
  onForceReset
}: ExtractionSettingsProps) => {
  const handleForceReset = () => {
    if (onForceReset) {
      onForceReset();
    } else {
      // Фallback к перезагрузке страницы если onForceReset не предоставлен
      window.location.reload();
    }
  };

  return (
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
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-gray-200 font-medium">Количество твитов с каждого аккаунта</Label>
              <span className="text-blue-400 font-semibold">{tweetsPerAccount}</span>
            </div>
            <Slider
              value={[tweetsPerAccount]}
              onValueChange={(value) => setTweetsPerAccount(value[0])}
              max={20}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>1</span>
              <span>20</span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={onExtract}
            disabled={isExtracting || !hasApiKey}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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
          
          {isExtracting && (
            <Button 
              onClick={handleForceReset}
              variant="outline"
              className="border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white"
              title="Принудительно сбросить состояние"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {!hasApiKey && (
          <p className="text-xs text-red-400">
            Добавьте Apify API ключ в настройках для активации кнопки
          </p>
        )}
      </CardContent>
    </Card>
  );
};
