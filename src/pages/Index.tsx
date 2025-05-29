
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
    setActiveTab('extractor'); // Остаемся на той же вкладке, но скроллим к секции генерации
    // Используем setTimeout для гарантии рендеринга компонента
    setTimeout(() => {
      const commentSection = document.querySelector('[data-section="comments"]');
      if (commentSection) {
        commentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, []);

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
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/lovable-uploads/9f110884-6c4a-426a-922f-7980e411482e.png')`
        }}
      />
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
            Tweet Comment Automator AI
          </h1>
          <p className="text-xl text-cyan-100 max-w-2xl mx-auto drop-shadow-md">
            Автоматизированное извлечение твитов и генерация умных комментариев с помощью ИИ
          </p>
        </div>

        <Card className="max-w-7xl mx-auto bg-black/40 backdrop-blur-xl border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-black/60 backdrop-blur-sm border border-cyan-500/30">
              <TabsTrigger 
                value="extractor" 
                className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/30 text-cyan-200 hover:text-white hover:bg-cyan-700/50 transition-all duration-200 flex items-center gap-2 border border-transparent data-[state=active]:border-cyan-400/50"
              >
                <Twitter className="w-4 h-4" />
                Извлечение твитов
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 text-purple-200 hover:text-white hover:bg-purple-700/50 transition-all duration-200 flex items-center gap-2 border border-transparent data-[state=active]:border-purple-400/50"
              >
                <SettingsIcon className="w-4 h-4" />
                Настройки
              </TabsTrigger>
              <TabsTrigger 
                value="logs" 
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30 text-emerald-200 hover:text-white hover:bg-emerald-700/50 transition-all duration-200 flex items-center gap-2 border border-transparent data-[state=active]:border-emerald-400/50"
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
