import { App } from '@microsoft/teams.apps';

import { registerMessageHandler } from './handlers/messageHandler';
import { getSupportTopics } from './matching/supportMatcher';

const app = new App({
  dangerouslyAllowUnauthenticatedRequests: true,
});

const supportTopics = getSupportTopics();

console.log(`Loaded ${supportTopics.length} support topic(s).`);

for (const topic of supportTopics) {
  console.log(`- ${topic.title}`);
}

registerMessageHandler(app);

app.start(process.env.PORT || 3978).catch(console.error);
