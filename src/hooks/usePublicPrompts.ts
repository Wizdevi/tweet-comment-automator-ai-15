
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { PublicPrompt } from '@/types/tweet';

export const usePublicPrompts = () => {
  const { user } = useAuth();
  const [publicPrompts, setPublicPrompts] = useState<PublicPrompt[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPublicPrompts = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('public_prompts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading public prompts:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить публичные промпты",
          variant: "destructive"
        });
        return;
      }

      setPublicPrompts(data || []);
    } catch (error) {
      console.error('Error loading public prompts:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить публичные промпты",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createPublicPrompt = useCallback(async (name: string, text: string) => {
    if (!user) return { success: false, message: 'Пользователь не авторизован' };

    try {
      const { error } = await supabase
        .from('public_prompts')
        .insert({
          name: name.trim(),
          text: text.trim(),
          created_by: user.id
        });

      if (error) {
        console.error('Error creating public prompt:', error);
        return { success: false, message: 'Ошибка при создании промпта' };
      }

      await loadPublicPrompts();
      return { success: true, message: 'Публичный промпт создан' };
    } catch (error) {
      console.error('Error creating public prompt:', error);
      return { success: false, message: 'Ошибка при создании промпта' };
    }
  }, [user, loadPublicPrompts]);

  const updatePublicPrompt = useCallback(async (id: string, name: string, text: string) => {
    if (!user) return { success: false, message: 'Пользователь не авторизован' };

    try {
      const { error } = await supabase
        .from('public_prompts')
        .update({
          name: name.trim(),
          text: text.trim()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating public prompt:', error);
        return { success: false, message: 'Ошибка при обновлении промпта' };
      }

      await loadPublicPrompts();
      return { success: true, message: 'Промпт обновлен' };
    } catch (error) {
      console.error('Error updating public prompt:', error);
      return { success: false, message: 'Ошибка при обновлении промпта' };
    }
  }, [user, loadPublicPrompts]);

  const deletePublicPrompt = useCallback(async (id: string) => {
    if (!user) return { success: false, message: 'Пользователь не авторизован' };

    try {
      console.log('Attempting to delete prompt with id:', id);
      console.log('Current user id:', user.id);
      
      // Сначала проверяем, что промпт существует и принадлежит пользователю
      const { data: promptToDelete, error: selectError } = await supabase
        .from('public_prompts')
        .select('id, created_by')
        .eq('id', id)
        .single();

      if (selectError) {
        console.error('Error finding prompt to delete:', selectError);
        return { success: false, message: 'Промпт не найден' };
      }

      if (promptToDelete.created_by !== user.id) {
        console.error('User does not own this prompt');
        return { success: false, message: 'У вас нет прав на удаление этого промпта' };
      }

      // Выполняем удаление
      const { error: deleteError } = await supabase
        .from('public_prompts')
        .delete()
        .eq('id', id)
        .eq('created_by', user.id); // Дополнительная проверка безопасности

      if (deleteError) {
        console.error('Error deleting public prompt:', deleteError);
        return { success: false, message: 'Ошибка при удалении промпта: ' + deleteError.message };
      }

      console.log('Prompt deleted successfully, reloading list...');
      
      // Обновляем локальное состояние немедленно
      setPublicPrompts(prev => prev.filter(prompt => prompt.id !== id));
      
      // Также перезагружаем с сервера для синхронизации
      setTimeout(() => {
        loadPublicPrompts();
      }, 100);
      
      return { success: true, message: 'Промпт удален' };
    } catch (error) {
      console.error('Error deleting public prompt:', error);
      return { success: false, message: 'Ошибка при удалении промпта' };
    }
  }, [user, loadPublicPrompts]);

  useEffect(() => {
    loadPublicPrompts();
  }, [loadPublicPrompts]);

  return {
    publicPrompts,
    loading,
    createPublicPrompt,
    updatePublicPrompt,
    deletePublicPrompt,
    loadPublicPrompts
  };
};
