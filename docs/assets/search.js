
const pages = [
  ["Home","index.html","overview user developer start"],
  ["User Introduction","pages/user-intro.html","user introduction use chatbot help voice support"],
  ["Developer Introduction","pages/developer-intro.html","developer architecture matching scoring setup"],
  ["Architecture","pages/architecture.html","architecture intent object context scoring unresolved"],
  ["Conversation Flow","pages/conversation-flow.html","conversation clarification ambiguity first miss second miss unresolved"],
  ["Sample Conversations","pages/sample-conversations.html","examples screenshots known ambiguous unresolved clarification"],
  ["Getting Started","pages/getting-started.html","github clone download install run agents playground local"],
  ["Agents Playground","pages/agents-playground.html","microsoft 365 agents playground no company teams access local testing"],
  ["Security","pages/security.html","security input validation secrets logging local production"],
  ["Development Journey","pages/development-journey.html","without company access lessons learned local"],
  ["Future Options","pages/future-options.html","future pubsub human handoff ticketing analytics"],
  ["Pub/Sub Examples","pages/pubsub.html","pubsub application monitoring admin approval request software"]
];

const base = document.body.dataset.base || "";
const input = document.getElementById("docSearch");
const results = document.getElementById("searchResults");

if (input && results) {
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.style.display="none"; results.innerHTML=""; return; }
    const matches = pages.filter(p => (p[0]+" "+p[2]).toLowerCase().includes(q)).slice(0,8);
    results.innerHTML = matches.length
      ? matches.map(p => `<a href="${base}${p[1]}">${p[0]}</a>`).join("")
      : `<div style="padding:8px;color:#a9b6d3">No matching topic found.</div>`;
    results.style.display = "block";
  });
}
