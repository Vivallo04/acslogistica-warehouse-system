"use client"

import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, BarChart3, History, Settings2 } from "lucide-react"

interface ComingSoonBannerProps {
  title: string
  description: string
  feature: 'campaigns' | 'analytics' | 'history' | 'settings'
}

const iconMap = {
  campaigns: MessageSquare,
  analytics: BarChart3,
  history: History,
  settings: Settings2
}

export default function ComingSoonBanner({ title, description, feature }: ComingSoonBannerProps) {
  const Icon = iconMap[feature]
  
  return (
    <div className="p-6 flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center py-12">
          <Icon className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{title}</h2>
          <p className="text-muted-foreground">
            {description}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}