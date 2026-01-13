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
  memberId?: string // ID del miembro si está en modo edición
  initialData?: {
    name: string
    email: string
    role: "Sales" | "Tech" | "Admin"
    skillIds: string[]
  } // Datos iniciales para modo edición
}

const ROLES: Array<"Sales" | "Tech" | "Admin"> = ["Sales", "Tech", "Admin"]

export default function MemberForm({ 
  open, 
  onOpenChange, 
  onSubmit, 
  availableSkills = [],
  memberId,
  initialData
}: MemberFormProps) {
  const isEditMode = !!memberId && !!initialData
  const [name, setName] = useState(initialData?.name || "")
  const [email, setEmail] = useState(initialData?.email || "")
  const [role, setRole] = useState<"Sales" | "Tech" | "Admin" | "">(initialData?.role || "")
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(initialData?.skillIds || [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingSkills, setIsLoadingSkills] = useState(false)
  const [skills, setSkills] = useState<Skill[]>(availableSkills)
  const [errors, setErrors] = useState<{ name?: string; email?: string; role?: string }>({})

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

    // Listen for skills updates
    const handleSkillsUpdated = () => {
      if (open) {
        loadSkills()
      }
    }

    window.addEventListener('skillsUpdated', handleSkillsUpdated)

    return () => {
      window.removeEventListener('skillsUpdated', handleSkillsUpdated)
    }
  }, [open, availableSkills])

  // Load initial data when in edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      setName(initialData.name || "")
      setEmail(initialData.email || "")
      setRole(initialData.role || "")
      setSelectedSkillIds(initialData.skillIds || [])
    }
  }, [isEditMode, initialData, open])

  const handleClose = () => {
    onOpenChange(false)
    // Reset form when closing
    setName("")
    setEmail("")
    setRole("")
    setSelectedSkillIds([])
    setIsSubmitting(false)
    setErrors({})
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
    // Clear previous errors
    setErrors({})

    // Validate required fields
    const newErrors: { name?: string; email?: string; role?: string } = {}
    
    if (!name.trim()) {
      newErrors.name = "Name is required"
    }
    
    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        newErrors.email = "Please enter a valid email address"
      }
    }
    
    if (!role) {
      newErrors.role = "Role is required"
    }

    // If there are validation errors, set them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
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
    } catch (error: any) {
      console.error("Error creating member:", error)
      
      // Check if error is about duplicate email
      if (error?.message?.toLowerCase().includes('email') && error?.message?.toLowerCase().includes('already exists')) {
        setErrors({ email: "A member with this email already exists" })
      } else if (error?.message) {
        // Show general error message
        setErrors({ email: error.message })
      }
      
      // Keep modal open so user can correct errors
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = name.trim() && email.trim() && role

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {isEditMode ? "Edit Team Member" : "Add Team Member"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isEditMode 
              ? "Update the team member information below"
              : "Fill in the fields below to add a new team member to your organization"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="member-name">Name *</Label>
              <Input
                id="member-name"
                placeholder="e.g., John Doe"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors({ ...errors, name: undefined })
                }}
                disabled={isSubmitting}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="member-email">Email *</Label>
              <Input
                id="member-email"
                type="email"
                placeholder="e.g., john.doe@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors({ ...errors, email: undefined })
                }}
                disabled={isSubmitting}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="member-role">Role *</Label>
              <Select 
                value={role} 
                onValueChange={(value) => {
                  setRole(value as "Sales" | "Tech" | "Admin")
                  if (errors.role) setErrors({ ...errors, role: undefined })
                }} 
                disabled={isSubmitting}
              >
                <SelectTrigger id="member-role" className={`w-full ${errors.role ? "border-red-500" : ""}`}>
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
              {errors.role && <p className="text-sm text-red-500 mt-1">{errors.role}</p>}
            </div>
          </div>

          {/* Skills Selection */}
          <div>
            <Label>Skills (Optional)</Label>
            {isLoadingSkills ? (
              <div className="p-3 bg-secondary rounded-lg text-sm text-muted-foreground">
                Loading skills...
              </div>
            ) : (
              <>
                {/* Selected Skills */}
                {selectedSkillIds.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2 p-3 bg-secondary rounded-lg min-h-[60px]">
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
                <div className="flex flex-wrap gap-2 p-3 bg-secondary rounded-lg max-h-40 overflow-y-auto min-h-[60px]">
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
        </div>

        <div className="flex gap-3 justify-end pt-6 mt-6 border-t border-border">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isFormValid || isSubmitting}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            {isSubmitting 
              ? (isEditMode ? "Updating..." : "Adding...") 
              : (isEditMode ? "Update Team Member" : "Add Team Member")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

