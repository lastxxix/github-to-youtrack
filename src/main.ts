import { fetchIssues } from "./utils/github.js";
import { createIssue } from "./utils/youtrack.js";
import * as readline from "readline";


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
};


const githubIssues = await fetchIssues("instaloader", "instaloader");
//console.log(githubIssues);
githubIssues.forEach(githubIssue => {
    const youtrackIssue = createIssue(githubIssue, "0-1")
});
