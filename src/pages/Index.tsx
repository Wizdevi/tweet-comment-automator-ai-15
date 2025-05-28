
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { TweetExtractor } from '@/components/TweetExtractor';
import { Settings } from '@/components/Settings';
import { Logs } from '@/components/Logs';
import { Twitter, Settings as SettingsIcon, FileText } from 'lucide-react';

const Index = () => {
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

  const addLog = (type: 'info' | 'success' | 'warning' | 'error', message: string, details?: any) => {
    const newLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type,
      message,
      details
    };
    
    setLogs(prevLogs => {
      const updatedLogs = [newLog, ...prevLogs].slice(0, 1000); // Keep last 1000 logs
      localStorage.setItem('app_logs', JSON.stringify(updatedLogs));
      return updatedLogs;
    });
  };

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
  }, []);

  const saveApiKeys = (keys: { apify: string; openai: string }) => {
    setApiKeys(keys);
    localStorage.setItem('apify_api_key', keys.apify);
    localStorage.setItem('openai_api_key', keys.openai);
    addLog('success', 'API ключи сохранены', keys);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Tweet Comment Automator AI
          </h1>
          <p className="text-xl text-blue-200 max-w-2xl mx-auto">
            Автоматизированное извлечение твитов и генерация умных комментариев с помощью ИИ
          </p>
        </div>

        <Card className="max-w-7xl mx-auto bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-black/20 backdrop-blur-sm">
              <TabsTrigger 
                value="extractor" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-blue-200 hover:text-white transition-all duration-200 flex items-center gap-2"
              >
                <Twitter className="w-4 h-4" />
                Извлечение твитов
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-200 hover:text-white transition-all duration-200 flex items-center gap-2"
              >
                <SettingsIcon className="w-4 h-4" />
                Настройки
              </TabsTrigger>
              <TabsTrigger 
                value="logs" 
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-green-200 hover:text-white transition-all duration-200 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Логи
              </TabsTrigger>
            </TabsList>

            <TabsContent value="extractor" className="space-y-6">
              <TweetExtractor apiKeys={apiKeys} addLog={addLog} />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Settings 
                apiKeys={apiKeys} 
                onSaveApiKeys={saveApiKeys} 
                addLog={addLog} 
              />
            </TabsContent>

            <TabsContent value="logs" className="space-y-6">
              <Logs logs={logs} onClearLogs={() => {
                setLogs([]);
                localStorage.removeItem('app_logs');
                addLog('info', 'Логи очищены');
              }} />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Index;
