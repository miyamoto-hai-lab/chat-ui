<h1><img src="https://github.com/kei-mag/human-chat-completions/blob/main/docs/icon.jpg?raw=true" height="50" style="vertical-align: bottom;"> Chat UI <div style="text-align: right;">(<a href="README.md">日本語</a> | <b><u>English</u></b>)</div></h1>
<p>
<img width="45%" alt="Chat Page" src="https://github.com/user-attachments/assets/98095304-9971-45c8-8562-03679db7506a" />
<img width="45%" alt="Settings Page" src="https://github.com/user-attachments/assets/5bb2a856-3280-4e5f-9f26-442312221a7e" />
</p>
[![Sample website is available on GitHub Pages](https://github.com/miyamoto-hai-lab/chat-ui/actions/workflows/nextjs.yml/badge.svg)](http://miyamoto-hai-lab.github.io/chat-ui/)

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

1.  Push the repository to GitHub.  
2.  Import and deploy the repository from your Vercel or Netlify dashboard.

## **Configuration**

You can customize the application behavior by creating a `.env.local` file or setting environment variables.

### **Basic Usage**

*   **File Loading:** You can load the content of a file as a value by prefixing the value with `file::` (e.g., `NEXT_PUBLIC_LLM_SYSTEM_PROMPT=file::prompts/system.txt`).
*   **Boolean Values:** In addition to `true`/`false`, you can use `yes`/`no`, `on`/`off`, `enable`/`disable` (case-insensitive).

### **LLM Settings**

Use these variables to fix the API endpoint, model, API key, etc.
When these values are set, the corresponding settings in the UI will be hidden, and users will not be able to change them.
Conversely, if you want to allow users to configure them freely, leave these variables empty (or undefined).

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_LLM_API_PROVIDER` | API Provider (`openai`, `gemini`, `anthropic`, `grok`, `deepseek`). |
| `NEXT_PUBLIC_LLM_API_ENDPOINT` | API Server URL (e.g., `https://api.openai.com/v1`). |
| `NEXT_PUBLIC_LLM_MODEL` | Model name (e.g., `gpt-4o`). |
| `NEXT_PUBLIC_LLM_API_KEY` | API Key. |
| `NEXT_PUBLIC_LLM_SYSTEM_PROMPT` | System Prompt. Newlines (`\n`) are supported. |
| `NEXT_PUBLIC_LLM_SHOW_THINKING` | Thinking process display setting. `true` to show, `false` to hide. If set, the toggle switch in the UI will be hidden. |

### **Feature Toggles**

Enable or disable specific features.

| Variable | Default | Description |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_ALLOW_IMPORT` | `true` | Enable chat history import feature. |
| `NEXT_PUBLIC_ALLOW_EXPORT` | `true` | Enable chat history export feature. |

### **Chat Behavior Control**

| Variable | Default | Description |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_STARTING_ROLE` | `assistant` | The first speaker. `user` or `assistant`. |
| `NEXT_PUBLIC_MAX_CHAT_TURNS` | `0` | Maximum number of chat turns. `0` for unlimited. |
| `NEXT_PUBLIC_ON_MAX_CHAT_TURNS` | `nothing` | Behavior when max turns reached.<br>`exit`: End chat and redirect to specified URL.<br>`message`: Show completion message.<br>`nothing`: Just disable input. |
| `NEXT_PUBLIC_ALLOW_USER_EXIT` | `always` | "End Chat" button visibility.<br>`always`: Always visible.<br>`max`: Visible only when max turns reached.<br>`never`: Never visible. |
| `NEXT_PUBLIC_DISPLAY_CHAT_TURNS` | `OFF` | Turn count display.<br>`OFF`: Hidden.<br>`MAX`: `n / N` format.<br>Any string: `n / String` format. |

### **Response & Display Settings**

| Variable | Default | Description |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_ASSISTANT_PROCESSING_STYLE` | `streaming` | Response generation display.<br>`streaming`: Real-time streaming.<br>`spinner`: Show spinner until complete.<br>`read`: Show "Read" mark until complete.<br>`instant`: Show nothing until complete. |
| `NEXT_PUBLIC_ASSISTANT_RESPONSE_STYLE` | `bubble` | Response message style.<br>`bubble`: Bubble style.<br>`flat`: Flat style (for future use). |

### **Misc & Experimental**

| Variable | Default | Description |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_AUTH_PASSWORD` | - | If set, requires password authentication before use. |
| `NEXT_PUBLIC_ENABLED_EVENTS` | - | Events to log (comma separated). e.g., `KEY_INPUT,CHAT_MESSAGE` |
| `NEXT_PUBLIC_EVENT_ENDPOINT_URL` | - | API endpoint URL for event logging. |
| `NEXT_PUBLIC_APP_TITLE` | `Chat UI` | Application title. |
| `NEXT_PUBLIC_APP_DESCRIPTION` | - | Application description (HTML supported). |
| `NEXT_PUBLIC_REDIRECT_URL_ON_EXIT` | - | URL to redirect when exiting. |
| `NEXT_PUBLIC_EXPORT_FILENAME_STRATEGY` | `chat_{YYYYMMDDHHmmss}.json` | Export filename format. |
| `NEXT_PUBLIC_ASSISTANT_DISPLAY_NAME` | `Assistant` | Assistant display name. |
