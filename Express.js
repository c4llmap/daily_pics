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
    auth: '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'
});

const owner = 'c4llmap  ';
const repo = 'https://github.com/c4llmap/daily_pics';

app.post('/upload', upload.single('photo'), async (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.file.filename);
    const fileContent = fs.readFileSync(filePath);
    const fileName = `${Date.now()}_${req.file.originalname}`;

    try {
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: `imgs/${fileName}`,
            message: `Add photo ${fileName}`,
            content: fileContent.toString('base64')
        });

        const photoUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/imgs/${fileName}`;

        res.json({ success: true, photoUrl, photoId: fileName });
    } catch (error) {
        console.error('Error uploading photo:', error);
        res.status(500).json({ success: false, message: 'Failed to upload photo' });
    }
});

app.get('/photo/:id', async (req, res) => {
    const photoId = req.params.id;

    try {
        const commentsPath = `log/comments_${photoId}.json`;
        const commentsData = await octokit.repos.getContent({
            owner,
            repo,
            path: commentsPath
        });
        const comments = JSON.parse(Buffer.from(commentsData.data.content, 'base64').toString());

        res.json({
            comments: comments.comments || [],
            likes: comments.likes || 0
        });
    } catch (error) {
        console.error('Error getting photo data:', error);
        res.status(500).json({ success: false, message: 'Failed to get photo data' });
    }
});

app.post('/photo/:id/comment', async (req, res) => {
    const photoId = req.params.id;
    const { comment } = req.body;
    const ip = req.ip;

    try {
        const commentsPath = `log/comments_${photoId}.json`;
        let comments = { comments: [], likes: 0 };

        try {
            const commentsData = await octokit.repos.getContent({
                owner,
                repo,
                path: commentsPath
            });
            comments = JSON.parse(Buffer.from(commentsData.data.content, 'base64').toString());
        } catch (error) {
            // File does not exist, create a new one
        }

        comments.comments.push({ comment, ip });

        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: commentsPath,
            message: `Add comment to ${photoId}`,
            content: Buffer.from(JSON.stringify(comments)).toString('base64')
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
        const commentsPath = `log/comments_${photoId}.json`;
        let comments = { comments: [], likes: 0 };

        try {
            const commentsData = await octokit.repos.getContent({
                owner,
                repo,
                path: commentsPath
            });
            comments = JSON.parse(Buffer.from(commentsData.data.content, 'base64').toString());
        } catch (error) {
            // File does not exist, create a new one
        }

        comments.likes += 1;

        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: commentsPath,
            message: `Add like to ${photoId}`,
            content: Buffer.from(JSON.stringify(comments)).toString('base64')
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
