# IT Support Chatbot for Microsoft Teams

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Node.js](https://img.shields.io/badge/Node.js-22.x-green)
![Microsoft Teams](https://img.shields.io/badge/Microsoft%20Teams-Chatbot-purple)
![Status](https://img.shields.io/badge/Status-MVP%20Complete-brightgreen)

A TypeScript-based IT support chatbot that helps users find approved solutions
to common support questions.

The current MVP runs locally and can be tested with Microsoft 365 Agents
Playground without connecting the chatbot to a company Microsoft Teams
environment.

The project demonstrates an incremental approach to building an IT support
chatbot using structured support data, semantic matching, conversation state,
and Microsoft 365 Agents Playground for local testing.

## MVP Features

The chatbot currently supports:

- Keyword and phrase matching
- Semantic matching using:
  - Intent
  - Object
  - Context
  - State
- Weighted topic scoring
- Ranking of support topics
- Ambiguous-question detection
- Clarification requests when more information is needed
- First-miss and second-miss handling
- Rephrasing of unresolved questions
- Submission of unresolved problems for IT review
- "Was this helpful?" feedback flow
- Separate storage of unresolved problems

User-submitted unresolved problems are never automatically added to trusted support knowledge.

## How Matching Works

The chatbot analyzes a user's question before selecting a support topic.

```text
User Question
      ↓
Normalize Input
      ↓
Detect Semantics
      ↓
Intent / Object / Context / State
      ↓
Score Support Topics
      ↓
Rank Best Matches
      ↓
FOUND / AMBIGUOUS / NOT_FOUND
```

Support topics are scored using keyword matches, phrase matches, and semantic matches.

If the chatbot finds a clear match, it returns the approved solution.

If multiple topics are plausible but distinguishing information is missing, the chatbot asks the user for more detail rather than guessing.

## Unresolved Questions

If no solution is found:

```text
First unsuccessful search
        ↓
Ask user to rephrase
        ↓
Second unsuccessful search
        ↓
Offer to submit problem for IT review
```

Submitted problems are stored separately from approved support content.

Runtime unresolved-problem data is excluded from Git and should not be committed to the repository.

## Feedback Flow

After providing a solution, the chatbot asks:

```text
Was this helpful?
```

If the user answers yes, the conversation state is reset.

If the user answers no, the chatbot asks the user to describe the problem another way and searches again.

## Project Structure

```text
IT-Support-Chatbot/
├── data/
│   ├── support/
│   │   └── support-data.json
│   ├── semantics/
│   │   ├── intents.json
│   │   ├── objects.json
│   │   ├── contexts.json
│   │   └── states.json
│   └── unresolved/
│       └── runtime data - ignored by Git
│
├── src/
│   ├── index.ts
│   ├── matching/
│   │   └── supportMatcher.ts
│   └── models/
│       ├── SupportTopic.ts
│       └── SemanticGroup.ts
│
└── README.md
```

## Local Development

Install the project dependencies:

```bash
npm install
```

Start the chatbot:

```bash
npm run dev
```

The local bot listens on port `3978` unless another port is configured.

In a second terminal, start Microsoft 365 Agents Playground:

```bash
agentsplayground -e http://localhost:3978/api/messages -c emulator
```

The chatbot can then be tested through the local Teams-style interface.

## Microsoft 365 Agents Playground

Microsoft 365 Agents Playground provides a local environment for testing the chatbot before connecting it to an organization's Microsoft Teams environment.

This is useful when a developer does not currently have access to the company's Teams environment.

The local MVP does not require the chatbot to be deployed into the company's Microsoft Teams tenant.

## Example Tests

### Clear Match

```text
Create an email signature in Outlook.
```

Expected result:

```text
FOUND
```

The chatbot returns the Outlook email-signature solution.

### Another Clear Match

```text
Forward a document from an Outlook email.
```

Expected result:

```text
FOUND
```

The chatbot returns the document-forwarding solution.

### Ambiguous Question

```text
How do I add something to my Outlook email before I send it?
```

Expected result:

```text
AMBIGUOUS
```

The chatbot asks the user for additional information rather than guessing.

### Unsupported Question

An unsupported question results in a request to rephrase.

If the rephrased question is also unresolved, the chatbot offers to submit the problem for IT review.

## Support Knowledge

Approved support topics are stored in:

```text
data/support/support-data.json
```

Semantic vocabulary is maintained separately in:

```text
data/semantics/
```

This separates approved support solutions from the language used by the matcher to understand user questions.

Unresolved user submissions are stored separately and must be reviewed before any information is added to approved support knowledge.

## Security

The local development configuration currently uses:

```ts
dangerouslyAllowUnauthenticatedRequests: true;
```

This setting is used only for local development with Agents Playground.

It must not be used for a production Microsoft Teams deployment.

Additional authentication, authorization, data protection, input validation, logging, auditing, secrets management, and other security controls will be addressed as the project moves beyond the local MVP.

## Current MVP Scope

The current milestone focuses on proving the chatbot's core support workflow locally.

The following are intentionally outside the current MVP:

- Production Microsoft Teams deployment
- Microsoft Teams organizational authentication
- Pub/sub messaging
- Automated weekly unresolved-problem processing
- IT department notifications
- Database-backed support knowledge
- SharePoint or standalone web interface
- Support-topic maintenance tools
- Production monitoring and observability

These capabilities are planned as future architecture rather than being partially implemented in the MVP.

## Future Direction

The project is designed around the idea of one support engine serving multiple interfaces.

```text
                 Microsoft Teams
                       ↓
User ───────→ Support Engine ←─────── Web / SharePoint
                       ↓
               Support Knowledge
                       ↓
              Unresolved Problems
```

Future versions can add Microsoft Teams integration, human review workflows, pub/sub notifications, database storage, a browser interface, and additional support topics without replacing the core matching engine.
