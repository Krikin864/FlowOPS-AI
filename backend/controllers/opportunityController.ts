import { supabase } from '../config/db'

export interface CreateOpportunityInput {
  clientName: string
  company: string
  originalMessage: string
  aiSummary?: string
  urgency?: 'high' | 'medium' | 'low'
  requiredSkillId?: string | null
  assignedUserId?: string | null
}

export interface OpportunityFromDB {
  id: string
  client_id: string
  assigned_user_id: string | null
  status: string
  original_message: string
  ai_summary: string
  urgency: string
  required_skill_id: string | null
  created_at: string
  Clients?: {
    name: string
    company: string
  } | null
  Profiles?: {
    full_name: string
  } | null
}

/**
 * Crea una nueva oportunidad en la base de datos
 * @param input - Datos de la oportunidad a crear
 * @returns La oportunidad creada o null si hay error
 */
export async function createOpportunity(input: CreateOpportunityInput): Promise<OpportunityFromDB | null> {
  try {
    // Validar campos requeridos
    if (!input.clientName || !input.company || !input.originalMessage) {
      throw new Error('clientName, company y originalMessage son campos requeridos')
    }

    // 1. Buscar o crear el cliente
    let clientId: string

    // Buscar cliente existente por nombre y compañía
    const { data: existingClient, error: clientSearchError } = await supabase
      .from('Clients')
      .select('id')
      .eq('name', input.clientName)
      .eq('company', input.company)
      .single()

    if (clientSearchError && clientSearchError.code !== 'PGRST116') {
      // PGRST116 es "no rows returned", que es esperado si no existe
      console.error('Error buscando cliente:', clientSearchError)
      throw clientSearchError
    }

    if (existingClient) {
      clientId = existingClient.id
    } else {
      // Crear nuevo cliente
      const { data: newClient, error: clientCreateError } = await supabase
        .from('Clients')
        .insert({
          name: input.clientName,
          company: input.company,
        })
        .select('id')
        .single()

      if (clientCreateError) {
        console.error('Error creando cliente:', clientCreateError)
        throw clientCreateError
      }

      if (!newClient) {
        throw new Error('No se pudo crear el cliente')
      }

      clientId = newClient.id
    }

    // 2. Determinar el status inicial
    // Regla: Si hay un usuario asignado, el status debe ser 'assigned'
    let status: string = 'new'
    if (input.assignedUserId) {
      status = 'assigned'
    }

    // 3. Crear la oportunidad
    const opportunityData: any = {
      client_id: clientId,
      original_message: input.originalMessage,
      status: status,
      urgency: (input.urgency || 'medium').toLowerCase(),
      assigned_user_id: input.assignedUserId || null,
    }

    // Agregar campos opcionales si están presentes
    if (input.aiSummary) {
      opportunityData.ai_summary = input.aiSummary
    }

    if (input.requiredSkillId) {
      opportunityData.required_skill_id = input.requiredSkillId
    }

    const { data: opportunity, error: opportunityError } = await supabase
      .from('Opportunities')
      .insert(opportunityData)
      .select(`
        id,
        client_id,
        assigned_user_id,
        status,
        original_message,
        ai_summary,
        urgency,
        required_skill_id,
        created_at,
        Clients!client_id (
          name,
          company
        ),
        Profiles!assigned_user_id (
          full_name
        )
      `)
      .single()

    if (opportunityError) {
      console.error('Error creando oportunidad:', opportunityError)
      throw opportunityError
    }

    if (!opportunity) {
      throw new Error('No se pudo crear la oportunidad')
    }

    return opportunity as OpportunityFromDB
  } catch (error: any) {
    console.error('Error en createOpportunity:', error)
    throw error
  }
}

