# Chat UI (<u>**English**</u> | [Japanese](README_ja.md))

**A simple front-end application for interacting with dialogue systems, such as LLMs.**

You can freely configure the API server URL, API key, and system prompt from the UI.

By setting environment variables at build time, you can customize the application's behavior for various use cases, such as:

* Requiring password authentication for participants in crowdsourcing experiments.  
* Fixing the API server URL and system prompt for internal company use.  
* Setting a limit on the number of conversation turns for demos.

It features options for LLM response display methods (streaming, instant, etc.), chat history export, and supports flexible deployment from static hosting (like PHP servers) to Vercel.

## **Features**

* **Dynamic UI Configuration:**  
  * "API Server URL" to connect to.  
  * "System Prompt" to define the LLM's behavior.  
  * "API Key" required for authentication.

All of these can be dynamically changed from the web UI's settings screen.

* **Settings Persistence:** Settings are securely saved in the browser's localStorage, eliminating the need to re-enter them every time.  
* **Flexible Response Display:**  
  * You can choose from four different display methods for LLM responses via the build-time setting (NEXT_PUBLIC_ASSISTANT_RESPONSE_MODE):  
    1. **Streaming:** Displays the AI's response in real-time.  
    2. **Spinner:** Shows a spinner during generation, then displays the full response at once.  
    3. **Read Mark:** Shows a static "read" mark during generation, then displays the full response.  
    4. **Instant:** Displays no indicator during generation and shows the full response upon completion.  
* **History Export:** Easily download the current conversation history as a JSON file.  
* **Build-Time Customization:**  
  * By setting environment variables at build time, you can control whether end-users can "set the API server" or "set the system prompt."  
  * Allows for use-case-specific customizations, such as limiting conversation turns or adding an exit button to a specific URL.  
* **Flexible Deployment:**  
  * **Static Hosting:** Can be built with output: 'export'. Works in any static hosting environment, such as PHP servers or GitHub Pages.  
  * **Hybrid:** Can also be deployed to Next.js-compatible platforms like Vercel and Netlify.

## **Tech Stack**

This project is built with the following modern front-end technologies:

