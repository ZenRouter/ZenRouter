# Cursor Integration

Integrate ZenRoute with Cursor IDE to route your AI requests through ZenRoute's intelligent routing system.

## Prerequisites

- Cursor IDE installed
- Cursor Pro account (required for custom API endpoints)
- ZenRoute cloud endpoint configured
- API key from ZenRoute dashboard

## ⚠️ Important Notes

> **Cloud Endpoint Required**: Cursor routes requests through its own server and does not support localhost endpoints. You must use the ZenRoute cloud endpoint: `https://zenroute.dev`

> **Cursor Pro Required**: This feature requires a Cursor Pro account to use custom API endpoints.

## Setup

### 1. Open Cursor Settings

1. Open Cursor IDE
2. Go to **Settings** (Cmd/Ctrl + ,)
3. Navigate to **Models** section

### 2. Enable OpenAI API

1. Find the **OpenAI API key** option
2. Enable the toggle to activate custom API configuration

### 3. Configure Base URL

Set the base URL to ZenRoute cloud endpoint:

```
https://zenroute.dev
```

**Steps:**
1. In the Models settings, locate the **Base URL** field
2. Enter: `https://zenroute.dev`
3. Click **Save**

### 4. Add API Key

1. In the **API Key** field, enter your ZenRoute API key
2. You can find your API key in the ZenRoute dashboard under **Settings → API Keys**
3. Click **Save**

### 5. Add Custom Model

1. Click **View All Models** button
2. Click **Add Custom Model**
3. Enter the model name from your ZenRoute configuration (e.g., `gpt-4`, `claude-opus-4-5`, etc.)
4. Click **Add**

### 6. Select Model

1. In the Cursor chat interface, click the model selector dropdown
2. Choose your custom model from the list
3. Start using ZenRoute with Cursor!

## Configuration Example

Your Cursor settings should look like this:

```
OpenAI API: ✓ Enabled
Base URL: https://zenroute.dev
API Key: sk-zenroute-xxxxxxxxxxxxx
Custom Models: gpt-4, claude-opus-4-5, gemini-2.0-flash
```

## Available Models

You can use any model configured in your ZenRoute dashboard. Common examples:

| Model Name | Provider | Description |
|------------|----------|-------------|
| `gpt-4` | OpenAI | GPT-4 Turbo |
| `gpt-4o` | OpenAI | GPT-4 Optimized |
| `claude-opus-4-5` | Anthropic | Claude Opus 4.5 |
| `claude-sonnet-4-5` | Anthropic | Claude Sonnet 4.5 |
| `gemini-2.0-flash` | Google | Gemini 2.0 Flash |

## Usage

### Chat Interface

1. Open Cursor chat (Cmd/Ctrl + L)
2. Select your model from the dropdown
3. Start chatting with AI through ZenRoute

### Inline Code Generation

1. Select code in your editor
2. Press Cmd/Ctrl + K
3. Enter your prompt
4. Cursor will use ZenRoute to generate code

### Code Explanation

1. Select code in your editor
2. Press Cmd/Ctrl + L
3. Ask "Explain this code"
4. Get AI-powered explanations through ZenRoute

## Troubleshooting

### "Invalid API Key" Error

1. Verify your API key in ZenRoute dashboard
2. Make sure you copied the entire key including the `sk-zenroute-` prefix
3. Check that the API key has not expired
4. Try regenerating a new API key

### "Model Not Found" Error

1. Verify the model name matches exactly with your ZenRoute configuration
2. Check that the provider connection is active in ZenRoute dashboard
3. Ensure the model is available in your connected providers
4. Try using the full model name (e.g., `openai/gpt-4` instead of `gpt-4`)

### Connection Issues

1. Verify you are using the cloud endpoint: `https://zenroute.dev`
2. Check your internet connection
3. Ensure ZenRoute cloud service is operational
4. Try disabling VPN or proxy if enabled

### Localhost Not Working

> **Remember**: Cursor does not support localhost endpoints. You must use the cloud endpoint `https://zenroute.dev`. If you need to use a local ZenRoute instance, consider using a tunneling service like ngrok to expose your local endpoint.

## Cloud Endpoint Setup

If you're running ZenRoute locally and want to use it with Cursor:

1. Enable cloud endpoint in ZenRoute settings
2. Configure your cloud endpoint URL in ZenRoute dashboard
3. Use the cloud URL in Cursor settings
4. Ensure your local ZenRoute instance is accessible from the internet

## Best Practices

1. **Use Model Aliases**: Create short aliases for frequently used models in ZenRoute
2. **Monitor Usage**: Check ZenRoute dashboard for usage statistics and costs
3. **Rotate API Keys**: Regularly rotate your API keys for security
4. **Test Models**: Try different models to find the best one for your use case
