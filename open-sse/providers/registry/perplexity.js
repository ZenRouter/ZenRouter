export default {
  id: "perplexity",
  priority: 180,
  alias: "perplexity",
  aliases: [
    "pplx",
  ],
  uiAlias: "pplx",
  display: {
    name: "Perplexity",
    icon: "search",
    color: "#20808D",
    textIcon: "PP",
    website: "https://www.perplexity.ai",
    notice: {
      apiKeyUrl: "https://www.perplexity.ai/settings/api",
    },
  },
  category: "apikey",
  authType: "apikey",
  transport: {
    baseUrl: "https://api.perplexity.ai/chat/completions",
    validateUrl: "https://api.perplexity.ai/models",
  },
  models: [
    { id: "sonar-pro", name: "Sonar Pro", deprecated: true, deprecationNotice: "Standalone Sonar ended September 27, 2026; synchronous and streaming calls are gradually reformulated as Agent API requests." },
    { id: "sonar", name: "Sonar", deprecated: true, deprecationNotice: "Standalone Sonar ended September 27, 2026; synchronous and streaming calls are gradually reformulated as Agent API requests." },
    { id: "sonar-reasoning-pro", name: "Sonar Reasoning Pro", deprecated: true, deprecationNotice: "Standalone Sonar ended September 27, 2026; synchronous and streaming calls are gradually reformulated as Agent API requests." },
    { id: "sonar-deep-research", name: "Sonar Deep Research", deprecated: true, deprecationNotice: "Standalone Sonar ended September 27, 2026; synchronous and streaming calls are gradually reformulated as Agent API requests." },
  ],
  serviceKinds: ["llm","webSearch"],
  searchViaChat: {
    defaultModel: "sonar",
    endpoint: "https://api.perplexity.ai/chat/completions",
    pricingUrl: "https://docs.perplexity.ai/guides/pricing",
  },
};
