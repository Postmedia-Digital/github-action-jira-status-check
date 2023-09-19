jest.mock('jira-client');
jest.mock('@actions/core');
jest.mock('@actions/github');

const assert = require('assert');
const { getIssueNumberFrom, getTicketStatusfromJiraApi } = require('./index.js'); // Assuming the provided code is in 'yourCodeFile.js'
const JiraApi = require('jira-client');
const core = require('@actions/core');
const github = require('@actions/github');

describe('getIssueNumberFrom', () => {
    it('should extract issue number from input', () => {
        const result = getIssueNumberFrom('TEST-123', null);
        assert.strictEqual(result, 'TEST-123');
    });

    it('should extract issue number from ref if input is null', () => {
        const result = getIssueNumberFrom(null, 'refs/heads/feature/TEST-456');
        assert.strictEqual(result, 'TEST-456');
    });

    it('should return null if no issue number is found', () => {
        const result = getIssueNumberFrom(null, 'refs/heads/feature/noIssueNumber');
        assert.strictEqual(result, null);
    });
});

describe('getTicketStatusfromJiraApi', () => {
    let mockJiraInstance;

    beforeEach(() => {
        mockJiraInstance = {
            findIssue: jest.fn()
        };
        JiraApi.mockImplementation(() => mockJiraInstance);
    });

    it('should return ticket status if issue is found', async () => {
        mockJiraInstance.findIssue.mockResolvedValue({
            fields: {
                status: {
                    name: 'Dev Done'
                }
            }
        });

        const status = await getTicketStatusfromJiraApi(mockJiraInstance, 'TEST-123');
        expect(status).toBe('Dev Done');
    });

    it('should log and re-throw error if issue is not found', async () => {
        mockJiraInstance.findIssue.mockRejectedValue(new Error('Issue not found'));

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        await expect(getTicketStatusfromJiraApi(mockJiraInstance, 'TEST-123')).rejects.toThrow('Issue not found');
        expect(consoleSpy).toHaveBeenCalledWith("Error while fetching ticket from Jira API", new Error('Issue not found'));

        consoleSpy.mockRestore();
    });
});
