"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { getTeamMembers, type TeamMember } from "@/services/members"

interface Opportunity {
  id: string
  clientName: string
  company: string
  summary: string
  requiredSkill: string | string[]
  assignee: string
  status: "new" | "assigned" | "done" | "cancelled" | "archived"
  urgency: "high" | "medium" | "low"
  aiSummary: string
}

interface TeamRecommendationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  opportunity: Opportunity
  onAssignTeamMember: (memberId: string) => void
}

export default function TeamRecommendationModal({
  open,
  onOpenChange,
  opportunity,
  onAssignTeamMember,
}: TeamRecommendationModalProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load team members from Supabase
  useEffect(() => {
    async function loadTeamMembers() {
      if (!open) return // Only load when the modal is open
      
      try {
        setIsLoading(true)
        const data = await getTeamMembers()
        setTeamMembers(data)
      } catch (error) {
        console.error('Error loading team members:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTeamMembers()
  }, [open])

  // Normalize requiredSkill to array for comparison
  const requiredSkills = Array.isArray(opportunity.requiredSkill) 
    ? opportunity.requiredSkill 
    : [opportunity.requiredSkill].filter(skill => skill && skill !== '')

  // Filter members who have at least one of the required skills
  // When AI extracts skills, only show members with matching skills
  const matchingMembers = teamMembers.filter((member) =>
    requiredSkills.length > 0 && requiredSkills.some(skill => member.skills.includes(skill))
  )
  
  // Only show alternative members if no skills were extracted by AI
  // If skills were extracted, only show matching members
  const shouldShowAlternatives = requiredSkills.length === 0 || requiredSkills.every(skill => !skill || skill === '')
  const allOtherMembers = shouldShowAlternatives 
    ? teamMembers.filter((member) =>
        !requiredSkills.some(skill => member.skills.includes(skill))
      )
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Opportunity to Team Member</DialogTitle>
          <DialogDescription>
            Select a team member for: <span className="font-semibold text-foreground">{opportunity.clientName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Opportunity Summary */}
          <div className="bg-secondary/50 p-4 rounded-lg border border-border">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Required Skill{requiredSkills.length > 1 ? 's' : ''}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {requiredSkills.length > 0 ? (
                  <>
                    {requiredSkills.map((skill, idx) => (
                      <Badge key={idx} className="text-base">{skill}</Badge>
                    ))}
                    <span className="text-sm text-muted-foreground">
                      {matchingMembers.length} team member{matchingMembers.length !== 1 ? "s" : ""} with {requiredSkills.length > 1 ? 'these skills' : 'this skill'}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground italic">No specific skills required</span>
                )}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 rounded-lg border border-border bg-card">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No team members available</p>
            </div>
          ) : (
            <>
              {/* Recommended Team Members (Matching Skills) */}
              {requiredSkills.length > 0 && matchingMembers.length === 0 ? (
                <div className="space-y-3">
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <p className="text-sm font-semibold text-foreground">No exact matches found</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      No team members have the required skill{requiredSkills.length > 1 ? 's' : ''}: {requiredSkills.join(', ')}. Showing all available members.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => {
                          onAssignTeamMember(member.id)
                          onOpenChange(false)
                        }}
                        className="w-full p-4 rounded-lg border border-border/50 bg-card hover:border-primary hover:bg-secondary/30 transition-all text-left opacity-75 hover:opacity-100 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-foreground group-hover:text-primary">{member.name}</p>
                            {member.email && (
                              <p className="text-xs text-muted-foreground mt-1">{member.email}</p>
                            )}
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {member.skills.length > 0 ? (
                                member.skills.map((skill) => (
                                  <Badge 
                                    key={skill} 
                                    variant="secondary" 
                                    className="text-xs opacity-60"
                                  >
                                    {skill}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground italic">No skills assigned</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-xs text-muted-foreground">Current</p>
                            <p className="font-semibold text-foreground">{member.activeOpportunities} tasks</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : matchingMembers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Recommended Matches
                  </h3>
                  <div className="space-y-2">
                    {matchingMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => {
                          onAssignTeamMember(member.id)
                          onOpenChange(false)
                        }}
                        className="w-full p-4 rounded-lg border border-border bg-card hover:border-primary hover:bg-secondary/50 transition-all text-left group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-foreground group-hover:text-primary">{member.name}</p>
                            {member.email && (
                              <p className="text-xs text-muted-foreground mt-1">{member.email}</p>
                            )}
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {member.skills.length > 0 ? (
                                member.skills.map((skill) => (
                                  <Badge
                                    key={skill}
                                    variant={requiredSkills.includes(skill) ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {skill}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground italic">No skills assigned</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-xs text-muted-foreground">Current</p>
                            <p className="font-semibold text-foreground">{member.activeOpportunities} tasks</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Alternative Team Members - Only show if there are matching members and alternatives exist */}
              {matchingMembers.length > 0 && allOtherMembers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    Alternative Options
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    These team members don't have the required skill{requiredSkills.length > 1 ? 's' : ''} but can be assigned if needed.
                  </p>
                  <div className="space-y-2">
                    {allOtherMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => {
                          onAssignTeamMember(member.id)
                          onOpenChange(false)
                        }}
                        className="w-full p-4 rounded-lg border border-border/50 bg-card hover:border-primary hover:bg-secondary/30 transition-all text-left opacity-75 hover:opacity-100 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-foreground group-hover:text-primary">{member.name}</p>
                            {member.email && (
                              <p className="text-xs text-muted-foreground mt-1">{member.email}</p>
                            )}
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {member.skills.length > 0 ? (
                                member.skills.map((skill) => (
                                  <Badge 
                                    key={skill} 
                                    variant="secondary" 
                                    className="text-xs opacity-60"
                                  >
                                    {skill}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground italic">No skills assigned</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-xs text-muted-foreground">Current</p>
                            <p className="font-semibold text-foreground">{member.activeOpportunities} tasks</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
