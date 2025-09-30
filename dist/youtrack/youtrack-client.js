import dotenv from "dotenv";
import axios from "axios";
import { YOUTRACK_API_KEY, YOUTRACK_BASE_URL } from "../config/config.js";
import { convertGitHubIssueToYouTrack } from "../utils/mapper.js";
dotenv.config();
export class YouTrackClient {
    baseUrl;
    axiosClient;
    apiKey;
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
    mapToYouTrackIssue(data) {
        return {
            id: data.id,
            summary: data.summary,
            description: data.description,
            author: data.author?.name || "Unknown",
            project: {
                id: data.project?.id,
                name: data.project?.name
            },
            customFields: data.customFields?.map((cf) => ({
                name: cf.name,
                value: cf.value?.name || cf.value || null
            })) || []
        };
    }
    async createIssue(issue, projectId) {
        try {
            const issueData = convertGitHubIssueToYouTrack(issue, projectId);
            console.log("Creating YouTrack issue with data:", issueData);
            const response = await this.axiosClient.post(`/issues?fields=id,summary,description,project(id,name),customFields(name,value(name))`, issueData);
            if (response.status === 200 || response.status === 201) {
                return this.mapToYouTrackIssue(response.data);
            }
            console.log("Successfully created YouTrack issue.");
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error;
                console.error("YouTrack API Error:", axiosError.response?.data || axiosError.message);
            }
            else {
                console.error("Unexpected Error:", error);
            }
        }
        return null;
    }
    async fetchProjects() {
        try {
            const response = await this.axiosClient.get(`/admin/projects?fields=id,name`);
            if (response.status === 200) {
                return response.data;
            }
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error;
                console.error("YouTrack API Error:", axiosError.response?.data || axiosError.message);
            }
            else {
                console.error("Unexpected Error:", error);
            }
        }
        return [];
    }
    async addCommentToIssue(issueId, comment) {
        let success = false;
        try {
            const commentData = {
                text: comment.body,
                author: {
                    login: comment.author?.login || "unknown",
                    fullName: comment.author?.name || "Unknown User"
                }
            };
            const response = await this.axiosClient.post(`/issues/${issueId}/comments`, commentData);
            if (response.status === 200 || response.status === 201) {
                success = true;
            }
            console.log("Successfully added comment to YouTrack issue.");
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error;
                console.error("YouTrack API Error:", axiosError.response?.data || axiosError.message);
            }
            else {
                console.error("Unexpected Error:", error);
            }
        }
        return success;
    }
}
