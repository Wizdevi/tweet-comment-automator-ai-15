
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TweetExtractor } from '@/components/TweetExtractor';
import { Settings } from '@/components/Settings';
import { Logs } from '@/components/Logs';
import { UserProfile } from '@/components/UserProfile';
import { Twitter, Settings as SettingsIcon, FileText, User as UserIcon, LogIn } from 'lucide-react';

const Index: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { settings, loading: settingsLoading, saveSettings, savePrompt } = useUserSettings();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('extractor');
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
    if (activeTab !== 'extractor') {
      setActiveTab('extractor');
      addLog('info', 'Переключение на вкладку извлечения твитов после успешного извлечения');
    }
    
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
    }, 500);
    
    addLog('info', 'Твиты извлечены - автогенерация комментариев запущена');
  }, [activeTab, addLog]);

  useEffect(() => {
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
    addLog('info', 'Приложение запущено', user ? `Добро пожаловать, ${user.email}` : 'Требуется авторизация');
  }, [addLog, user]);

  const handleSaveApiKeys = useCallback(async (keys: { apify: string; openai: string }) => {
    const result = await saveSettings({
      apify_api_key: keys.apify,
      openai_api_key: keys.openai
    });
    
    addLog(result.success ? 'success' : 'error', result.message, keys);
    return result;
  }, [saveSettings, addLog]);

  const handleSavePrompt = useCallback(async (name: string, text: string) => {
    const result = await savePrompt(name, text);
    addLog(result.success ? 'success' : 'error', result.message);
    return result;
  }, [savePrompt, addLog]);

  const handleClearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem('app_logs');
    addLog('info', 'Логи очищены');
  }, [addLog]);

  // Show loading screen while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
              Tweet Comment Automator AI
            </h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto drop-shadow mb-8">
              Профессиональное решение для автоматизированного извлечения твитов и генерации комментариев
            </p>
            <Card className="max-w-md mx-auto bg-gray-800/90 backdrop-blur-sm border-gray-700 shadow-2xl p-8 text-center">
              <div className="space-y-4">
                <LogIn className="w-16 h-16 text-blue-400 mx-auto" />
                <h2 className="text-2xl font-bold text-white">Требуется авторизация</h2>
                <p className="text-gray-300">
                  Войдите в систему или создайте аккаунт для использования приложения
                </p>
                <Button 
                  onClick={() => navigate('/auth')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Войти / Регистрация
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const apiKeys = {
    apify: settings.apify_api_key,
    openai: settings.openai_api_key
  };

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
            <TabsList className="grid w-full grid-cols-4 mb-8 bg-gray-700/50 border border-gray-600">
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
                value="profile" 
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-300 hover:text-white hover:bg-gray-600 transition-all duration-200 flex items-center gap-2 font-medium"
              >
                <UserIcon className="w-4 h-4" />
                Профиль
              </TabsTrigger>
              <TabsTrigger 
                value="logs" 
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-300 hover:text-white hover:bg-gray-600 transition-all duration-200 flex items-center gap-2 font-medium"
              >
                <FileText className="w-4 h-4" />
                Логи
              </TabsTrigger>
            </TabsList>

            {!settingsLoading && (
              <div className={activeTab === 'extractor' ? 'block' : 'hidden'}>
                <TweetExtractor 
                  apiKeys={apiKeys}
                  addLog={addLog} 
                  onExtractSuccess={handleExtractSuccess}
                  savedPrompts={settings.saved_prompts}
                  onSavePrompt={handleSavePrompt}
                />
              </div>
            )}

            <TabsContent value="settings" className="space-y-6">
              <Settings 
                apiKeys={apiKeys}
                onSaveApiKeys={handleSaveApiKeys} 
                addLog={addLog} 
              />
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <UserProfile />
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
