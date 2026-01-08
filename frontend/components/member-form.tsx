"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, X } from "lucide-react"
import { getSkills, type Skill } from "@/services/skills"

export interface MemberFormData {
  name: string
  email: string
  role: "Sales" | "Tech" | "Admin"
  skillIds: string[] // Array de UUIDs de skills
}

interface MemberFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: MemberFormData) => Promise<void> | void
  availableSkills?: Skill[] // Skills disponibles desde la DB
}

const ROLES: Array<"Sales" | "Tech" | "Admin"> = ["Sales", "Tech", "Admin"]

export default function MemberForm({ open, onOpenChange, onSubmit, availableSkills = [] }: MemberFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"Sales" | "Tech" | "Admin" | "">("")
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingSkills, setIsLoadingSkills] = useState(false)
  const [skills, setSkills] = useState<Skill[]>(availableSkills)

  // Cargar skills desde la DB si no se proporcionaron como prop
  useEffect(() => {
    async function loadSkills() {
      if (availableSkills.length > 0) {
        setSkills(availableSkills)
        return
      }

      if (!open) return // Solo cargar cuando el modal esté abierto

      try {
        setIsLoadingSkills(true)
        const skillsData = await getSkills()
        setSkills(skillsData)
      } catch (error) {
        console.error('Error loading skills:', error)
      } finally {
        setIsLoadingSkills(false)
      }
    }

    loadSkills()
  }, [open, availableSkills])

  const handleClose = () => {
    onOpenChange(false)
    // Resetear formulario cuando se cierra
    setName("")
    setEmail("")
    setRole("")
    setSelectedSkillIds([])
    setIsSubmitting(false)
  }

  const handleAddSkill = (skillId: string) => {
    if (!selectedSkillIds.includes(skillId)) {
      setSelectedSkillIds([...selectedSkillIds, skillId])
    }
  }

  const handleRemoveSkill = (skillId: string) => {
    setSelectedSkillIds(selectedSkillIds.filter((id) => id !== skillId))
  }

  const getSelectedSkills = () => {
    return skills.filter(skill => selectedSkillIds.includes(skill.id))
  }

  const getAvailableSkills = () => {
    return skills.filter(skill => !selectedSkillIds.includes(skill.id))
  }

  const handleSubmit = async () => {
    // Validar campos
    if (!name.trim() || !email.trim() || !role) {
      return
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      // Podrías agregar un toast aquí para mostrar el error
      console.error("Email inválido")
      return
    }

    setIsSubmitting(true)

    try {
      const formData: MemberFormData = {
        name: name.trim(),
        email: email.trim(),
        role: role as "Sales" | "Tech" | "Admin",
        skillIds: selectedSkillIds,
      }

      await onSubmit(formData)
      
      // If submit was successful, close modal and reset
      handleClose()
    } catch (error) {
      console.error("Error creating member:", error)
      // Error should be handled by the onSubmit function
      // but we keep the modal open so the user can correct it
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = name.trim() && email.trim() && role && selectedSkillIds.length > 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Fill in the fields to add a new team member
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="member-name">Name</Label>
            <Input
              id="member-name"
              placeholder="e.g., Juan Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="member-email">Email</Label>
            <Input
              id="member-email"
              type="email"
              placeholder="e.g., juan@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="member-role">Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as "Sales" | "Tech" | "Admin")} disabled={isSubmitting}>
              <SelectTrigger id="member-role" className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Skills Selection */}
          <div>
            <Label>Skills</Label>
            {isLoadingSkills ? (
              <div className="p-3 bg-secondary rounded-lg text-sm text-muted-foreground">
                Cargando skills...
              </div>
            ) : (
              <>
                {/* Selected Skills */}
                {selectedSkillIds.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2 p-3 bg-secondary rounded-lg">
                    {getSelectedSkills().map((skill) => (
                      <div
                        key={skill.id}
                        className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-semibold flex items-center gap-2"
                      >
                        {skill.name}
                        <button
                          onClick={() => handleRemoveSkill(skill.id)}
                          className="hover:opacity-70"
                          disabled={isSubmitting}
                          type="button"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Available Skills */}
                <div className="flex flex-wrap gap-2 p-3 bg-secondary rounded-lg max-h-40 overflow-y-auto">
                  {getAvailableSkills().length > 0 ? (
                    getAvailableSkills().map((skill) => (
                      <button
                        key={skill.id}
                        onClick={() => handleAddSkill(skill.id)}
                        disabled={isSubmitting}
                        type="button"
                        className="px-3 py-1 bg-muted text-foreground rounded-full text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {skill.name}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic w-full text-center">
                      {selectedSkillIds.length > 0 ? "All skills have been selected" : "No skills available"}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!isFormValid || isSubmitting}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {isSubmitting ? "Adding..." : "Add Member"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

