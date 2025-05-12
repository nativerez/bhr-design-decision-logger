# Design Decision Logger for Figma

A plugin that allows designers to log, track and share design decisions within Figma.

## Features

### Core Features (Implemented)
- **Record Design Decisions**: Capture title, rationale, and context for design decisions
- **Timestamp & Author Tracking**: Automatic logging of when and by whom decisions are made
- **View Decision History**: Chronological listing of all recorded decisions
- **Link to Artifacts**: Attach URLs to external resources like Jira tickets, research docs, etc.
- **Pros & Cons Documentation**: Structured way to compare multiple approaches
- **Categorization**: Tag decisions with categories for better organization
- **Edit/Delete Capabilities**: Update or remove decisions as needed

### Coming Soon
- **Search & Filtering**: Find decisions by keyword, tag, or person
- **Version Timeline View**: Visual representation of decisions over time
- **Export Functionality**: Export to CSV, markdown, or Confluence
- **Team Sharing**: Share decisions across users working on the same file
- **Slack/Teams Integration**: Send notifications when new decisions are logged

## Usage

1. Open a Figma file
2. Run the Design Decision Logger plugin
3. Click on "New Decision" tab
4. Fill out the decision details:
   - Title
   - Context
   - Rationale
   - Links (optional)
   - Pros & Cons (optional)
   - Tags (optional)
5. Click "Save Decision"

Decisions are stored locally using Figma's client storage and will persist across design sessions.

## Development

This plugin is built using:
- TypeScript
- Figma Plugin API
- HTML/CSS for the UI

To build the plugin:
```
npm install
npx tsc
```

## Planned Confluence Integration

The next major feature will be integration with Atlassian Confluence:

1. **Authentication**: Connect to your Confluence workspace via OAuth
2. **Space Selection**: Choose which Confluence space to publish decisions to
3. **Auto-publishing**: Automatically create or update a Confluence page when a decision is logged
4. **Page Templates**: Custom templates for how decisions appear in Confluence
5. **Two-way Sync**: Changes in Confluence can be reflected back in the plugin

This will allow design decisions to be visible to the broader team and become part of the project documentation.

## Team Collaboration

Future versions will support:
- Shared decision history across team members
- Comments and reactions on decisions
- Notifications when decisions relevant to your work are made
- Integration with design system versioning

## License

Copyright © 2025. All rights reserved.