* **Framework:** [Next.js](https://nextjs.org/) (App Router)  
* **UI Library:** [React](https://react.dev/)  
* **UI Components:** [shadcn/ui](https://ui.shadcn.com/) \- A stylish and accessible UI component library.  
* **LLM UI/State:** [Vercel AI SDK](https://sdk.vercel.ai/) (useChat hook)  
* **Compiler:** [React Compiler](https://react.dev/learn/react-compiler) (Experimental)  
* **Build Tool:** [Turbopack](https://turbo.build/pack)  
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)  
* **Linter / Formatter:** [Biome](https://biomejs.dev/)

## **Usage & Deployment**

There are two deployment options depending on your environment.

### **Option 1: Static Hosting (PHP Server, GitHub Pages, etc.)**

This is the standard method for environments where a Node.js server cannot be used.

1. Configure next.config.ts:  
   ```typescript
   Add output: 'export'.  
   /\*\* @type {import('next').NextConfig} \*/  
   const nextConfig \= {  
     output: 'export', // Add this line  
   };  
   export default nextConfig;
   ```

2. Build:  
   As needed, set the environment variables described in "Build-Time Customization" below, then run the build command.  
   ```shell
   # Install dependencies  
   pnpm install

   # Build static files  
   pnpm build
   ```

   Once the build is complete, an `out/` directory will be generated.  
3. Deploy:  
   Upload the entire contents of the `out/` directory to your web server's public directory (public_html, www, etc.).

### **Option 2: Next.js Hosting (Vercel, Netlify, etc.)**

When deploying to platforms like Vercel, the output: 'export' setting is not required. Environment variables should be set from each platform's dashboard.

1. Push the repository to GitHub.  
2. Import and deploy the repository from your Vercel or Netlify dashboard.

## **Build-Time Customization (Environment Variables)**

You can control the app's features by creating a .env.local file or by specifying environment variables when running the build command.

### **UI Setting Control**

| Variable | Default | Description |
| :---- | :----: | :---- |
| NEXT_PUBLIC_ALLOW_USER_API_SERVER | "true" | If false, hides the UI for setting the API server URL and API key. |
| NEXT_PUBLIC_ALLOW_USER_SYSTEM_PROMPT | "true" | If false, hides the UI for setting the system prompt. |
| NEXT_PUBLIC_ALLOW_EXPORT | "true" | If false, hides the conversation history export button. |
| NEXT_PUBLIC_ALLOW_USER_SHOW_THINKING | "true" | If false, hides the UI (e.g., checkbox) that allows the user to toggle the "Show Thinking" (intermediate steps) setting. |
| NEXT_PUBLIC_ENABLE_PASSWORD_AUTH | "false" | If true, requires a simple password input before using the UI. The entered password is sent as a chatui-password: \<password\> header to the API server. (For access control in research, etc.) |

### **Default and Fixed Values**

| Variable | Default | Description |
| :---- | :----: | :---- |
| NEXT_PUBLIC_DEFAULT_API_SERVER | "" | The fixed API server URL to be used when ALLOW_USER_API_SERVER=false. |
| NEXT_PUBLIC_DEFAULT_API_KEY | "" | The fixed API key to be used when ALLOW_USER_API_SERVER=false. |
| NEXT_PUBLIC_SYSTEM_PROMPT | "" | The default system prompt. Used as a fixed value if ALLOW_USER_SYSTEM_PROMPT=false, or as a user-changeable initial value if true. |

### **Chat Behavior Control**

| Variable | Default | Description |
| :---- | :----: | :---- |
| NEXT_PUBLIC_STARTING_ROLE | "assistant" | The first speaker in the chat. Specify "user" (user types first) or "assistant" (AI speaks first). |
| NEXT_PUBLIC_MAX_CHAT_TURNS | 0 | Maximum number of conversation turns (one user \+ one assistant reply). 0 means unlimited. Input is disabled upon reaching this limit. |
| NEXT_PUBLIC_DISPLAY_CHAT_TURNS | "OFF" | How to display chat turns. "OFF": Does not display turns. "MAX": Displays as n / N (N is the value of MAX_CHAT_TURNS). If N=0, displays n only. {Any String}: Displays as n / {Specified String} (e.g., NEXT_PUBLIC_DISPLAY_CHAT_TURNS="Approx. 10"). |
| NEXT_PUBLIC_ASSISTANT_RESPONSE_MODE | "streaming" | How assistant (LLM) responses are displayed. "streaming": Sequential display (default). "spinner": Shows a loading spinner during generation, then displays all at once. "read": Shows a static "read" mark (no spinner), then displays all at once. "instant": Shows no indicator during generation and displays all at once upon completion. |

### Research  Settings
| Variable | Default | Description |
| :---- | :----: | :---- |
| NEXT_PUBLIC_ENABLE_PASSWORD_AUTH | `false` | If `true`, requires a simple password input before using the UI. The entered password is sent as a `chatui-password: <password>` header to the API server.
| NEXT_PUBLIC_ENABLED_EVENTS | `""` | Specifies events to send as logs, comma-separated (e.g., `"KEY_INPUT,CHAT_MESSAGE"`). Default is empty (nothing sent).<br>**"KEY_INPUT"**: Sends the content and timestamp whenever the input field changes (onChange).<br>**"CHAT_MESSAGE"**: Sends the content and timestamp when a user or assistant sends a message.
| NEXT_PUBLIC_EVENT_ENDPOINT_URL | `""` | The API endpoint URL where the event data specified by ENABLED_EVENTS will be sent.

### **UI & Others**

| Variable | Default | Description |
| :---- | :----: | :---- |
| NEXT_PUBLIC_APP_TITLE | "Chat UI" | The title displayed in the app header and browser tab. |
| NEXT_PUBLIC_APP_DESCRIPTION | "" | A description displayed at the top of the chat UI (e.g., below the header). **HTML tags can be used.** (e.g., `"\<h1\>Situation\</h1\>\<p\>The user and assistant..."`) |
| NEXT_PUBLIC_REDIRECT_URL_ON_EXIT | "" | If a URL is specified (e.g., https://example.com), an "Exit" button linking to it will be displayed in the header. Hidden if empty. |
| NEXT_PUBLIC_EXPORT_FILENAME_STRATEGY | "chat_{YYYYMMDDHHmmss}.json" | Filename for chat export. Placeholders: {YYYYMMDDHHmmss}: Current timestamp {FIRST_PROMPT}: First user prompt (e.g., first 30 chars) |
| NEXT_PUBLIC_ASSISTANT_DISPLAY_NAME | "Assistant" | The display name for the assistant (LLM) speaker in the chat UI. |

