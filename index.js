const core = require('@actions/core');
const github = require('@actions/github')
const JiraApi = require('jira-client')

const jiraClient = new JiraApi({
    protocol: 'https',
    host: process.env.JIRA_BASE_URL,
    username: process.env.JIRA_USER_EMAIL,
    password: process.env.JIRA_API_TOKEN,
    apiVersion: '2',
    strictSSL: true
});

const getIssueNumberFrom = function (issueNumberIn, ref) {
    const search = issueNumberIn ? issueNumberIn : ref;
    console.log(`Searching "${search}" for Jira issue number.`)
    const match = search.match(/([A-Za-z]{2,5}-\d{1,})/g)
    const issueNumber = match ? match[0] : null
    return issueNumber
}

const getTicketStatusfromJiraApi = async function (client, issueNumber) {
    try {
        const issue = await client.findIssue(issueNumber);
        return issue.fields.status.name;
    } catch (error) {
        console.error('Error while fetching ticket from Jira API', error);
        throw error;
    }
};

/* Only fails if 
    - the ticket is found AND the ticket status is invalid
    - there is a failing API call
    Will not fail if 
    - There is no corresponding ticket found
*/
const main = function (issueNumberInput, statusMatchInput){
    try {
        const expectedStatusToAllowMerge = 'Dev Done';

        const statusMatch = statusMatchInput ? statusMatchInput : expectedStatusToAllowMerge;

        issueNumber = getIssueNumberFrom(issueNumberInput, github.context.ref)
        if (!issueNumber) {
            console.error('No issue number found. Assuming not ready. Failing silently.')
        } else {
            console.log(`Issue number found: ${issueNumber}`)
            core.setOutput("issueNumber", issueNumber);       
            statusFound = getTicketStatusfromJiraApi(jiraClient, issueNumber)
            console.log(`Jira ticket status found: ${statusFound}`);
            core.setOutput("status", statusFound);
            if (statusFound !== statusMatch) {
                core.setFailed(`Jira ticket status must be "${statusMatch}". Found "${statusFound}".`);
            }
        }
    
    } catch (error) {
        core.setFailed(error);
    }
}

module.exports = { getIssueNumberFrom, getTicketStatusfromJiraApi, main }

main(core.getInput('ticket_id'), core.getInput('expected_status'))
