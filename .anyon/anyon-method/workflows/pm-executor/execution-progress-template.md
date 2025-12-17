# Execution Progress - Wave-by-Wave Tracking

**Last Updated**: {{timestamp}}
**Project**: {{project_name}}

---

## 🚀 Workflow State Management

### Current State
- **workflow_state**: {{workflow_state}}
  - `awaiting_execution`: Ready for pm-executor to run next Wave
  - `executing`: pm-executor is actively running
  - `awaiting_review`: pm-executor completed, waiting for pm-reviewer
  - `reviewing`: pm-reviewer is actively running code review
  - `execution_complete`: All Waves completed, project ready
  - `error`: Error occurred, manual intervention needed
- **last_state_change**: {{state_change_timestamp}}
- **state_changed_by**: {{state_changed_by}} (pm-executor or pm-reviewer)

### State History
```
Initial state (creation):        "awaiting_execution"
After Wave completion:           "awaiting_review"
After review completion:         "awaiting_execution" (next Wave) or "execution_complete" (final)
```

**Note for auto-cycle.sh**: This state field is monitored by external automation to trigger workflow transitions.

---

## 📊 Current Status

| Metric | Value |
|--------|-------|
| 📍 Current Wave | {{current_wave}} |
| 🎯 Current Epic | {{current_epic}} |
| ✅ Completed Waves | {{completed_waves}} / {{total_waves}} |
| ✅ Completed Tickets | {{completed_tickets}} / {{total_tickets}} |
| ⏳ Overall Progress | {{overall_progress}}% |
| 🔁 Blocked Tickets | {{blocked_count}} |

---

## 🌊 Wave-by-Wave Progress

### {{current_epic}}: {{epic_name}}

#### Wave 1: {{wave_1_name}}
- **Status**: [Completed / In Progress / Waiting]
- **Tickets**: {{wave_1_completed}}/{{wave_1_total}} completed
- **Blocked**: {{wave_1_blocked}}
- **Review Status**: [Completed / Pending / In Progress]
- **Completed**: {{wave_1_completion_date}}

