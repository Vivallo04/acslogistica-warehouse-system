import { useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

// Modern shimmer loading component for metric cards
export const MetricCardShimmer = () => (
  <Card className="relative overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="h-4 w-24 bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse" />
      <div className="h-4 w-4 bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse" />
    </CardHeader>
    <CardContent>
      <div className="h-8 w-20 mb-2 bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse" />
      <div className="h-4 w-32 bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse" />
    </CardContent>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-background/60 to-transparent" />
  </Card>
)

// Modern loading component for charts with pulse and shimmer
export const ChartShimmer = () => {
  const barHeights = useMemo(() => 
    Array.from({ length: 7 }, () => Math.random() * 100 + 50),
    []
  )
  
  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <div className="h-6 w-48 bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full bg-gradient-to-r from-muted via-muted/60 to-muted rounded-lg animate-pulse relative">
          {/* Simulated chart elements */}
          <div className="absolute bottom-4 left-4 right-4 h-48 flex items-end justify-between space-x-2">
            {Array.from({ length: 7 }, (_, i) => (
              <div 
                key={i} 
                className="bg-muted/80 rounded-t animate-pulse" 
                style={{ 
                  height: `${barHeights[i]}px`,
                  animationDelay: `${i * 0.1}s`
                }} 
              />
            ))}
          </div>
        </div>
      </CardContent>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-background/60 to-transparent" />
    </Card>
  )
}

// Modern loading indicator with skeleton bars instead of bouncing dots
export const ModernLoader = () => (
  <div className="flex items-center justify-center space-x-3">
    <div className="flex space-x-1">
      <div className="w-6 h-2 bg-muted rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
      <div className="w-4 h-2 bg-muted/80 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
      <div className="w-5 h-2 bg-muted/60 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
    </div>
    <span className="text-sm font-medium text-muted-foreground animate-pulse">Cargando datos...</span>
  </div>
)

// Table row shimmer for data tables
export const TableRowShimmer = () => (
  <tr className="border-b border-border">
    <td className="px-4 py-3">
      <div className="h-4 w-32 bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse" />
    </td>
    <td className="px-4 py-3">
      <div className="h-4 w-24 bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse" />
    </td>
    <td className="px-4 py-3">
      <div className="h-4 w-16 bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse" />
    </td>
    <td className="px-4 py-3">
      <div className="h-4 w-20 bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse" />
    </td>
  </tr>
)

// Modern minimalist skeleton loading animation (replaced bouncing dots)
export const DotsLoader = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-3 h-1",
    md: "w-4 h-2", 
    lg: "w-6 h-3"
  }
  
  return (
    <div className="flex space-x-1 items-center justify-center">
      <div className={`${sizeClasses[size]} bg-muted rounded-full animate-pulse [animation-delay:0s]`}></div>
      <div className={`${sizeClasses[size]} bg-muted/80 rounded-full animate-pulse [animation-delay:0.2s]`}></div>
      <div className={`${sizeClasses[size]} bg-muted/60 rounded-full animate-pulse [animation-delay:0.4s]`}></div>
    </div>
  )
}

// Modern pulse skeleton loader
export const PulseLoader = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  }
  
  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <div className="absolute inset-0 bg-muted/30 rounded-full animate-ping"></div>
      <div className={`${sizeClasses[size]} bg-muted rounded-full animate-pulse`}></div>
    </div>
  )
}

// Linear progress bar for longer operations
export const ProgressLoader = ({ className = "" }: { className?: string }) => (
  <div className={`w-full h-1 bg-muted rounded-full overflow-hidden ${className}`}>
    <div className="h-full bg-current animate-pulse rounded-full w-1/3"></div>
  </div>
)

// Updated button spinner (now uses pulse skeleton for consistency)
export const ButtonSpinner = ({ size = "sm" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-4 h-2",
    md: "w-5 h-2", 
    lg: "w-6 h-3"
  }
  
  return (
    <div className={`${sizeClasses[size]} bg-muted rounded-full animate-pulse`} />
  )
}

// Page level loading overlay
export const PageLoader = () => (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="text-center">
      <ModernLoader />
      <p className="mt-4 text-sm text-muted-foreground">Cargando página...</p>
    </div>
  </div>
)

// Content skeleton for full page loading
export const ContentSkeleton = ({ sections = 4 }: { sections?: number }) => (
  <div className="space-y-6 animate-fade-in">
    {Array.from({ length: sections }, (_, i) => (
      <Card key={i} className="relative overflow-hidden">
        <CardHeader>
          <div className="h-6 w-48 bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse" />
          <div className="h-4 w-96 bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 w-full bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse" />
          </div>
        </CardContent>
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-background/60 to-transparent" />
      </Card>
    ))}
  </div>
)

// Tracking search skeleton - inline loading for search states  
export const TrackingSearchSkeleton = () => (
  <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-muted/30 text-muted-foreground rounded-full">
    <div className="flex space-x-1">
      <div className="w-1 h-1 bg-muted rounded-full animate-pulse" />
      <div className="w-1 h-1 bg-muted/80 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
      <div className="w-1 h-1 bg-muted/60 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
    </div>
    <span className="animate-pulse">Buscando...</span>
  </div>
)

// Client search skeleton - for dropdown loading states
export const ClientSearchSkeleton = () => (
  <div className="p-3 space-y-2">
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
      <div className="flex-1 space-y-1">
        <div className="w-32 h-3 bg-muted rounded animate-pulse" />
        <div className="w-24 h-2 bg-muted/60 rounded animate-pulse" />
      </div>
    </div>
  </div>
)

// Pagination loading skeleton - replaces spinner
export const PaginationSkeleton = () => (
  <div className="flex items-center space-x-2">
    <div className="w-3 h-3 bg-muted rounded animate-pulse" />
    <div className="w-16 h-3 bg-muted/60 rounded animate-pulse" />
  </div>
)

// Inline search skeleton - subtle loading indicator
export const InlineSearchSkeleton = () => (
  <div className="inline-flex items-center space-x-1">
    <div className="w-2 h-2 bg-muted rounded-full animate-pulse" />
    <div className="w-12 h-2 bg-muted/60 rounded animate-pulse" />
  </div>
)