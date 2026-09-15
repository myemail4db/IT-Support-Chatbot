const pages = [
["Home","index.html","overview user developer start support data maintenance ai prompt"],
["User Introduction","pages/user-intro.html","user introduction use chatbot help voice support"],
["Developer Introduction","pages/developer-intro.html","developer architecture matching scoring setup support data maintenance"],
["Architecture","pages/architecture.html","architecture intent object context state scoring unresolved conversationId identity timestamp"],
["Conversation Flow","pages/conversation-flow.html","conversation clarification ambiguity first miss second miss unresolved helpful original rephrased question"],
["Sample Conversations","pages/sample-conversations.html","examples screenshots known ambiguous unresolved clarification helpful repeated ambiguity"],
["Getting Started","pages/getting-started.html","github clone download install run agents playground local add support topic maintenance"],
["Agents Playground","pages/agents-playground.html","microsoft 365 agents playground no company teams access local testing"],
["Managing Support Data","pages/managing-support-data.html","support data add new topic problem section knowledge maintenance non developer semantics json approved procedure"],
["AI Support Topic Prompt","pages/ai-support-topic-prompt.html","ai prompt create support data add topic semantics integration files validation test questions non developer"],
["Security","pages/security.html","security input validation secrets logging local production"],
["Development Journey","pages/development-journey.html","without company access lessons learned local"],
["Future Options","pages/future-options.html","future pubsub human handoff ticketing analytics"],
["Pub/Sub Examples","pages/pubsub.html","pubsub application monitoring admin approval request software"]
];
const base=document.body.dataset.base||"",input=document.getElementById("docSearch"),results=document.getElementById("searchResults");
if(input&&results){input.addEventListener("input",()=>{const q=input.value.trim().toLowerCase();if(!q){results.style.display="none";results.innerHTML="";return}const m=pages.filter(p=>(p[0]+" "+p[2]).toLowerCase().includes(q)).slice(0,8);results.innerHTML=m.length?m.map(p=>`<a href="${base}${p[1]}">${p[0]}</a>`).join(""):`<div style="padding:8px;color:#a9b6d3">No matching topic found.</div>`;results.style.display="block"})}
