import dotenv from "dotenv";

import axios, { AxiosError, AxiosInstance } from "axios";
import { YOUTRACK_API_KEY, YOUTRACK_BASE_URL } from "../config/config.js";
import { YouTrackCreateIssue, YouTrackIssue, YouTrackProject } from "../models/youtrack.js";
import { GitHubComment, GitHubIssue } from "../models/github.js";
import { convertGitHubIssueToYouTrack, mapToYouTrackIssue } from "../utils/parser.js";
import { randomUUID } from "crypto";
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



    public async createIssue(issue: GitHubIssue, projectId: string): Promise<YouTrackIssue | null> {
        try {
            const issueData = convertGitHubIssueToYouTrack(issue, projectId);
            const response = await this.axiosClient.post(
                `/issues?fields=id,shortName,summary,description,project(id,name),customFields(name,value(name))`,
                issueData
            );

            if (response.status === 200 || response.status === 201) {
                console.log("Successfully created YouTrack issue.");
                return mapToYouTrackIssue(response.data);
            }
            
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                console.error("YouTrack API Error:", axiosError.response?.data || axiosError.message);
                } else {
                console.error("Unexpected Error:", error);
                }
                process.exit(1);
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
                /*  
                WAS WORKING UNTIL 01/10/2025 then YouTrack changed something. Previously it was generating a new user automatically. 
                author: {
                    login: comment.author?.login || "unknown",
                    fullName: comment.author?.name || "Unknown User"
                },
                */
                text: comment.body
                
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
            process.exit(1);
        }
        
        return success;
    }

    public async updateIssue(oldIssue: YouTrackIssue, newIssue: YouTrackCreateIssue): Promise<YouTrackIssue | null> {
        try {
            const updatedFields: Record<string, any> = {};

            if (oldIssue.summary !== newIssue.summary) {
                updatedFields.summary = newIssue.summary;
            }

            if (oldIssue.description !== newIssue.description) {
                updatedFields.description = newIssue.description;
            }

            //Check custom field state
            const oldStateField = oldIssue.customFields.find(cf => cf.name === "State");
            const newStateField = newIssue.customFields.find(cf => cf.name === "State");
            if (oldStateField?.value?.name !== newStateField?.value?.name) {
                updatedFields.customFields = newIssue.customFields;
            }
            

            if (Object.keys(updatedFields).length > 0) {
                const response = await this.axiosClient.post(
                    `/issues/${oldIssue.id}?fields=id,summary,description,project(id,name),customFields(name,value(name))`,
                    updatedFields
                );

                if (response.status === 200) {
                    console.log("Successfully updated YouTrack issue.");
                    return mapToYouTrackIssue(response.data);
                }
            }
            return oldIssue;
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

    public async findIssue(githubIssueNumber: number, projectId: string): Promise<YouTrackIssue | null> {
        try {
            const response = await this.axiosClient.get<YouTrackIssue[]>(
                `/issues?fields=id,summary,description,project(id,name),customFields(name,value(name))`
            );
            
            if (response.status === 200 && response.data.length > 0) {
                const matchingIssue = response.data.find(issue => 
                    issue.summary?.startsWith(`#${githubIssueNumber}`)
                );
                
                if (matchingIssue) {
                    return mapToYouTrackIssue(matchingIssue);
                }
            }
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
}