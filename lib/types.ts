type IssueState = "open" | "closed" | "all";

type GitHubIssue = {
  id: number;
  title: string;
  state: IssueState;
  description?: string;
  url: string;
};

export type YouTrackTask = {
  id: string;
  summary: string;
  description?: string;
  status: "Open" | "In Progress" | "Done";
};

export type { GitHubIssue, IssueState };