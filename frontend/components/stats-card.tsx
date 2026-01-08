import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"

interface StatsCardProps {
  label: string
  value: string
  icon: LucideIcon
}

export default function StatsCard({ label, value, icon: Icon }: StatsCardProps) {
  return (
    <Card className="p-4 border border-border bg-card hover:bg-secondary transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </Card>
  )
}
