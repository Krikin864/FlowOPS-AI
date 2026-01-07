"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus } from "lucide-react"

export interface MemberFormData {
  name: string
  email: string
  role: "Sales" | "Tech" | "Admin"
}

interface MemberFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: MemberFormData) => Promise<void> | void
}

const ROLES: Array<"Sales" | "Tech" | "Admin"> = ["Sales", "Tech", "Admin"]

export default function MemberForm({ open, onOpenChange, onSubmit }: MemberFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"Sales" | "Tech" | "Admin" | "">("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClose = () => {
    onOpenChange(false)
    // Resetear formulario cuando se cierra
    setName("")
    setEmail("")
    setRole("")
    setIsSubmitting(false)
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
      }

      await onSubmit(formData)
      
      // Si el submit fue exitoso, cerrar el modal y resetear
      handleClose()
    } catch (error) {
      console.error("Error al crear miembro:", error)
      // El error debería ser manejado por la función onSubmit
      // pero mantenemos el modal abierto para que el usuario pueda corregir
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = name.trim() && email.trim() && role

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Miembro del Equipo</DialogTitle>
          <DialogDescription>
            Completa los campos para agregar un nuevo miembro al equipo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="member-name">Nombre</Label>
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
            <Label htmlFor="member-role">Rol</Label>
            <Select value={role} onValueChange={(value) => setRole(value as "Sales" | "Tech" | "Admin")} disabled={isSubmitting}>
              <SelectTrigger id="member-role" className="w-full">
                <SelectValue placeholder="Selecciona un rol" />
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

          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!isFormValid || isSubmitting}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {isSubmitting ? "Agregando..." : "Agregar Miembro"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

