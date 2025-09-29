import { fetchIssues } from "./utils/github.js";
import { createIssue } from "./utils/youtrack.js";
const githubIssues = await fetchIssues("instaloader", "instaloader");
//console.log(githubIssues);
githubIssues.forEach(githubIssue => {
    const youtrackIssue = createIssue(githubIssue, "0-1");
});
