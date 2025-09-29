import { fetchIssues } from "./lib/github.ts";

const issues = await fetchIssues("instaloader", "instaloader");
console.log(issues);