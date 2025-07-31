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

// Modern loading indicator
export const ModernLoader = () => (
  <div className="flex items-center justify-center space-x-2">
    <div className="flex space-x-1">
      <div className="w-3 h-3 bg-accent-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-3 h-3 bg-accent-blue/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-3 h-3 bg-accent-blue/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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

// Modern minimalist dots loading animation
export const DotsLoader = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-1 h-1",
    md: "w-2 h-2", 
    lg: "w-3 h-3"
  }
  
  return (
    <div className="flex space-x-1 items-center justify-center">
      <div className={`${sizeClasses[size]} bg-current rounded-full animate-bounce [animation-delay:-0.3s]`}></div>
      <div className={`${sizeClasses[size]} bg-current rounded-full animate-bounce [animation-delay:-0.15s]`}></div>
      <div className={`${sizeClasses[size]} bg-current rounded-full animate-bounce`}></div>
    </div>
  )
}

// Modern pulse ring loader
export const PulseLoader = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  }
  
  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <div className="absolute inset-0 bg-current rounded-full animate-ping opacity-20"></div>
      <div className={`${sizeClasses[size]} bg-current rounded-full animate-pulse opacity-60`}></div>
    </div>
  )
}

// Linear progress bar for longer operations
export const ProgressLoader = ({ className = "" }: { className?: string }) => (
  <div className={`w-full h-1 bg-muted rounded-full overflow-hidden ${className}`}>
    <div className="h-full bg-current animate-pulse rounded-full w-1/3"></div>
  </div>
)

// Updated button spinner (now uses dots for consistency)
export const ButtonSpinner = ({ size = "sm" }: { size?: "sm" | "md" | "lg" }) => (
  <DotsLoader size={size} />
)

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