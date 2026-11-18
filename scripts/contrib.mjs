// Fetches the last year of contributions into scripts/data/contrib.json.
// Needs GITHUB_TOKEN (the workflow passes its own; locally: GITHUB_TOKEN=$(gh auth token)).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';

const LOGIN = 'Pimboto';
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error('GITHUB_TOKEN is not set');

const query = `{ user(login: "${LOGIN}") { contributionsCollection { contributionCalendar {
  totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } } } }`;

const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { authorization: `bearer ${token}`, 'content-type': 'application/json', 'user-agent': 'profile-readme' },
  body: JSON.stringify({ query }),
});
const json = await res.json();
if (!res.ok || json.errors) throw new Error(`GitHub answered ${res.status}: ${JSON.stringify(json.errors ?? json)}`);

const LEVEL = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
const cal = json.data.user.contributionsCollection.contributionCalendar;
const weeks = cal.weeks.map((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, level: LEVEL[d.contributionLevel] })));

fs.writeFileSync(path.join(ROOT, 'scripts/data/contrib.json'), JSON.stringify({ total: cal.totalContributions, weeks }));
console.log(`contrib.json: ${cal.totalContributions} contributions over ${weeks.length} weeks`);
