export type GitHubIssueState = "open" | "closed";
export type YouTrackIssueState = "Open" | "In Progress" | "Done";

export type GitHubIssue = {
  id: number;
  title: string;
  state: GitHubIssueState;
  description?: string;
};

export type YouTrackIssue = {
  id: string;
  summary: string;
  description?: string;
  status: YouTrackIssueState
};

