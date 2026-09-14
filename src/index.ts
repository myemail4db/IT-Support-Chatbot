import { App } from '@microsoft/teams.apps';
import { getSupportTopics, findSupportTopic } from './supportMatcher';

// Uncomment the following line to use the default App instance in MS Teams. This is useful for testing the bot in a Microsoft 365 developer tenant.
// const app = new App();

// We can use Microsoft 365 Agents Playground. It is specifically designed to
// let you test a Teams-style bot without a Microsoft 365 developer tenant,
// without sideloading, and without a tunnel. Microsoft says it simulates the
// look and behavior of Teams closely enough for local bot development.
const app = new App({
  dangerouslyAllowUnauthenticatedRequests: true,
});

const supportTopics = getSupportTopics();

console.log(`Loaded ${supportTopics.length} support topic(s).`);

for (const topic of supportTopics) {
  console.log(`- ${topic.title}`);
}

app.on('message', async ({ send, activity }) => {
  await send({ type: 'typing' });

  const userText = activity.text ?? '';
  const topic = findSupportTopic(userText);

  if (topic) {
    await send(`**${topic.title}**\n\n${topic.solution.join('\n')}`);
    return;
  }

  await send(
    "Sorry, I couldn't find a solution for that. Please try saying it another way.",
  );
});

app.start(process.env.PORT || 3978).catch(console.error);
