import React from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExportButtonProps {
  onExport: () => void;
  isLoading?: boolean;
  label?: string;
}

export const ExportButton = ({ onExport, isLoading, label }: ExportButtonProps) => {
  const { t } = useLanguage();

  return (
    <Button
      variant="outline"
      onClick={onExport}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {label || t('export_excel')}
    </Button>
  );
};
