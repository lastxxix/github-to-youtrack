import dotenv from "dotenv";

import axios, { AxiosError, AxiosInstance } from "axios";
import { YOUTRACK_API_KEY, YOUTRACK_BASE_URL } from "../config/config.js";
import { YouTrackIssue, YouTrackProject } from "../models/youtrack.js";
import { GitHubComment, GitHubIssue } from "../models/github.js";
import { convertGitHubIssueToYouTrack } from "../utils/parser.js";
dotenv.config();

export class YouTrackClient {
  private baseUrl: string
  private axiosClient: AxiosInstance;
  private apiKey: string;
  
  constructor() {
      this.baseUrl = YOUTRACK_BASE_URL + "/api";
      this.apiKey = YOUTRACK_API_KEY;
      this.axiosClient = axios.create({
          baseURL: this.baseUrl,
          headers: {
              Authorization: `Bearer ${this.apiKey}`,
              "Content-Type": "application/json"
          }
      });
   
  }

  private mapToYouTrackIssue(data: any): YouTrackIssue {
    return {
        id: data.id,
        summary: data.summary,
        description: data.description,
        author: data.author?.name || "Unknown",
        project: {
            id: data.project?.id,
            name: data.project?.name
        },
        customFields: data.customFields?.map((cf: any) => ({
            name: cf.name,
            value: cf.value?.name || cf.value || null
        })) || []
    };
  } 

  public async createIssue(issue: GitHubIssue, projectId: string): Promise<YouTrackIssue | null> {
      try {
          const issueData = convertGitHubIssueToYouTrack(issue, projectId);
          const response = await this.axiosClient.post(
            `/issues?fields=id,summary,description,project(id,name),customFields(name,value(name))`,
            issueData
          );

          if (response.status === 200 || response.status === 201) {
              return this.mapToYouTrackIssue(response.data);
          }
          console.log("Successfully created YouTrack issue.");
      } catch (error) {
          if (axios.isAxiosError(error)) {
              const axiosError = error as AxiosError;
              console.error("YouTrack API Error:", axiosError.response?.data || axiosError.message);
          } else {
              console.error("Unexpected Error:", error);
          }
      }
      return null;
  }

  public async fetchProjects(): Promise<YouTrackProject[]> {
      try {
          const response = await this.axiosClient.get<YouTrackProject[]>(`/admin/projects?fields=id,name`);
          if (response.status === 200) {
              return response.data;
          }
      } catch (error) {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            console.error("YouTrack API Error:", axiosError.response?.data || axiosError.message);
        } else {
            console.error("Unexpected Error:", error);
        }
      }
      return [];
  }

  public async addCommentToIssue(issueId: string, comment: GitHubComment): Promise<boolean> {
      let success = false;
      try {
          const commentData = {
            text: comment.body,
            author: {
              login: comment.author?.login || "unknown",
              fullName: comment.author?.name || "Unknown User"
            }
          };
          const response = await this.axiosClient.post(
            `/issues/${issueId}/comments`,
            commentData
          );
          if (response.status === 200 || response.status === 201) {
              success = true;
          }
          console.log("Successfully added comment to YouTrack issue.");
      } catch (error) {
          if (axios.isAxiosError(error)) {
              const axiosError = error as AxiosError;
              console.error("YouTrack API Error:", axiosError.response?.data || axiosError.message);
          } else {
              console.error("Unexpected Error:", error);
          }
      }
      return success;
  }
}






