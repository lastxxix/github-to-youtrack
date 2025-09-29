import dotenv from "dotenv";
import axios from "axios";
dotenv.config();
const YOUTRACK_BASE_URL = process.env.YOUTRACK_BASE_URL;
const YOUTRACK_API_KEY = process.env.YOUTRACK_API_KEY;
if (!YOUTRACK_BASE_URL || !YOUTRACK_BASE_URL.trim()) {
    console.error('ERROR: missing YOUTRACK_BASE_URL environment variable. Set it and try again.');
    process.exit(1);
}
if (!YOUTRACK_API_KEY || !YOUTRACK_API_KEY.trim()) {
    console.error('ERROR: missing YOUTRACK_API_KEY environment variable. Set it and try again.');
    process.exit(1);
}
const headers = {
    Authorization: `Bearer ${YOUTRACK_API_KEY}`,
    "Content-Type": "application/json"
};
// Cache for state field IDs by project
const stateFieldCache = new Map();
const mapGitHubToYouTrackState = (state) => {
    switch (state) {
        case "open":
            return "Open";
        case "closed":
            return "Done";
        default:
            throw new Error(`Unknown GitHubIssueState: ${state}`);
    }
};
export const fetchStateFieldId = async (projectId) => {
    // Check cache first
    if (stateFieldCache.has(projectId)) {
        return stateFieldCache.get(projectId);
    }
    const endpoint = `${YOUTRACK_BASE_URL}/api/admin/projects/${projectId}/customFields?fields=id,field(name),$type`;
    try {
        const response = await axios.get(endpoint, { headers });
        if (!response?.data) {
            throw new Error('Empty response from YouTrack API');
        }
        const statusField = response.data.find((f) => f.$type === "StateProjectCustomField" ||
            f.field?.name?.toLowerCase() === "state");
        const statusFieldId = statusField?.field?.name || statusField?.id || null;
        // Cache the result if found
        if (statusFieldId) {
            stateFieldCache.set(projectId, statusFieldId);
        }
        return statusFieldId;
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Error fetching custom fields:", {
                status: error.response?.status,
                message: error.message,
                data: error.response?.data
            });
        }
        else {
            console.error("Error fetching custom fields:", error);
        }
        return null;
    }
};
const createIssue = async (issue, projectId) => {
    const customFields = [];
    if (issue.state !== "open") {
        const stateFieldId = await fetchStateFieldId(projectId);
        if (!stateFieldId) {
            console.warn(`Could not find state field for project ${projectId}. Issue will be created with default state.`);
        }
        else {
            customFields.push({
                name: stateFieldId,
                $type: "StateIssueCustomField",
                value: {
                    name: mapGitHubToYouTrackState(issue.state)
                }
            });
        }
    }
    const data = {
        project: { id: projectId },
        summary: issue.title,
        description: issue.description,
        ...(customFields.length > 0 && { customFields })
    };
    const endpoint = `${YOUTRACK_BASE_URL}/api/issues?fields=id,summary,description`;
    try {
        const response = await axios.post(endpoint, data, { headers });
        return {
            id: response.data.id,
            summary: response.data.summary,
            description: response.data.description
        };
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Error creating YouTrack issue:", {
                status: error.response?.status,
                message: error.message,
                data: error.response?.data,
                issue: issue.title
            });
        }
        else {
            console.error("Error creating YouTrack issue:", error);
        }
        return null;
    }
};
export { createIssue };
