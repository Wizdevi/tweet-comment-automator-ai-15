
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface SavedPrompt {
  id: string;
  name: string;
  text: string;
  createdAt: string;
}

interface UserSettings {
  apify_api_key: string;
  openai_api_key: string;
  saved_prompts: SavedPrompt[];
}

const defaultSettings: UserSettings = {
  apify_api_key: '',
  openai_api_key: '',
  saved_prompts: []
};

export const useUserSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    if (!user) {
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        let savedPrompts: SavedPrompt[] = [];
        if (data.saved_prompts && Array.isArray(data.saved_prompts)) {
          savedPrompts = data.saved_prompts.map((prompt: any) => ({
            id: prompt.id || '',
            name: prompt.name || '',
            text: prompt.text || '',
            createdAt: prompt.createdAt || new Date().toISOString()
          }));
        }

        setSettings({
          apify_api_key: data.apify_api_key || '',
          openai_api_key: data.openai_api_key || '',
          saved_prompts: savedPrompts
        });
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить настройки пользователя",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const saveSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    if (!user) return { success: false, message: 'Пользователь не авторизован' };

    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const savedPromptsJson = updatedSettings.saved_prompts.map(prompt => ({
        id: prompt.id,
        name: prompt.name,
        text: prompt.text,
        createdAt: prompt.createdAt
      }));
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          apify_api_key: updatedSettings.apify_api_key,
          openai_api_key: updatedSettings.openai_api_key,
          saved_prompts: savedPromptsJson as any,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving user settings:', error);
        return { success: false, message: 'Ошибка при сохранении настроек' };
      }

      setSettings(updatedSettings);
      return { success: true, message: 'Настройки сохранены' };
    } catch (error) {
      console.error('Error saving user settings:', error);
      return { success: false, message: 'Ошибка при сохранении настроек' };
    }
  }, [user, settings]);

  const savePrompt = useCallback(async (name: string, text: string) => {
    if (!text.trim()) {
      return { success: false, message: 'Промпт не может быть пустым' };
    }

    if (!name.trim()) {
      return { success: false, message: 'Название промпта не может быть пустым' };
    }

    const existingPrompt = settings.saved_prompts.find(p => p.name === name.trim());
    if (existingPrompt) {
      return { success: false, message: 'Промпт с таким названием уже существует' };
    }

    const newPrompt: SavedPrompt = {
      id: crypto.randomUUID(),
      name: name.trim(),
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedPrompts = [...settings.saved_prompts, newPrompt];
    const result = await saveSettings({ saved_prompts: updatedPrompts });
    
    if (result.success) {
      // Перезагружаем настройки из базы данных для синхронизации
      await loadSettings();
      return { success: true, message: 'Промпт сохранен' };
    }
    
    return result;
  }, [settings.saved_prompts, saveSettings, loadSettings]);

  const deletePrompt = useCallback(async (promptId: string) => {
    const updatedPrompts = settings.saved_prompts.filter(p => p.id !== promptId);
    const result = await saveSettings({ saved_prompts: updatedPrompts });
    
    if (result.success) {
      await loadSettings();
      return { success: true, message: 'Промпт удален' };
    }
    
    return result;
  }, [settings.saved_prompts, saveSettings, loadSettings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    saveSettings,
    savePrompt,
    deletePrompt,
    loadSettings
  };
};
