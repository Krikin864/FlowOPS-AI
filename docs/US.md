User Story 1: Add Opportunity 
 As a manager, I want to paste a client email or message to create a new opportunity, so all leads are centralized.
Acceptance Criteria:
New opportunity is added to the Kanban board under “New.”


Original message, Client and company name are saved in the opportunity record.


Implementation Notes:
Use a simple form with fields: Client Name, company name and Communication Text.


Save the opportunity with status set to “New” and a creation timestamp.


Update the Kanban board immediately after successful creation.


QA Notes:
Verify pasted text is saved correctly.


Confirm the new card appears in the “New” column immediately.

User Story 2: AI Summarization
 As a manager, I want AI to summarize client needs with skill and urgency, so I quickly understand the request.
Acceptance Criteria:
AI generates a one-sentence summary, a skill tag, and an urgency level.


An “AI Processing” indicator is visible while the AI is working.


Implementation Notes:
Send client text to OpenAI API (GPT-4o-mini) and parse JSON response.


Populate Summary, Skill, and Urgency fields in the UI.


Show processing indicator until API response is received.


QA Notes:
Verify AI generates correct summary, skill, and urgency for sample inputs.


Confirm processing indicator appears during analysis.


Test edge cases: very long emails, empty text, and unsupported languages.



User Story 3: Recommend Team Members
 As a manager, I want the system to filter team members by skill, so I can assign the best match.
Acceptance Criteria:
System displays a list of team members with matching skills.


Manager can select a team member to assign.


The opportunity card moves automatically to the “Assigned” column upon assignment.


Implementation Notes:
Filter users from team database by matching skill tag.


Display filtered list in modal or sidebar.


Update opportunity record with assigned member and status “Assigned.”


Refresh Kanban board to reflect change.


QA Notes:
Verify that only team members with the required skill appear.


Test assignment updates the card and database correctly.


Confirm assignment works when multiple members match and when no member matches.




User Story 4: Track Progress
 As a manager, I want a Kanban view of opportunities, so I can see which are new, assigned, or done.
Acceptance Criteria:
Kanban board shows three columns: New, Assigned, Done.


Each card displays client info, AI summary, required skill, and assignee.


Filters for urgency, skill, and assignee work in real-time.


Implementation Notes:
Implement Kanban board using React state or component library.


Ensure cards update dynamically based on status and filters.


Include color-coded badges for urgency and skill.


QA Notes:
Verify columns reflect opportunity status correctly.


Test filters independently and in combination.


Check real-time updates when status or assignment changes.




User Story 5: Correct AI Results
 As a manager, I want to edit AI-generated summaries or skills, so opportunities are correctly categorized.
Acceptance Criteria:
Summary, skill, and urgency are editable in the details modal.


Changes save immediately and update the corresponding Kanban card.


Implementation Notes:
Provide inline editable fields or modal inputs.


On save, update opportunity record in the database and refresh Kanban card.


Validate input before saving (no empty summary, valid skill, valid urgency).


QA Notes:
Verify edits update the Kanban card and database correctly.


Test cancel/close without saving.


Test boundary values (long summary text, invalid skill selection).


