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

  // Добавляем функцию для переключения на вкладку генерации комментариев
  const handleExtractSuccess = useCallback(() => {
    // Принудительно скроллим к секции генерации комментариев
    setTimeout(() => {
      const commentSection = document.querySelector('[data-section="comments"]');
      if (commentSection) {
        commentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        addLog('info', 'Автоматический переход к секции генерации комментариев');
      } else {
        // Если секция не найдена, скроллим к низу страницы
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        addLog('info', 'Скролл к низу страницы для генерации комментариев');
      }
    }, 300);
  }, [addLog]);

  useEffect(() => {
    // Load saved API keys from localStorage
    const savedApifyKey = localStorage.getItem('apify_api_key');
    const savedOpenAIKey = localStorage.getItem('openai_api_key');
    
    if (savedApifyKey || savedOpenAIKey) {
      setApiKeys({
        apify: savedApifyKey || '',
        openai: savedOpenAIKey || ''
      });
    }

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Tweet Comment Automator AI
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Профессиональное решение для автоматизированного извлечения твитов и генерации комментариев
          </p>
        </div>

        <Card className="max-w-7xl mx-auto bg-white border-gray-200 shadow-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-gray-100 border border-gray-300">
              <TabsTrigger 
                value="extractor" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-700 hover:text-gray-900 hover:bg-gray-200 transition-all duration-200 flex items-center gap-2 font-medium"
              >
                <Twitter className="w-4 h-4" />
                Извлечение твитов
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="data-[state=active]:bg-slate-600 data-[state=active]:text-white text-gray-700 hover:text-gray-900 hover:bg-gray-200 transition-all duration-200 flex items-center gap-2 font-medium"
              >
                <SettingsIcon className="w-4 h-4" />
                Настройки
              </TabsTrigger>
              <TabsTrigger 
                value="logs" 
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-700 hover:text-gray-900 hover:bg-gray-200 transition-all duration-200 flex items-center gap-2 font-medium"
              >
                <FileText className="w-4 h-4" />
                Логи
              </TabsTrigger>
            </TabsList>

            <TabsContent value="extractor" className="space-y-6">
              <TweetExtractor 
                apiKeys={apiKeys} 
                addLog={addLog} 
                onExtractSuccess={handleExtractSuccess}
              />
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
