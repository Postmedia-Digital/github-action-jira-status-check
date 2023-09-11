const core = require('@actions/core');
const github = require('@actions/github')
const JiraApi = require('jira-client')

try {
    const issueNumberInput = core.getInput('ticket_id');
    const statusMatchInput = core.getInput('expected_status');

    const search = issueNumberInput ? issueNumberInput : github.context.ref;
    const statusMatch = statusMatchInput ? statusMatchInput : 'Under Code Review';

    console.log(`Searching "${search}" for Jira issue number.`)

    const match = search.match(/([A-Za-z]{2,5}-\d{1,})/g)
    const issueNumber = match ? match[0] : null

    if (!issueNumber) {
        return core.setFailed('No issue number found. Assuming not ready.');
    }

    console.log(`Issue number found: ${issueNumber}`)
    core.setOutput("issueNumber", issueNumber);

    let jira = new JiraApi({
        protocol: 'https',
        host: process.env.JIRA_BASE_URL,
        username: process.env.JIRA_USER_EMAIL,
        password: process.env.JIRA_API_TOKEN,
        apiVersion: '2',
        strictSSL: true
    });

    jira.findIssue(issueNumber)
        .then(issue => {
            const statusFound = issue.fields.status.name;
            console.log(`Status: ${statusFound}`);
            core.setOutput("status", statusFound);

            if (statusFound !== statusMatch) {
                core.setFailed(`Status must be "${statusMatch}". Found "${statusFound}".`);
            }
        })
        .catch(err => {
            console.error(err);
            core.setFailed(err.message);
        });
} catch (error) {
    core.setFailed(error.message);
}
