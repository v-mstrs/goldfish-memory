## Goldfish Memory Privacy Policy

Goldfish Memory stores and transmits only the information needed to provide its character-highlighting features.

### What the extension stores locally

- The selected active novel slug
- Draft character form data
- Display settings such as underline and text style
- The configured backend API base URL

### What the extension sends to the backend API

When you use the extension with a backend API, it sends:

- Requests for the selected novel and its saved characters
- Character data that you create or update, such as names, aliases, descriptions, image URLs, and highlight colors
- Selected page text only when you explicitly use the context menu or inline modal flow to add a character from highlighted text

### What the extension does not do

- It does not include analytics or advertising trackers
- It does not sell personal data
- It does not load remote code for execution
- It does not transmit page content unless you intentionally trigger a character-add flow that uses selected text

### Third-party services

Goldfish Memory connects only to the backend API URL configured by the user. By default this is a local server at `http://127.0.0.1:8000`.

If you point the extension to a remote server, any data sent to that server is governed by the operator of that server.