# Design Decision Logger for Figma

A plugin that allows designers to log, track and share design decisions within Figma.

## Features

### Core Features (Implemented)
- **Record Design Decisions**: Capture title, rationale, and context for design decisions
- **Timestamp & Author Tracking**: Automatic logging of when and by whom decisions are made
- **View Decision History**: Chronological listing of all recorded decisions
- **Link to Artifacts**: Attach URLs to external resources like Jira tickets, research docs, etc.
- **Link to Figma Elements**: Generate proper links to Figma elements using the format: `https://www.figma.com/design/[documentId]/[fileName]?node-id=[nodeId]`
- **Pros & Cons Documentation**: Structured way to compare multiple approaches
- **Categorization**: Tag decisions with categories for better organization
- **Edit/Delete Capabilities**: Update or remove decisions as needed
- **Export Functionality**: Export decisions to Markdown format (copy or download)
- **Search & Filtering**: Find decisions by keyword, tag, or status

### Coming Soon
- **Version Timeline View**: Visual representation of decisions over time
- **Export to Confluence**: Direct integration with Confluence for team documentation
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

1. Node Selection Tracking:
The plugin now monitors which Figma element is currently selected
When you select an element in Figma, its information is automatically captured

2. Decision Creation with Node Context:

When creating a new decision, the UI now shows which Figma element is linked
The selected element's name is displayed in a blue tag
This information is stored with the decision

3. Figma Element Section in Form:

Added a new section to display the currently selected element
If no element is selected, a helpful message guides you to select one first

4. Decision Cards with Element Links:

Each decision card now displays the linked element as a clickable tag
Clicking on this tag will navigate to that element in your Figma file

5. Navigation Feature:

Added functionality to navigate directly to a linked element
When viewing decision details or clicking the element tag, the plugin will:
Select the element in Figma
Scroll and zoom to its position

6. Export as Markdown:

Added ability to export decisions as Markdown format
Two options available:
- Copy to clipboard: Quickly copy all decisions as formatted Markdown
- Download as file: Save a Markdown file with all decisions documented
All current filters are respected during export (search terms, tags, status)
Decision titles and linked elements include Figma web links that open directly in a browser
Links use the format: https://www.figma.com/design/[documentId]/[fileName]?node-id=[nodeId]
File names are properly formatted (spaces converted to dashes) and document IDs are automatically captured
URLs are automatically validated and formatted to ensure proper links in the markdown output

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

## Changelog

### v1.1.0 - May 30, 2025
- **Fixed**: Document ID issue where links were using "0:0" instead of the actual file key
- **Improved**: URL format now properly includes file name in the Figma element links
- **Enhanced**: Better handling of file name formatting in URLs (spaces converted to dashes)

## License

Copyright © BrightHR 2025. All rights reserved.
