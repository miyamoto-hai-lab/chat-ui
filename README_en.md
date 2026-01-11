# <img src="https://github.com/miyamoto-hai-lab/chat-ui/blob/main/docs/icon.jpg?raw=true" height="50" style="vertical-align: bottom;"> Chat UI &nbsp; (<a href="README.md">日本語</a> | <b>English</b>)

[![Sample website is available on GitHub Pages](https://github.com/miyamoto-hai-lab/chat-ui/actions/workflows/nextjs.yml/badge.svg)](http://miyamoto-hai-lab.github.io/chat-ui/)

Chat UI is a configurable static web application for interacting with LLMs (Large Language Models). By simply editing the configuration file (`config.yaml`), you can flexibly customize API endpoints, models, UI behavior, authentication settings, and more. Built with Next.js, it can be built as a static site and easily deployed to GitHub Pages or any web server.

<p>
<img width="45%" alt="Chat UI Screenshot" src="https://github.com/user-attachments/assets/98095304-9971-45c8-8562-03679db7506a" />
<img width="45%" alt="Settings Screenshot" src="https://github.com/user-attachments/assets/5bb2a856-3280-4e5f-9f26-442312221a7e" />
</p>

## Features

*   **Fully Configurable**: Manage API connections, system prompts, UI display styles, and more with just `config.yaml`.
*   **Multi-Provider Support**: Supports major LLM providers such as OpenAI, Gemini, Anthropic, Grok, DeepSeek, and Ollama.
*   **Static Hosting**: Outputs static HTML/JS/CSS with `pnpm build`, allowing it to run without a backend server (Node.js, etc.).
*   **Authentication**: Built-in password authentication and external server authentication request capabilities.
*   **Flexible Use Cases**:
    *   Internal chatbots (fixed prompts/models)
    *   Crowdsourcing experiments (password authentication, log transmission)
    *   Demo exhibitions (turn limits, auto-reset)

## Usage

Simply install the necessary tools, edit the configuration file, build, and place it on a web server.

### 1. Prerequisites

*   Node.js (v20 or higher recommended)
*   pnpm (package manager)

### 2. Installation

Clone the repository and install dependencies.

```bash
git clone https://github.com/miyamoto-hai-lab/chat-ui.git
cd chat-ui
pnpm install
```

### 3. Configuration (`config.yaml`)

Edit `config.yaml` in the project root to configure the application's behavior. A default `config.yaml` is provided; please copy and edit it.

#### Key Settings

Here are the main sections and settings in `config.yaml`.

##### 1. App Basic Info (`app`)

| Parameter | Description | Example |
| :--- | :--- | :--- |
| `title` | Title displayed in the browser tab or header. | `"Experimental Chat"` |
| `description` | Description or instructions displayed on the screen (Markdown supported). | `"Note: ..."` |

##### 2. LLM Settings (`llm`)

Configure the AI model and connection settings. Values fixed here cannot be changed by the user in the UI.

| Parameter | Description | Options/Example |
| :--- | :--- | :--- |
| `provider` | API provider.<br>Select `openai` to use OpenAI-compatible APIs. | `openai`, `gemini`, `anthropic`, `grok`, `deepseek`, `local` (e.g. Ollama) |
| `endpoint_url` | API server URL.<br>For Ollama: `http://localhost:11434/v1` | `https://api.openai.com/v1` |
| `model` | Model name to use. | `gpt-4o`, `gemini-1.5-pro` |
| `api_key` | API key (if required for connection). | `sk-...` |
| `system_prompt` | System prompt defining the AI's role and behavior. | `"You are a helpful assistant..."` |
| `permissions` | Flags to allow or deny user configuration changes. | `allow_change_config: false` (Display only) |

> [!TIP]
> You can use the `file::` prefix to load values from external files (e.g., `prompts/system.txt`).  
> **Note**: `file::` is evaluated at **build time**, replacing the value with the file content (it becomes a fixed value at runtime).

##### 3. Chat Behavior (`chat`)

| Parameter | Description | Options/Example |
| :--- | :--- | :--- |
| `start_role` | Who starts the conversation.<br>`assistant`: A greeting is generated immediately upon opening.<br>`user`: The user initiates input. | `user`, `assistant` |
| `prefill_messages` | History of conversation to display initially. | List format (see comments in `config.yaml`) |
| `max_turns` | Maximum number of conversation turns (1 turn = user + AI). 0 for unlimited. | `10`, `0` |
| `on_limit_reached` | Action when the maximum turns are reached.<br>- `modal`: Shows a modal forcing reset/exit.<br>- `inline`: Shows an exit message at the end of chat.<br>- `none`: Disables input, no message. | `action: "modal"`<br>`auto_exit_delay_sec: 5` (Redirect after 5s) |

##### 4. UI Settings (`ui`)

| Parameter | Description | Options/Example |
| :--- | :--- | :--- |
| `styles.generation_style` | Display style during response generation.<br>- `streaming`: Real-time character streaming.<br>- `spinner`: Shows animated spinner until complete.<br>- `read`: Shows "Read" receipt instantly, then full text.<br>- `instant`: Shows nothing until complete, then full text. | `streaming`, `spinner`, `read`, `instant` |
| `styles.message_style` | Chat bubble style. | `bubble` (Messaging App), `flat` (ChatGPT-like) |
| `components.exit_button_visibility` | Rule for displaying the exit button.<br>- `always`: Always visible.<br>- `on_limit`: Visible only when limit reached.<br>- `never`: Never visible. | `always`, `on_limit`, `never` |
| `turn_counter.style` | Style of the turn counter.<br>- `hidden`: No counter.<br>- `fraction`: Show like "5 / 10".<br>- `custom`: Show like "5 / text". | `fraction`, `hidden`, `custom` |
| `theme` | Color theme settings. Choose a `base` theme and optionally override `colors`. | `base: "light"`, `base: "dark"`, `base: "system"`<br>`colors: { user_bubble: "#000000" }` |

##### 5. System Settings (`system`)

| Parameter | Description |
| :--- | :--- |
| `security.password_auth_enabled` | If `true`, requires password entry upon start. |
| `logging` | Configure to send chat/operation logs to an external server. |
| `heartbeat` | Configure to send periodic heartbeat requests during app usage. |

#### Advanced Specifications

##### Placeholders (Runtime Evaluation)

You can use placeholders in the format `${variable_name}` in certain settings (like URLs or request bodies). These are evaluated and replaced **at runtime (in the browser)**.

*   **URL Query Parameters**: Any query parameter in the current URL can be used as a variable.
    *   Example: Accessing `http://.../?id=123` will replace `${id}` with `123`.
*   **Special Variables**:
    *   `${PASSWORD}`: Replaced with the password used for authentication.

**Transformation Options**:
Prefixing the variable name enables value transformation.
*   `${#key}` or `${e#key}`: Base64 encode
*   `${u#key}`: URL-Safe Base64 encode
*   `${d#key}`: Base64 decode

##### Password Authentication & Auto-Login

When `system.security.password_auth_enabled: true`, the app requires a password on startup.

*   **Auto-Login**: You can skip the password entry screen by providing a **Base64 encoded password** in the `p` URL query parameter.
    *   Example: `http://localhost:3000/?p=cGFzc3dvcmQ=` (password="password")
*   **Persistence**: The entered password and any user-changed settings (like API keys) are saved in the browser's `localStorage` and persist across sessions.

##### Logging (`logging`)

Sends log data via a **POST request** to the `endpoint_url` whenever events specified in `target_events` (e.g., `CHAT_MESSAGE`) occur.
The request format is fixed.

**Headers:**
If `system.security.password_auth_enabled: true`, an `Authorization` header is included.

*   `Content-Type`: `application/json`
*   `Authorization`: `Bearer <Base64 Encoded Password>` (Only when password auth is enabled)

**Body (JSON):**

```json
{
  "eventType": "CHAT_MESSAGE",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "data": { ... },
  "parameters": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

*   `eventType`: Type of event (`KEY_INPUT` or `CHAT_MESSAGE`)
*   `timestamp`: ISO 8601 timestamp
*   `data`: Event specific data
*   `parameters`: URL query parameters from the browser (all parameters are included here)

##### Heartbeat (`heartbeat`) & Auth Request (`auth_request`)

These features allow flexible request configuration. Placeholders are supported in the URL, Headers, and Body.

```yaml
url: "https://api.example.com/heartbeat"
method: "POST"
headers:
  "Content-Type": "application/json"
  "Authorization": "Bearer ${PASSWORD}" # Use password as token
body: '{"status": "alive", "user": "${id}"}' # Write as JSON string
```

*   **Heartbeat**: Sends requests continuously at intervals specified by `interval_sec`.

### 4. Customization

#### changing Avatar Images

You can override the default avatar icons by placing image files with specific names in the `public` directory.

*   **User Avatar**: `user_avatar.png` (or `jpg`, `svg`, `gif`, `webp`, etc.)
*   **Assistant Avatar**: `assistant_avatar.png` (or `jpg`, `svg`, `gif`, `webp`, etc.)

These are automatically detected and applied at build time. If files do not exist, default icons are used.

#### Changing Base Path

If hosting in a subdirectory (e.g., `https://example.com/chat/`), set `base_path` in `config.yaml`.

```yaml
base_path: "/chat"
```

### 5. Development & Preview

To verify operation locally:

```bash
pnpm dev
```

Access `http://localhost:3000` in your browser.

### 6. Build

Generate static files for production.

```bash
pnpm build
```

When the build is complete, static files will be output to the `out` directory.

### 7. Deployment

Upload the contents of the `out` directory to your web server's document root (e.g., `public_html`, `www`). It runs on GitHub Pages, Vercel, Netlify, Amazon S3, or standard web servers (Apache/Nginx).

## Tech Stack & Contributing

For technical details and information on how to contribute, please see [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT License](LICENSE)
