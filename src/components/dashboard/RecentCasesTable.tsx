import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface Case {
  id: string;
  patientId: string;
  patientName: string;
  pathology: 'breast' | 'cervical';
  status: 'draft' | 'pending' | 'analyzing' | 'validated' | 'archived';
  createdAt: string;
  center: string;
}

interface RecentCasesTableProps {
  cases: Case[];
  showCenter?: boolean;
}

const RecentCasesTable: React.FC<RecentCasesTableProps> = ({ cases, showCenter = false }) => {
  const { t } = useLanguage();

  const getStatusBadge = (status: Case['status']) => {
    const variants: Record<Case['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      draft: { variant: 'secondary', label: t('status.draft') },
      pending: { variant: 'outline', label: t('status.pending') },
      analyzing: { variant: 'default', label: t('status.analyzing') },
      validated: { variant: 'default', label: t('status.validated') },
      archived: { variant: 'secondary', label: t('status.archived') },
    };
    const { variant, label } = variants[status];
    return (
      <Badge 
        variant={variant}
        className={status === 'validated' ? 'bg-success hover:bg-success/90' : ''}
      >
        {label}
      </Badge>
    );
  };

  const getPathologyBadge = (pathology: Case['pathology']) => {
    return (
      <Badge variant="outline" className={pathology === 'breast' ? 'border-accent text-accent' : 'border-primary text-primary'}>
        {pathology === 'breast' ? t('pathology.breast') : t('pathology.cervical')}
      </Badge>
    );
  };

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('table.caseId')}</TableHead>
            <TableHead>{t('table.patient')}</TableHead>
            <TableHead>{t('table.pathology')}</TableHead>
            {showCenter && <TableHead>{t('table.center')}</TableHead>}
            <TableHead>{t('table.status')}</TableHead>
            <TableHead>{t('table.date')}</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.map((caseItem) => (
            <TableRow key={caseItem.id}>
              <TableCell className="font-mono text-sm">{caseItem.id}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{caseItem.patientName}</p>
                  <p className="text-xs text-muted-foreground">{caseItem.patientId}</p>
                </div>
              </TableCell>
              <TableCell>{getPathologyBadge(caseItem.pathology)}</TableCell>
              {showCenter && <TableCell className="text-sm">{caseItem.center}</TableCell>}
              <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{caseItem.createdAt}</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RecentCasesTable;
