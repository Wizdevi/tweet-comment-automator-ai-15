import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Save, Key, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SettingsProps {
  apiKeys: { apify: string; openai: string };
  onSaveApiKeys: (keys: { apify: string; openai: string }) => Promise<{ success: boolean; message: string }>;
  addLog: (type: 'info' | 'success' | 'warning' | 'error', message: string, details?: any) => void;
}

export const Settings = ({ apiKeys, onSaveApiKeys, addLog }: SettingsProps) => {
  const [localApiKeys, setLocalApiKeys] = useState(apiKeys);
  const [showApifyKey, setShowApifyKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Validate API keys format
      if (localApiKeys.apify && !localApiKeys.apify.startsWith('apify_api_')) {
        throw new Error('Apify API ключ должен начинаться с "apify_api_"');
      }
      
      if (localApiKeys.openai && !localApiKeys.openai.startsWith('sk-')) {
        throw new Error('OpenAI API ключ должен начинаться с "sk-"');
      }

      const result = await onSaveApiKeys(localApiKeys);
      
      toast({
        title: result.success ? "Успех" : "Ошибка",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error) {
      addLog('error', 'Ошибка при сохранении API ключей', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestApifyConnection = async () => {
    if (!localApiKeys.apify) {
      toast({
        title: "Ошибка",
        description: "Введите Apify API ключ",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`https://api.apify.com/v2/acts/web.harvester~twitter-scraper?token=${localApiKeys.apify}`);
      
      if (response.ok) {
        toast({
          title: "Успех",
          description: "Apify API ключ работает корректно",
        });
        addLog('success', 'Apify API подключение протестировано успешно');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удается подключиться к Apify API",
        variant: "destructive"
      });
      addLog('error', 'Ошибка тестирования Apify API', error);
    }
  };

  const handleTestOpenAIConnection = async () => {
    if (!localApiKeys.openai) {
      toast({
        title: "Ошибка",
        description: "Введите OpenAI API ключ",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${localApiKeys.openai}`,
        },
      });
      
      if (response.ok) {
        toast({
          title: "Успех",
          description: "OpenAI API ключ работает корректно",
        });
        addLog('success', 'OpenAI API подключение протестировано успешно');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удается подключиться к OpenAI API",
        variant: "destructive"
      });
      addLog('error', 'Ошибка тестирования OpenAI API', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-purple-400" />
            API Ключи
          </CardTitle>
          <CardDescription className="text-blue-200">
            Настройте API ключи для Apify и OpenAI. Ключи сохраняются в вашем профиле.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Security Notice */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div className="space-y-2">
                <p className="text-yellow-200 font-medium">Важная информация о безопасности</p>
                <p className="text-yellow-100 text-sm">
                  API ключи сохраняются в защищенной базе данных и доступны только вам. 
                  Рекомендуется использовать ключи с ограниченными правами и регулярно их обновлять.
                </p>
              </div>
            </div>
          </div>

          {/* Apify API Key */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apify-key" className="text-white">Apify API Ключ</Label>
              <div className="relative">
                <Input
                  id="apify-key"
                  type={showApifyKey ? "text" : "password"}
                  placeholder="apify_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={localApiKeys.apify}
                  onChange={(e) => setLocalApiKeys(prev => ({ ...prev, apify: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-white/60 hover:text-white hover:bg-transparent"
                  onClick={() => setShowApifyKey(!showApifyKey)}
                >
                  {showApifyKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-white/60">
                Получите API ключ на <a href="https://apify.com/account/integrations" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">apify.com</a>
              </p>
            </div>
            <Button
              onClick={handleTestApifyConnection}
              variant="outline"
              size="sm"
              className="bg-blue-600/20 border-blue-400/40 text-blue-100 hover:bg-blue-500/30 hover:border-blue-300/60 font-medium shadow-md"
              disabled={!localApiKeys.apify}
            >
              Тестировать подключение
            </Button>
          </div>

          <Separator className="bg-white/20" />

          {/* OpenAI API Key */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openai-key" className="text-white">OpenAI API Ключ</Label>
              <div className="relative">
                <Input
                  id="openai-key"
                  type={showOpenAIKey ? "text" : "password"}
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={localApiKeys.openai}
                  onChange={(e) => setLocalApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-white/60 hover:text-white hover:bg-transparent"
                  onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                >
                  {showOpenAIKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-white/60">
                Получите API ключ на <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">platform.openai.com</a>
              </p>
            </div>
            <Button
              onClick={handleTestOpenAIConnection}
              variant="outline"
              size="sm"
              className="bg-green-600/20 border-green-400/40 text-green-100 hover:bg-green-500/30 hover:border-green-300/60 font-medium shadow-md"
              disabled={!localApiKeys.openai}
            >
              Тестировать подключение
            </Button>
          </div>

          <Separator className="bg-white/20" />

          {/* Save Button */}
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-purple-600/90 hover:bg-purple-500 text-white font-medium border border-purple-400/50 shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
          >
            {isSaving ? (
              <>Сохранение...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Сохранить настройки
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Usage Guidelines */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Рекомендации по использованию</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-white/80 text-sm">
          <div>
            <h4 className="font-medium text-white mb-2">Apify API:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Лимит запросов: зависит от вашего тарифного плана</li>
              <li>Рекомендуется использовать аккаунт с платной подпиской для стабильной работы</li>
              <li>Для парсинга аккаунтов может потребоваться больше времени</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">OpenAI API:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Используется модель GPT-4o-mini для оптимального соотношения качества и стоимости</li>
              <li>Лимит токенов на запрос: 280 (длина твита)</li>
              <li>Рекомендуется следить за использованием через OpenAI Dashboard</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
