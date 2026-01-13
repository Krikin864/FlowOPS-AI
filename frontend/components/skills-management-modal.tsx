"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Settings, Plus, X, Loader2 } from "lucide-react"
import { getSkills, createSkill, type Skill } from "@/services/skills"
import { toast } from "sonner"

interface SkillsManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSkillsUpdated?: () => void // Callback when skills are updated
}

export default function SkillsManagementModal({ 
  open, 
  onOpenChange,
  onSkillsUpdated 
}: SkillsManagementModalProps) {
  const [newSkillName, setNewSkillName] = useState("")
  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string>("")

  // Load skills when modal opens
  useEffect(() => {
    if (open) {
      loadSkills()
    }
  }, [open])

  const loadSkills = async () => {
    try {
      setIsLoading(true)
      const skillsData = await getSkills()
      setSkills(skillsData)
    } catch (error: any) {
      console.error('Error loading skills:', error)
      toast.error('Failed to load skills. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setNewSkillName("")
    setError("")
  }

  const handleCreateSkill = async () => {
    const trimmedName = newSkillName.trim()
    
    if (!trimmedName) {
      setError("Skill name cannot be empty")
      return
    }

    setIsCreating(true)
    setError("")
    
    try {
      const newSkill = await createSkill(trimmedName)
      
      // Refresh skills list
      await loadSkills()
      
      // Clear input
      setNewSkillName("")
      
      toast.success('Skill created successfully')
      
      // Notify parent component to refresh
      if (onSkillsUpdated) {
        onSkillsUpdated()
      }

      // Emit global event to refresh skills in all components
      window.dispatchEvent(new CustomEvent('skillsUpdated'))
    } catch (error: any) {
      console.error('Error creating skill:', error)
      const errorMessage = error?.message || 'Error creating skill'
      
      // Check if it's a duplicate error
      if (errorMessage.includes('ya está registrada') || errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        setError('Esta habilidad ya está registrada')
        toast.error('Esta habilidad ya está registrada')
      } else {
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } finally {
      setIsCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isCreating) {
      e.preventDefault()
      handleCreateSkill()
    }
  }

  const isFormValid = newSkillName.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Settings className="h-5 w-5" />
            Manage Skills
          </DialogTitle>
          <DialogDescription className="text-center">
            Add new skills to the system or view existing ones
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Add New Skill Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-skill-name">Add New Skill</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="new-skill-name"
                  placeholder="e.g., React, Python, Design"
                  value={newSkillName}
                  onChange={(e) => {
                    setNewSkillName(e.target.value)
                    if (error) setError("")
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={isCreating}
                  className={error ? "border-red-500" : ""}
                />
                <Button 
                  onClick={handleCreateSkill}
                  disabled={!isFormValid || isCreating}
                  className="gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              </div>
              {error && (
                <p className="text-sm text-red-500 mt-1">{error}</p>
              )}
            </div>
          </div>

          {/* Existing Skills List */}
          <div className="space-y-3">
            <Label>Existing Skills ({skills.length})</Label>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading skills...</span>
              </div>
            ) : skills.length === 0 ? (
              <div className="bg-secondary/50 border border-border rounded-lg p-8 text-center">
                <p className="text-muted-foreground">No skills available. Add your first skill above.</p>
              </div>
            ) : (
              <div className="bg-secondary/50 border border-border rounded-lg max-h-96 overflow-y-auto">
                <div className="divide-y divide-border">
                  {skills.map((skill, index) => (
                    <div
                      key={skill.id}
                      className="p-4 hover:bg-secondary/70 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{skill.name}</p>
                          <p className="text-xs text-muted-foreground">ID: {skill.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-6 mt-6 border-t border-border">
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

