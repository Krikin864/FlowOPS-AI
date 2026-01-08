import { supabase } from '../config/db'

export interface CreateMemberInput {
  fullName: string
  email: string
  role: 'Sales' | 'Tech' | 'Admin'
  skillIds: string[] // Array of skill UUIDs
}

export interface MemberFromDB {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
}

/**
 * Creates a new team member in the database
 * @param input - Member data to create
 * @returns The created member or null if there's an error
 */
export async function createMember(input: CreateMemberInput): Promise<MemberFromDB | null> {
  try {
    // Validate required fields
    if (!input.fullName || !input.email || !input.role) {
      throw new Error('fullName, email, and role are required fields')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(input.email)) {
      throw new Error('Email format is not valid')
    }

    // Validate that skillIds is an array (can be empty)
    if (!Array.isArray(input.skillIds)) {
      throw new Error('skillIds must be an array')
    }

    // 1. Check if the email already exists
    const { data: existingMember, error: checkError } = await supabase
      .from('Profiles')
      .select('id, email')
      .eq('email', input.email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned", which is expected if it doesn't exist
      console.error('Error checking existing email:', checkError)
      throw checkError
    }

    if (existingMember) {
      throw new Error('A member with this email already exists')
    }

    // 2. Create the profile in the Profiles table
    const { data: newMember, error: memberError } = await supabase
      .from('Profiles')
      .insert({
        full_name: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        role: input.role,
      })
      .select('id, full_name, email, role, created_at')
      .single()

    if (memberError) {
      console.error('Error creating member:', memberError)
      throw memberError
    }

    if (!newMember) {
      throw new Error('Could not create member')
    }

    // 3. Link skills in the user_skills table if there are selected skills
    if (input.skillIds.length > 0) {
      // Validate that all skills exist in the database
      const { data: existingSkills, error: skillsCheckError } = await supabase
        .from('Skills')
        .select('id')
        .in('id', input.skillIds)

      if (skillsCheckError) {
        console.error('Error checking skills:', skillsCheckError)
        throw skillsCheckError
      }

      if (!existingSkills || existingSkills.length !== input.skillIds.length) {
        throw new Error('One or more skills do not exist in the database')
      }

      // Create the relationships in user_skills
      const userSkillsData = input.skillIds.map(skillId => ({
        user_id: newMember.id,
        skill_id: skillId,
      }))

      const { error: userSkillsError } = await supabase
        .from('user_skills')
        .insert(userSkillsData)

      if (userSkillsError) {
        console.error('Error linking skills:', userSkillsError)
        // Try to delete the created member if skill linking fails
        await supabase.from('Profiles').delete().eq('id', newMember.id)
        throw userSkillsError
      }
    }

    return {
      id: newMember.id,
      full_name: newMember.full_name,
      email: newMember.email,
      role: newMember.role,
      created_at: newMember.created_at,
    }
  } catch (error: any) {
    console.error('Error in createMember:', error)
    throw error
  }
}
