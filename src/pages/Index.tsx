import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { TweetExtractor } from '@/components/TweetExtractor';
import { Settings } from '@/components/Settings';
import { Logs } from '@/components/Logs';
import { Twitter, Settings as SettingsIcon, FileText } from 'lucide-react';

const Index: React.FC = () => {
  const [activeTab, setActiveTab] = useState('extractor');
  const [apiKeys, setApiKeys] = useState({
    apify: '',
    openai: ''
  });
  const [apiKeysLoaded, setApiKeysLoaded] = useState(false);
  const [logs, setLogs] = useState<Array<{
    id: string;
    timestamp: Date;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    details?: any;
  }>>([]);

  const addLog = useCallback((type: 'info' | 'success' | 'warning' | 'error', message: string, details?: any) => {
    const newLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type,
      message,
      details
    };
    
    setLogs(prevLogs => {
      const updatedLogs = [newLog, ...prevLogs].slice(0, 1000);
      localStorage.setItem('app_logs', JSON.stringify(updatedLogs));
      return updatedLogs;
    });
  }, []);

  const handleExtractSuccess = useCallback(() => {
    // Всегда переключаем на вкладку извлечения твитов после успешного извлечения
    setActiveTab('extractor');
    addLog('info', 'Переключение на вкладку извлечения твитов после успешного извлечения');
    
    // Скроллим к секции комментариев с небольшой задержкой
    setTimeout(() => {
      const commentSection = document.querySelector('[data-section="comments"]');
      if (commentSection) {
        commentSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
        addLog('success', 'Переход к разделу генерации комментариев выполнен');
      }
    }, 500); // Увеличена задержка для лучшего UX
    
    addLog('info', 'Твиты извлечены - автогенерация комментариев начнется автоматически');
  }, [addLog]);

  useEffect(() => {
    // Load saved API keys from localStorage
    const savedApifyKey = localStorage.getItem('apify_api_key');
    const savedOpenAIKey = localStorage.getItem('openai_api_key');
    
    console.log('Loading API keys from localStorage:', { 
      apifyExists: !!savedApifyKey, 
      openaiExists: !!savedOpenAIKey 
    });
    
    setApiKeys({
      apify: savedApifyKey || '',
      openai: savedOpenAIKey || ''
    });
    
    // Mark API keys as loaded
    setApiKeysLoaded(true);

    // Load saved logs
    const savedLogs = localStorage.getItem('app_logs');
    if (savedLogs) {
      try {
        const parsedLogs = JSON.parse(savedLogs).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
        setLogs(parsedLogs);
      } catch (e) {
        console.error('Failed to parse saved logs:', e);
      }
    }

    // Welcome log
    addLog('info', 'Приложение запущено', 'Добро пожаловать в Tweet Comment Automator AI');
  }, [addLog]);

  const saveApiKeys = useCallback((keys: { apify: string; openai: string }) => {
    setApiKeys(keys);
    localStorage.setItem('apify_api_key', keys.apify);
    localStorage.setItem('openai_api_key', keys.openai);
    addLog('success', 'API ключи сохранены', keys);
  }, [addLog]);

  const handleClearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem('app_logs');
    addLog('info', 'Логи очищены');
  }, [addLog]);

  console.log('Index render - apiKeys loaded:', apiKeysLoaded, 'apify key exists:', !!apiKeys.apify);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
            Tweet Comment Automator AI
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto drop-shadow">
            Профессиональное решение для автоматизированного извлечения твитов и генерации комментариев
          </p>
        </div>

        <Card className="max-w-7xl mx-auto bg-gray-800/90 backdrop-blur-sm border-gray-700 shadow-2xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-gray-700/50 border border-gray-600">
              <TabsTrigger 
                value="extractor" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300 hover:text-white hover:bg-gray-600 transition-all duration-200 flex items-center gap-2 font-medium"
              >
                <Twitter className="w-4 h-4" />
                Извлечение твитов
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="data-[state=active]:bg-gray-600 data-[state=active]:text-white text-gray-300 hover:text-white hover:bg-gray-600 transition-all duration-200 flex items-center gap-2 font-medium"
              >
                <SettingsIcon className="w-4 h-4" />
                Настройки
              </TabsTrigger>
              <TabsTrigger 
                value="logs" 
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-300 hover:text-white hover:bg-gray-600 transition-all duration-200 flex items-center gap-2 font-medium"
              >
                <FileText className="w-4 h-4" />
                Логи
              </TabsTrigger>
            </TabsList>

            <TabsContent value="extractor" className="space-y-6">
              {apiKeysLoaded && (
                <TweetExtractor 
                  apiKeys={apiKeys} 
                  addLog={addLog} 
                  onExtractSuccess={handleExtractSuccess}
                />
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Settings 
                apiKeys={apiKeys} 
                onSaveApiKeys={saveApiKeys} 
                addLog={addLog} 
              />
            </TabsContent>

            <TabsContent value="logs" className="space-y-6">
              <Logs logs={logs} onClearLogs={handleClearLogs} />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Index;
