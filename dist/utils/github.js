import dotenv from "dotenv";
import { Octokit } from "octokit";
dotenv.config();
const GITHUB_API_KEY = process.env.GITHUB_API_KEY;
if (!GITHUB_API_KEY || !GITHUB_API_KEY.trim()) {
    console.error('ERROR: missing GITHUB_API_KEY environment variable. Set it and try again.');
    process.exit(1);
}
const octokit = new Octokit({
    auth: GITHUB_API_KEY,
});
const fetchIssues = async (owner, repo) => {
    const githubResponse = await octokit.request("GET /repos/{owner}/{repo}/issues", {
        owner: owner,
        repo: repo,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });
    if (githubResponse.status != 200) {
        console.error("Error while fetching repo's issues");
        process.exit(1);
    }
    const issues = githubResponse.data.map(issue => ({
        id: issue.id,
        title: issue.title,
        state: "closed",
        description: issue.body ?? "",
    }));
    return issues;
};
export { fetchIssues };
