export default {
  id: "google-pse",
  alias: "gpse",
  display: {
    name: "Google PSE (Sunsets Jan 2027)",
    icon: "search",
    color: "#4285F4",
    textIcon: "GP",
    website: "https://programmablesearchengine.google.com",
    notice: {
      text: "Closed to new customers; discontinued Jan 1, 2027. Google directs new users to Vertex AI Search.",
      apiKeyUrl: "https://programmablesearchengine.google.com/controlpanel/create"
    },
    deprecated: true,
  },
  category: "apikey",
  authType: "apikey",
  serviceKinds: [
    "webSearch"
  ],
  searchConfig: {
    baseUrl: "https://www.googleapis.com/customsearch/v1",
    method: "GET",
    authType: "apikey",
    authHeader: "key",
    costPerQuery: 0.005,
    freeMonthlyQuota: 3000,
    searchTypes: [
      "web",
      "news"
    ],
    defaultMaxResults: 5,
    maxMaxResults: 10,
    timeoutMs: 10000,
    cacheTTLMs: 300000
  }
};
