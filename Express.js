const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Octokit } = require('@octokit/rest');
const app = express();

const upload = multer({ dest: 'uploads/' });
app.use(express.json());
app.use(express.static('public'));

const octokit = new Octokit({
    auth: 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN'
});

const owner = 'YOUR_GITHUB_USERNAME';
const repo = 'YOUR_GITHUB_REPOSITORY';

app.post('/upload', upload.single('photo'), async (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.file.filename);
    const fileContent = fs.readFileSync(filePath);
    const fileName = `${Date.now()}_${req.file.originalname}`;

    try {
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: `photos/${fileName}`,
            message: `Add photo ${fileName}`,
            content: fileContent.toString('base64')
        });

        const photoUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/photos/${fileName}`;

        res.json({ success: true, photoUrl, photoId: fileName });
    } catch (error) {
        console.error('Error uploading photo:', error);
        res.status(500).json({ success: false, message: 'Failed to upload photo' });
    }
});

app.get('/photo/:id', async (req, res) => {
    const photoId = req.params.id;

    try {
        const issueResponse = await octokit.issues.listForRepo({
            owner,
            repo,
            labels: photoId
        });

        const issue = issueResponse.data[0];
        const commentsResponse = await octokit.issues.listComments({
            owner,
            repo,
            issue_number: issue.number
        });

        res.json({
            comments: commentsResponse.data.map(comment => comment.body),
            likes: issue.reactions['+1']
        });
    } catch (error) {
        console.error('Error getting photo data:', error);
        res.status(500).json({ success: false, message: 'Failed to get photo data' });
    }
});

app.post('/photo/:id/comment', async (req, res) => {
    const photoId = req.params.id;
    const { comment } = req.body;

    try {
        const issueResponse = await octokit.issues.listForRepo({
            owner,
            repo,
            labels: photoId
        });

        const issue = issueResponse.data[0];
        await octokit.issues.createComment({
            owner,
            repo,
            issue_number: issue.number,
            body: comment
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ success: false, message: 'Failed to add comment' });
    }
});

app.post('/photo/:id/like', async (req, res) => {
    const photoId = req.params.id;

    try {
        const issueResponse = await octokit.issues.listForRepo({
            owner,
            repo,
            labels: photoId
        });

        const issue = issueResponse.data[0];
        await octokit.reactions.createForIssue({
            owner,
            repo,
            issue_number: issue.number,
            content: '+1'
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error adding like:', error);
        res.status(500).json({ success: false, message: 'Failed to add like' });
    }
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