**Completed Tickets**:
{{#each completed_tickets_wave_1}}
- ✅ {{ticket_id}}: {{title}}
  - Commit: {{commit_hash}}
  - Files: {{files}}
{{/each}}

**Blocked Tickets**:
{{#each blocked_tickets_wave_1}}
- ❌ {{ticket_id}}: {{title}}
  - Reason: {{failure_reason}}
  - Last Error: {{last_error_type}} - {{last_error_message}}
  - Attempts: {{attempts}}/3
  - Suggestion: {{fix_suggestion}}
{{/each}}

#### Wave 2: {{wave_2_name}}
- **Status**: [Not Started / Waiting]
- **Tickets**: 0/{{wave_2_total}} completed
- **Dependencies**: {{wave_2_dependencies}}

---

## 📂 Generated Artifacts

### Files Created
{{#each created_files}}
- `{{path}}`: {{description}}
{{/each}}

### API Endpoints
{{#each created_endpoints}}
- `{{method}} {{path}}`: {{description}}
{{/each}}

### Database Migrations
{{#each migrations}}
- `{{name}}`: {{description}}
{{/each}}

---

## 🔄 Retry Queue (Blocked Tickets for Next Session)

{{#if has_blocked_tickets}}
These tickets failed in their respective Wave and will be retried:

{{#each blocked_tickets}}
1. **{{ticket_id}}: {{title}}**
   - Wave: {{wave}}
   - Reason: {{reason}}
   - Error Type: {{error_type}}
   - Suggestion: {{suggestion}}
   - Last Attempted: {{last_attempt_date}}
{{/each}}

**Action for Next Session**:
- Retry blocked tickets in same Wave before proceeding to next Wave
- Use same ticket execution logic (TDD, WebSearch, etc.)
- Max 3 attempts per ticket (already at {{max_attempts}} attempts - check if needs escalation)

{{/if}}
{{#if no_blocked_tickets}}
✅ No blocked tickets - all Wave tickets completed successfully!
{{/if}}

---

## 🎯 Next Session Context

### {{next_wave}}: {{next_wave_name}}
- **Epic**: {{next_epic}}
- **Tickets**: {{next_wave_tickets}}
- **Estimated Tickets**: {{next_wave_total}}
- **Prerequisites**:
  {{#each next_wave_prerequisites}}
  - {{this}}
  {{/each}}
- **First Ticket to Execute**: {{next_wave_first_ticket}}
- **Dependencies Ready**: {{next_wave_dependencies_ready}}

### {{next_next_wave}} (If exists)
- **Epic**: {{next_next_epic}}
- **Status**: Waiting for {{next_wave}} completion

---

## 🔧 Environment State

### Running Services
```
{{#each running_services}}
- {{name}}: {{status}} (port: {{port}})
{{/each}}
```

### Installed Dependencies
```
{{#each installed_packages}}
- {{name}}@{{version}}
{{/each}}
```

### Environment Variables
```
{{#each set_env_vars}}
{{name}}={{value_masked}}
{{/each}}
```

### Database State
- **Database**: {{db_name}}
- **Host**: {{db_host}}
- **Last Migration**: {{last_migration}}
- **Tables Created**: {{table_count}}

---

## 📝 Commit History (This Session)

```
{{#each commits_this_session}}
{{hash}} - {{message}}
{{/each}}
```

---

## 🚀 Wave Execution Flow Reference

```
┌─────────────────────────────────────────────┐
│  User calls: /pm-executor                   │
├─────────────────────────────────────────────┤
│  1. Load current Wave from this file        │
│  2. Load Wave tickets from execution-plan   │
│  3. Execute all ready tickets in Wave       │
│  4. Update this file with completed tickets │
│  5. When all Wave tickets done:             │
│     → Auto-call: /pm-reviewer               │
│     → Wait for pm-reviewer completion       │
│     → Show message: "Call /pm-executor      │
│        for next Wave"                       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  User calls: /pm-executor (next Wave)       │
├─────────────────────────────────────────────┤
│  1. Load next Wave from this file           │
│  2. Retry any blocked tickets (if applicable)
│  3. Execute new Wave tickets                │
│  4. Repeat pm-reviewer cycle                │
└─────────────────────────────────────────────┘
```

---

## 📋 Notes & Issues

{{#if has_notes}}
{{#each notes}}
- {{note}} (Added: {{date}})
{{/each}}
{{/if}}

### Known Issues to Watch
{{#each known_issues}}
- {{issue}}: {{workaround}}
{{/each}}

### Performance Notes
- Average ticket completion time: {{avg_completion_time}} min
- Slowest ticket: {{slowest_ticket}} ({{slowest_time}} min)
- Most retries: {{most_retried_ticket}} ({{most_retries}} attempts)

---

## 🔐 Troubleshooting

If pm-executor encounters errors:

1. **Check this file** - see which Wave was being executed
2. **Check blocked tickets** - see if same error pattern
3. **Check CLAUDE.md** - see project-wide context notes
4. **Review latest commit** - see what was being implemented
5. **Check running services** - ensure dependencies still running

```bash
# Useful debugging commands
git log --oneline -10  # See recent commits
npm test               # Verify tests still pass
npm run build         # Check build status
docker ps             # Check running services
```

---

## ✅ Checklist for Manual Review

Before marking a Wave as complete:

- [ ] All ready tickets in Wave completed
- [ ] All tests passing (npm test)
- [ ] Build successful (npm run build)
- [ ] No lint errors (npm run lint)
- [ ] Progress file updated
- [ ] CLAUDE.md updated with learnings
- [ ] Git commits made
- [ ] pm-reviewer completed
- [ ] No blocked tickets OR blocked tickets documented with fix suggestions

---

**Generated by PM Executor (Autonomous Mode)**  
**Wave-by-Wave Execution Architecture**
