import { supabase } from '@/lib/supabase'

export interface TeamMember {
  id: string
  name: string
  email: string
  role?: string
  skills: string[]
  activeOpportunities: number
  completedOpportunities: number
}

/**
 * Gets all team members from the database with their skills
 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("Profiles")
      .select('id, full_name, email, role')
      .order('full_name', { ascending: true })

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      throw profilesError
    }

    if (!profiles || profiles.length === 0) {
      return []
    }

    // Get all skills associated with users
    const profileIds = profiles.map(p => p.id)
    
    // Try to get skills from the user_skills table
    const { data: userSkills, error: userSkillsError } = await supabase
      .from('user_skills')
      .select(`
        user_id,
        skill:skill_id (
          id,
          name
        )
      `)
      .in('user_id', profileIds)

    // Create a map of skills per user
    const skillsMap: Record<string, string[]> = {}
    
    if (!userSkillsError && userSkills && userSkills.length > 0) {
      userSkills.forEach((us: any) => {
        if (us.skill && us.user_id) {
          if (!skillsMap[us.user_id]) {
            skillsMap[us.user_id] = []
          }
          skillsMap[us.user_id].push(us.skill.name)
        }
      })
    }

    // Get opportunity statistics for each member
    const { data: opportunities, error: oppError } = await supabase
      .from("Opportunities")
      .select('id, assigned_user_id, status')
      .in('assigned_user_id', profileIds)

    // Calculate active and completed opportunities per user
    const activeOppsMap: Record<string, number> = {}
    const completedOppsMap: Record<string, number> = {}

    if (!oppError && opportunities) {
      opportunities.forEach((opp: any) => {
        if (opp.assigned_user_id) {
          if (opp.status === 'assigned' || opp.status === 'Assigned') {
            activeOppsMap[opp.assigned_user_id] = (activeOppsMap[opp.assigned_user_id] || 0) + 1
          } else if (opp.status === 'done' || opp.status === 'Done') {
            completedOppsMap[opp.assigned_user_id] = (completedOppsMap[opp.assigned_user_id] || 0) + 1
          }
        }
      })
    }

    // Transform data to the format expected by the frontend
    const teamMembers: TeamMember[] = profiles.map((profile: any) => ({
      id: profile.id,
      name: profile.full_name || 'Unknown',
      email: profile.email || '',
      role: profile.role || undefined,
      skills: skillsMap[profile.id] || [],
      activeOpportunities: activeOppsMap[profile.id] || 0,
      completedOpportunities: completedOppsMap[profile.id] || 0,
    }))

    return teamMembers
  } catch (error) {
    console.error('Error in getTeamMembers:', error)
    throw error
  }
}

/**
 * Gets the total count of team members
 */
export async function getTeamMembersCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("Profiles")
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Error fetching count:', error)
      throw error
    }

    return count || 0
  } catch (error) {
    console.error('Error in getTeamMembersCount:', error)
    throw error
  }
}

/**
 * Creates a new team member
 * @param memberData - Member data to create
 * @returns The created member
 */
export async function createTeamMember(memberData: {
  name: string
  email: string
  role: "Sales" | "Tech" | "Admin"
  skillIds: string[]
}): Promise<TeamMember> {
  try {
    // Call the Next.js API route
    const response = await fetch('/api/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: memberData.name,
        email: memberData.email,
        role: memberData.role,
        skillIds: memberData.skillIds,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error creating member')
    }

    const result = await response.json()

    // Get skills for the newly created member
    const { data: userSkills, error: skillsError } = await supabase
      .from('user_skills')
      .select(`
        skill:skill_id (
          id,
          name
        )
      `)
      .eq('user_id', result.id)

    const skills: string[] = []
    if (!skillsError && userSkills) {
      userSkills.forEach((us: any) => {
        if (us.skill) {
          skills.push(us.skill.name)
        }
      })
    }

    // Return in the format expected by the frontend
    return {
      id: result.id,
      name: result.full_name,
      email: result.email,
      role: result.role,
      skills: skills,
      activeOpportunities: 0,
      completedOpportunities: 0,
    }
  } catch (error: any) {
    console.error('Error in createTeamMember:', error)
    throw error
  }
}

