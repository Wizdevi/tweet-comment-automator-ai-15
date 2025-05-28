
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Trash2, Download, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

interface LogsProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const Logs = ({ logs, onClearLogs }: LogsProps) => {
  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'info':
        return <Info className="w-4 h-4 text-blue-400" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLogBadgeVariant = (type: LogEntry['type']) => {
    switch (type) {
      case 'info':
        return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
      case 'success':
        return 'bg-green-500/20 text-green-200 border-green-500/30';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-200 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-200 border-gray-500/30';
    }
  };

  const exportLogs = () => {
    const logsData = logs.map(log => ({
      timestamp: log.timestamp.toISOString(),
      type: log.type,
      message: log.message,
      details: log.details
    }));

    const dataStr = JSON.stringify(logsData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `app_logs_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Экспорт завершен",
      description: `Логи экспортированы в файл ${exportFileDefaultName}`,
    });
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDetails = (details: any) => {
    if (!details) return null;
    
    try {
      return JSON.stringify(details, null, 2);
    } catch (e) {
      return String(details);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-green-400" />
              Логи приложения
            </CardTitle>
            <CardDescription className="text-blue-200">
              Подробная информация о всех операциях приложения
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={exportLogs}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
              disabled={logs.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Экспорт
            </Button>
            <Button
              onClick={onClearLogs}
              variant="outline"
              size="sm"
              className="border-red-500/20 text-red-400 hover:bg-red-500/10"
              disabled={logs.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Очистить
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Логи пусты</p>
              <p className="text-sm mt-2">Логи будут появляться при использовании приложения</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {logs.map((log, index) => (
                  <Card key={log.id} className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getLogIcon(log.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={getLogBadgeVariant(log.type)}>
                              {log.type.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-white/60">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                          <p className="text-white text-sm font-medium mb-1">
                            {log.message}
                          </p>
                          {log.details && (
                            <div className="mt-3">
                              <p className="text-xs text-white/60 mb-2">Детали:</p>
                              <pre className="bg-black/20 rounded p-2 text-xs text-white/80 overflow-x-auto">
                                {formatDetails(log.details)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      {logs.length > 0 && (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Статистика логов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['info', 'success', 'warning', 'error'] as const).map(type => {
                const count = logs.filter(log => log.type === type).length;
                const percentage = logs.length > 0 ? Math.round((count / logs.length) * 100) : 0;
                
                return (
                  <div key={type} className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      {getLogIcon(type)}
                    </div>
                    <p className="text-2xl font-bold text-white">{count}</p>
                    <p className="text-xs text-white/60 capitalize">{type}</p>
                    <p className="text-xs text-white/40">{percentage}%</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
