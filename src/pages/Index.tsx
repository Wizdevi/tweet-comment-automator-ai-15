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

  const handleExtractSuccess = useCallback(() => {
    addLog('info', 'Твиты извлечены - раздел генерации комментариев доступен');
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Technology network background */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(37, 99, 235, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 40% 60%, rgba(29, 78, 216, 0.1) 0%, transparent 50%)
          `
        }}
      >
        {/* Network pattern overlay */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <pattern id="network" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <g stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none">
                  <circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.6)"/>
                  <circle cx="80" cy="20" r="2" fill="rgba(255,255,255,0.6)"/>
                  <circle cx="50" cy="60" r="2" fill="rgba(255,255,255,0.6)"/>
                  <circle cx="20" cy="80" r="2" fill="rgba(255,255,255,0.6)"/>
                  <circle cx="80" cy="80" r="2" fill="rgba(255,255,255,0.6)"/>
                  <line x1="20" y1="20" x2="80" y2="20"/>
                  <line x1="20" y1="20" x2="50" y2="60"/>
                  <line x1="80" y1="20" x2="50" y2="60"/>
                  <line x1="50" y1="60" x2="20" y2="80"/>
                  <line x1="50" y1="60" x2="80" y2="80"/>
                  <line x1="20" y1="80" x2="80" y2="80"/>
                </g>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#network)"/>
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
            Tweet Comment Automator AI
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto drop-shadow">
            Профессиональное решение для автоматизированного извлечения твитов и генерации комментариев
          </p>
        </div>

        <Card className="max-w-7xl mx-auto bg-white/95 backdrop-blur-sm border-slate-200 shadow-2xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-100 border border-slate-300">
              <TabsTrigger 
                value="extractor" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-all duration-200 flex items-center gap-2 font-medium"
              >
                <Twitter className="w-4 h-4" />
                Извлечение твитов
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-all duration-200 flex items-center gap-2 font-medium"
              >
                <SettingsIcon className="w-4 h-4" />
                Настройки
              </TabsTrigger>
              <TabsTrigger 
                value="logs" 
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-all duration-200 flex items-center gap-2 font-medium"
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
