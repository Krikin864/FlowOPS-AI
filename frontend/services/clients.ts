import { supabase } from '@/lib/supabase'

export interface Client {
  id: string
  name: string
  company: string
}

/**
 * Searches for a client by name and company
 * @param name - Client name
 * @param company - Company name
 * @returns The client if it exists, null if it doesn't exist
 */
export async function findClientByNameAndCompany(
  name: string,
  company: string
): Promise<Client | null> {
  try {
    const { data, error } = await supabase
      .from("Clients")
      .select('id, name, company')
      .eq('name', name.trim())
      .eq('company', company.trim())
      .maybeSingle()

    if (error) {
      console.error('Error fetching client:', error)
      throw error
    }

    return data || null
  } catch (error) {
    console.error('Error completo:', error)
    throw error
  }
}

/**
 * Creates a new client
 * @param name - Client name
 * @param company - Company name
 * @returns The created client
 */
export async function createClient(
  name: string,
  company: string
): Promise<Client> {
  try {
    const { data, error } = await supabase
      .from("Clients")
      .insert({
        name: name.trim(),
        company: company.trim(),
      })
      .select('id, name, company')
      .single()

    if (error) {
      console.error('Error fetching client:', error)
      throw error
    }

    if (!data) {
      throw new Error('Failed to create client')
    }

    return data
  } catch (error) {
    console.error('Error completo:', error)
    throw error
  }
}

/**
 * Searches for or creates a client
 * @param name - Client name
 * @param company - Company name
 * @returns The client (existing or newly created)
 */
export async function findOrCreateClient(
  name: string,
  company: string
): Promise<Client> {
  try {
    // First search if it exists
    const existingClient = await findClientByNameAndCompany(name, company)
    
    if (existingClient) {
      return existingClient
    }

    // If it doesn't exist, create it
    return await createClient(name, company)
  } catch (error) {
    console.error('Error completo:', error)
    throw error
  }
}

/**
 * Gets all clients for suggestions
 * @returns List of clients
 */
export async function getAllClients(): Promise<Client[]> {
  try {
    const { data, error } = await supabase
      .from("Clients")
      .select('id, name, company')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching client:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error completo:', error)
    throw error
  }
}

