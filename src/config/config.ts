import dotenv from 'dotenv';
import { Octokit } from 'octokit';
import * as readline from "readline";
import { GitHubClient } from '../github/github-client.js';
import { YouTrackClient } from '../youtrack/youtrack-client.js';

dotenv.config();

export const GITHUB_API_KEY = process.env.GITHUB_API_KEY || '';
export const YOUTRACK_API_KEY = process.env.YOUTRACK_API_KEY || '';
export const YOUTRACK_BASE_URL = process.env.YOUTRACK_BASE_URL || '';
export const SYNC_INTERVAL_SECONDS = process.env.SYNC_INTERVAL_SECONDS ? parseInt(process.env.SYNC_INTERVAL_SECONDS) : 60 * 120;

if (!YOUTRACK_BASE_URL || !YOUTRACK_BASE_URL.trim()) {
    console.error('ERROR: missing YOUTRACK_BASE_URL environment variable. Set it and try again.');
    process.exit(1);
}

if (!YOUTRACK_API_KEY || !YOUTRACK_API_KEY.trim()) {
    console.error('ERROR: missing YOUTRACK_API_KEY environment variable. Set it and try again.');
    process.exit(1);
}

if (!GITHUB_API_KEY || !GITHUB_API_KEY.trim()) {
    console.error('ERROR: missing GITHUB_API_KEY environment variable. Set it and try again.');
    process.exit(1);
}

/* User interaction */
export const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

export const question = (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
};


export const gh = new GitHubClient();
export const yt = new YouTrackClient();