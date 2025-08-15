"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  History, 
  Search, 
  Download, 
  RefreshCw, 
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Package
} from "lucide-react"
import { format, isToday, isYesterday } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import {
  ProcessingHistoryDto,
  ProcessingStatsDto,
  ProcessingErrorDto,
  getProcessingHistory,
  getProcessingStats,
  getRecentErrors,
  getTodayProcessingHistory,
  getWeekProcessingHistory,
  getTodayProcessingStats,
  getWeekProcessingStats,
  formatProcessingTime,
  formatSuccessRate,
  getStatusColor,
  getStatusBadgeVariant
} from "@/lib/history-api"

interface PackageHistoryDashboardProps {
  userId: number
  userName: string
}

export function PackageHistoryDashboard({ userId, userName }: PackageHistoryDashboardProps) {
  const { toast } = useToast()
  
  // State for history data
  const [historyData, setHistoryData] = useState<ProcessingHistoryDto[]>([])
  const [statsData, setStatsData] = useState<ProcessingStatsDto | null>(null)
  const [errorsData, setErrorsData] = useState<ProcessingErrorDto[]>([])
  
  // State for UI
  const [activeTab, setActiveTab] = useState("today")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load data based on active tab
  const loadData = async (tab: string = activeTab, showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      let historyPromise
      let statsPromise

      if (tab === "today") {
        historyPromise = getTodayProcessingHistory(userId)
        statsPromise = getTodayProcessingStats(userId)
      } else {
        historyPromise = getWeekProcessingHistory(userId)
        statsPromise = getWeekProcessingStats(userId)
      }

      const errorsPromise = getRecentErrors(userId, tab === "today" ? 24 : 168)

      const [historyResponse, stats, errors] = await Promise.all([
        historyPromise,
        statsPromise,
        errorsPromise
      ])

      setHistoryData(historyResponse.data)
      setStatsData(stats)
      setErrorsData(errors)
    } catch (error) {
      console.error('Error loading processing history:', error)
      toast({
        variant: "destructive",
        title: "Error al cargar historial",
        description: "No se pudo cargar el historial de procesamiento"
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Load data when component mounts or tab changes
  useEffect(() => {
    loadData(activeTab)
  }, [activeTab, userId])

  // Filter history data based on search term and status
  const filteredHistory = historyData.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ciPaquete.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Export history to CSV
  const exportToCSV = () => {
    const headers = ['Fecha', 'Tracking', 'CI', 'Estado', 'Tiempo (s)', 'Inicio', 'Completado']
    const csvContent = [
      headers.join(','),
      ...filteredHistory.map(item => [
        format(new Date(item.completedAt), 'dd/MM/yyyy', { locale: es }),
        `"${item.trackingNumber}"`,
        `"${item.ciPaquete}"`,
        `"${item.status}"`,
        item.processingTimeSeconds.toString(),
        format(new Date(item.startedAt), 'HH:mm:ss'),
        format(new Date(item.completedAt), 'HH:mm:ss')
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `historial_${activeTab}_${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    
    toast({
      title: "Exportado exitosamente",
      description: "Archivo CSV descargado"
    })
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) {
      return `Hoy ${format(date, 'HH:mm', { locale: es })}`
    } else if (isYesterday(date)) {
      return `Ayer ${format(date, 'HH:mm', { locale: es })}`
    }
    return format(date, 'dd/MM HH:mm', { locale: es })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Historial de Procesamiento</h1>
            <p className="text-muted-foreground">Usuario: {userName}</p>
          </div>
        </div>
        <Button onClick={() => loadData(activeTab, true)} disabled={isRefreshing}>
          <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
          {isRefreshing ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>

      {/* Stats Cards */}
      {statsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Procesados</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData.totalPackagesProcessed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatSuccessRate(statsData.successRate)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatProcessingTime(statsData.averageProcessingTimeSeconds)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo Total</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData.totalProcessingTimeFormatted}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="today">Hoy</TabsTrigger>
          <TabsTrigger value="week">Esta Semana</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar por tracking o CI..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="success">Exitoso</SelectItem>
                    <SelectItem value="failed">Fallido</SelectItem>
                    <SelectItem value="partial">Parcial</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={exportToCSV} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* History Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Historial de Procesamiento ({filteredHistory.length} registros)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay registros de procesamiento para mostrar
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha/Hora</TableHead>
                        <TableHead>Tracking</TableHead>
                        <TableHead>CI</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Tiempo</TableHead>
                        <TableHead>Duración</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {formatDate(item.completedAt)}
                          </TableCell>
                          <TableCell>
                            <code className="bg-muted px-2 py-1 rounded text-sm">
                              {item.trackingNumber}
                            </code>
                          </TableCell>
                          <TableCell>
                            {item.ciPaquete ? (
                              <Badge variant="outline">{item.ciPaquete}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(item.status)}>
                              {item.status === 'success' ? (
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                              ) : item.status === 'failed' ? (
                                <XCircle className="w-3 h-3 mr-1" />
                              ) : (
                                <AlertCircle className="w-3 h-3 mr-1" />
                              )}
                              {item.status === 'success' ? 'Exitoso' : 
                               item.status === 'failed' ? 'Fallido' : 'Parcial'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(item.startedAt), 'HH:mm', { locale: es })} - {format(new Date(item.completedAt), 'HH:mm', { locale: es })}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatProcessingTime(item.processingTimeSeconds)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}