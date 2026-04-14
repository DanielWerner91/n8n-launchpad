# Phase 0: Idea

> Pipeline stage: idea
> Prerequisites: none
> Skills: none
> Estimated items: 6 checklist items

## Overview

Capture and validate the idea before investing any build time. The goal is to answer: "Is this worth building?" and "What exactly are we building?" Exit this phase with a clear problem statement, target user, app name, and a scoped MVP feature list.

## Checklist Items

### [validation] Problem statement defined
**Approach:** Write a 1-2 sentence problem statement in the format: "[Target user] struggles with [problem] because [reason]. [App name] solves this by [solution]." Store this in the project description field in LaunchPad.
**Skill:** null
**Done when:** Project description contains a clear problem statement that identifies the user, problem, and solution.
**References:** []
**Depends on:** nothing

### [validation] Target user identified
**Approach:** Define who this app is for. Be specific: "freelance developers" not "people." Document: who they are, where they hang out online, what tools they currently use, and why they'd switch. Add as a comment on the LaunchPad project.
**Skill:** null
**Done when:** A comment exists on the project describing the target user persona with specifics (role, current tools, pain points).
**References:** []
**Depends on:** Problem statement defined

### [validation] App name and slug decided
**Approach:** Choose a name that is: short (1-2 words ideal), memorable, available as a GitHub repo name, and works as a slug. Check GitHub for name conflicts: `gh repo view {{github_username}}/<name> 2>&1`. The slug will be used for the folder name, repo name, and Vercel project.
**Skill:** null
**Done when:** Name is chosen, slug is set on the LaunchPad project, and no GitHub repo name conflict exists.
**References:** []
**Depends on:** Problem statement defined

### [validation] Domain availability checked
**Approach:** Check domain availability. Prefer `.com`, `.app`, `.dev`, or `.io`. For procure.blog ecosystem apps, subdomains like `tool.procure.blog` work too. Use a registrar (Namecheap, Hostinger) to check. Don't purchase yet if the project hasn't been validated.
**Skill:** null
**Done when:** Domain candidate is identified and recorded in project links or comments. Purchase can wait until build phase.
**References:** []
**Depends on:** App name and slug decided

### [validation] Competitive landscape reviewed
**Approach:** Search for 3-5 existing solutions to the same problem. For each, note: name, URL, pricing, strengths, weaknesses, and what our app will do differently. Web search for "[problem] tool" or "[problem] app." Add findings as a project comment.
**Skill:** null
**Done when:** A comment exists listing at least 3 competitors with our differentiator clearly stated.
**References:** []
**Depends on:** Problem statement defined

### [validation] MVP feature list scoped
**Approach:** List the 3-5 core features for v1. Each feature should be one sentence. Apply the rule: "What is the minimum set of features that solves the core problem?" Resist adding "nice-to-have" features. Everything else goes on a "v2 ideas" list. Add as a project comment.
**Skill:** null
**Done when:** A comment exists with a numbered list of 3-5 MVP features and a separate "future ideas" section.
**References:** []
**Depends on:** Problem statement defined, Competitive landscape reviewed

## Decision Points

- Is this problem worth solving? (If no clear differentiator from competitors, reconsider)
- Should this be a standalone app or a feature of an existing app?
- Is there a revenue model? (SaaS, content, client project)

## Common Pitfalls

- **Scope creep at the idea stage.** The MVP list should be brutally short. If you have more than 5 features, you're building too much.
- **Falling in love with the name.** Don't spend days finding the perfect name. Pick something good enough and move on.
- **Skipping competitive research.** You need to know what exists to build something better.
