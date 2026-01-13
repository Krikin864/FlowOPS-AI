import { supabase } from '@/lib/supabase'

export interface Skill {
  id: string
  name: string
}

/**
 * Gets all skills from the Skills table
 */
export async function getSkills(): Promise<Skill[]> {
  try {
    // Try with "Skills" first (case-sensitive with quotes)
    let { data: skills, error } = await supabase
      .from("Skills")
      .select('id, name')
      .order('name', { ascending: true })

    // If that fails, try with "skills" (lowercase)
    if (error && (error.message?.includes('does not exist') || error.code === '42P01')) {
      console.warn('Table "Skills" not found, trying "skills" (lowercase)')
      const result = await supabase
        .from("skills")
        .select('id, name')
        .order('name', { ascending: true })
      
      skills = result.data
      error = result.error
    }

    if (error) {
      console.error('Error fetching skills:', JSON.stringify(error, null, 2))
      throw error
    }

    return skills || []
  } catch (error: any) {
    console.error('Error in getSkills:', JSON.stringify(error, null, 2))
    throw error
  }
}

/**
 * Creates a new skill in the Skills table
 * @param skillName - Name of the skill to create
 * @returns The created skill
 */
export async function createSkill(skillName: string): Promise<Skill> {
  try {
    const trimmedName = skillName.trim()
    
    if (!trimmedName) {
      throw new Error('Skill name cannot be empty')
    }

    // Try with "Skills" first (case-sensitive with quotes)
    let { data: skill, error } = await supabase
      .from("Skills")
      .insert([{ name: trimmedName }])
      .select('id, name')
      .single()

    // If that fails, try with "skills" (lowercase)
    if (error && (error.message?.includes('does not exist') || error.code === '42P01')) {
      console.warn('Table "Skills" not found, trying "skills" (lowercase)')
      const result = await supabase
        .from("skills")
        .insert([{ name: trimmedName }])
        .select('id, name')
        .single()
      
      skill = result.data
      error = result.error
    }

    if (error) {
      // Check for duplicate error (PostgreSQL error code 23505)
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        throw new Error('Esta habilidad ya está registrada')
      }
      console.error('Error creating skill:', JSON.stringify(error, null, 2))
      throw error
    }

    if (!skill) {
      throw new Error('Failed to create skill')
    }

    return skill
  } catch (error: any) {
    console.error('Error in createSkill:', JSON.stringify(error, null, 2))
    throw error
  }
}

