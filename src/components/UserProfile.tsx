
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const UserProfile: React.FC = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Успех",
        description: "Вы успешно вышли из системы",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось выйти из системы",
        variant: "destructive"
      });
    }
  };

  if (!user) return null;

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <User className="w-5 h-5 text-blue-400" />
          Профиль пользователя
        </CardTitle>
        <CardDescription className="text-blue-200">
          Информация о текущем пользователе
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-white/60">Email:</p>
          <p className="text-white font-medium">{user.email}</p>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-white/60">Дата регистрации:</p>
          <p className="text-white font-medium">
            {new Date(user.created_at).toLocaleDateString('ru-RU')}
          </p>
        </div>

        <Button 
          onClick={handleSignOut}
          variant="outline"
          className="w-full bg-red-600/20 border-red-400/40 text-red-100 hover:bg-red-500/30 hover:border-red-300/60 font-medium"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Выйти из системы
        </Button>
      </CardContent>
    </Card>
  );
};
