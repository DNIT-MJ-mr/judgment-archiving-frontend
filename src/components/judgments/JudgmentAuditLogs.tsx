
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Clock, User } from 'lucide-react'
import { auditLogsApi } from '@/api'
import { formatDateTime } from '@/lib/utils'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

interface JudgmentAuditLogsProps {
    judgmentId: number
}

export function JudgmentAuditLogs({ judgmentId }: JudgmentAuditLogsProps) {
    const { t } = useTranslation(['common', 'admin'])

    const { data, isLoading } = useQuery({
        queryKey: ['audit-logs', 'judgment', judgmentId],
        queryFn: () =>
            auditLogsApi.list({
                entity_type: 'judgment',
                entity_id: judgmentId,
                page_size: 50, // Fetch recent logs
            }),
    })

    if (isLoading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <LoadingSpinner />
            </div>
        )
    }

    const logs = data?.items || []

    if (logs.length === 0) {
        return null
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5" />
                    {t('admin:auditLogs')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('date')}</TableHead>
                                <TableHead>{t('user')}</TableHead>
                                <TableHead>{t('action')}</TableHead>
                                <TableHead>{t('details')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="whitespace-nowrap">
                                        {formatDateTime(log.created_at)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span>{log.username || t('system')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {log.action}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {/* Render specific details if needed */}
                                        {JSON.stringify(log.after || log.before || {})}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
