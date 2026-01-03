"use client"

import { useState, useEffect } from "react"
import KanbanColumn from "@/components/kanban-column"
import OpportunityDetailsModal from "@/components/opportunity-details-modal"
import TeamRecommendationModal from "@/components/team-recommendation-modal"
import { Skeleton } from "@/components/ui/skeleton"
import { getOpportunities, updateOpportunityStatus, type Opportunity } from "@/services/opportunities"
import { toast } from "sonner"

export default function KanbanBoard({ filters }: { filters?: any }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null)
  const [recommendationModalOpen, setRecommendationModalOpen] = useState(false)
  const [opportunityToAssign, setOpportunityToAssign] = useState<Opportunity | null>(null)

  // Cargar oportunidades desde Supabase
  useEffect(() => {
    async function loadOpportunities() {
      try {
        setIsLoading(true)
        const data = await getOpportunities()
        setOpportunities(data)
      } catch (error) {
        console.error('Error loading opportunities:', error)
        toast.error('Failed to load opportunities. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    loadOpportunities()
  }, [])

  // Escuchar eventos de nuevas oportunidades
  useEffect(() => {
    const handleAddOpportunity = (event: Event) => {
      const customEvent = event as CustomEvent
      setOpportunities((prev) => [...prev, customEvent.detail])
    }

    const handleFinishProcessing = (event: Event) => {
      const customEvent = event as CustomEvent
      const opportunityId = customEvent.detail.opportunityId
      setOpportunities((prev) => prev.map((opp) => (opp.id === opportunityId ? { ...opp, isProcessing: false } : opp)))
    }

    window.addEventListener("addOpportunity", handleAddOpportunity)
    window.addEventListener("finishProcessing", handleFinishProcessing)

    return () => {
      window.removeEventListener("addOpportunity", handleAddOpportunity)
      window.removeEventListener("finishProcessing", handleFinishProcessing)
    }
  }, [])

  const filteredOpportunities = opportunities.filter((opp) => {
    if (filters?.urgency && filters.urgency !== "" && opp.urgency !== filters.urgency) return false

    if (filters?.skill && filters.skill !== "") {
      const skills = Array.isArray(opp.requiredSkill) ? opp.requiredSkill : [opp.requiredSkill]
      if (!skills.includes(filters.skill)) return false
    }

    if (filters?.assignedTeam && filters.assignedTeam !== "" && opp.assignee !== filters.assignedTeam) return false
    return true
  })

  const columns = [
    { status: "new" as const, title: "New" },
    { status: "assigned" as const, title: "Assigned" },
    { status: "done" as const, title: "Done" },
  ]

  // Función centralizada para actualizar el estado de una oportunidad
  const handleUpdateStatus = async (id: string, newStatus: "new" | "assigned" | "done") => {
    // Actualización optimista: actualizar UI inmediatamente
    const previousOpportunities = [...opportunities]
    setOpportunities((prev) =>
      prev.map((opp) => (opp.id === id ? { ...opp, status: newStatus } : opp))
    )
    setUpdatingIds((prev) => new Set(prev).add(id))

    try {
      // Llamar a la API para persistir el cambio
      const updatedOpportunity = await updateOpportunityStatus(id, newStatus)
      
      if (updatedOpportunity) {
        // Actualizar con los datos reales de la DB
        setOpportunities((prev) =>
          prev.map((opp) => (opp.id === id ? updatedOpportunity : opp))
        )
        toast.success(`Opportunity moved to ${newStatus}`)
      } else {
        throw new Error('Failed to update opportunity')
      }
    } catch (error) {
      // Revertir cambio en caso de error
      setOpportunities(previousOpportunities)
      toast.error('Failed to update opportunity status. Please try again.')
      console.error('Error updating opportunity status:', error)
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleAssignClick = (opportunity: Opportunity) => {
    setOpportunityToAssign(opportunity)
    setRecommendationModalOpen(true)
  }

  const handleAssignTeamMember = async (teamMember: string) => {
    if (opportunityToAssign) {
      // Actualizar estado a "assigned" cuando se asigna un miembro del equipo
      await handleUpdateStatus(opportunityToAssign.id, "assigned")
      
      // También actualizar el assignee localmente (esto debería venir de la DB en el futuro)
      setOpportunities((prev) =>
        prev.map((opp) =>
          opp.id === opportunityToAssign.id
            ? { ...opp, assignee: teamMember, status: "assigned" }
            : opp
        )
      )
      setRecommendationModalOpen(false)
      setOpportunityToAssign(null)
    }
  }

  const handleMoveToComplete = async (opportunityId: string) => {
    await handleUpdateStatus(opportunityId, "done")
  }

  const handleSaveEdits = (updates: Partial<Opportunity>) => {
    if (selectedOpportunity) {
      const updatedOpportunity = { ...selectedOpportunity, ...updates }
      setOpportunities((prev) => prev.map((opp) => (opp.id === selectedOpportunity.id ? updatedOpportunity : opp)))
      setSelectedOpportunity(updatedOpportunity)
    }
  }

  // Mostrar skeleton mientras carga
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {columns.map((column) => (
            <div key={column.status} className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-3 h-3 rounded-full" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-8 ml-auto" />
              </div>
              <div className="space-y-3 min-h-96 bg-secondary/30 rounded-lg p-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredOpportunities.length} opportunity{filteredOpportunities.length !== 1 ? "ies" : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.status}
            title={column.title}
            opportunities={filteredOpportunities.filter((o) => o.status === column.status)}
            onCardClick={setSelectedOpportunity}
            onAssignClick={handleAssignClick}
            onMoveToComplete={handleMoveToComplete}
            updatingIds={updatingIds}
          />
        ))}
      </div>

      {selectedOpportunity && (
        <OpportunityDetailsModal
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          onAssignClick={() => {
            setOpportunityToAssign(selectedOpportunity)
            setRecommendationModalOpen(true)
            setSelectedOpportunity(null)
          }}
          onSaveEdits={handleSaveEdits}
        />
      )}

      {opportunityToAssign && (
        <TeamRecommendationModal
          open={recommendationModalOpen}
          onOpenChange={setRecommendationModalOpen}
          opportunity={opportunityToAssign}
          onAssignTeamMember={handleAssignTeamMember}
        />
      )}
    </div>
  )
}
