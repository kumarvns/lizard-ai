const jwt = require('jsonwebtoken');
const connectDB = require('../configs/db');
const { join } = require("path");
const fs = require('fs');
const User = require('../models/User');
const Project = require('../models/Project');


const AuthController = {};

AuthController.register = async (req, res) => {
    const { username, password } = req.body;

    await connectDB();

    if (!username || !password) {
        return res.status(401).send('Invalid User Data');
    }

    let user = await User.findOne({ username });

    if (user) {
        return res.status(401).send('User already exists');
    }

    user = new User({
        username,
        password,
        email: "somebody@gmail.com",
        firstName: "Ashish",
        lastName: "Singh",
        avatar: 'https://www.gravatar.com/avatar/3b3be63a4c2a439b013787725dfce802?d=identicon',
        role: 'User',
        createdAt: Date.now(),
        updatedAt: Date.now(),
    });

    const newUser = user.save();

    if (!newUser) {
        return res.status(401).send('Invalid User Data');
    }

    return res.status(200).send({ msg: 'User created' });
}

AuthController.login = async (req, res) => {
    const { username, password } = req.body;

    await connectDB();

    const user = await User.findOne({ username });

    if (!user) {
        return res.status(401).send('User does not exist');
    }

    if (user.password !== password) {
        return res.status(401).send('Wrong password');
    }

    const data = {
        id: user._id,
        username: user.username,
        role: user.role
    }

    const token = jwt.sign(data, process.env.JWT_SECRET, { expiresIn: '2d' });

    // res.cookie('token', token, { maxAge: 2 * 24 * 60 * 60 * 1000, httpOnly: true, secure: true });

    return res.status(200).send({ token });
}

AuthController.logout = (req, res) => {
    res.clearCookie('token');
    return res.status(200).send({ msg: 'Logged out' });
}

AuthController.checkAuth = (req, res) => {
    // const token = req.cookies?.token;
    // const token = req.cookie?.token;

    const token = req.headers.token;

    if (!token) {
        return res.status(401).send('Not authorized dffdf');
    }

    try {
        const data = jwt.verify(token, process.env.JWT_SECRET);
        return res.status(200).send(data);
    } catch (err) {
        return res.status(401).send('Not authorized dasdasd');
    }
}

AuthController.getImages = async (req, res) => {
    const token = req.headers.token;

    if (!token) {
        return res.status(401).send('Not authorized');
    }

    try {

        await connectDB();

        const { id } = jwt.verify(token, process.env.JWT_SECRET);

        if (!id) {
            return res.status(401).send('Not authorized');
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).send('User not found');
        }

        return res.status(200).send({ images: user.uploadedFiles });
    } catch (err) {
        return res.status(401).send('Not authorized');
    }
}

AuthController.getVideos = async (req, res) => {
    const token = req.headers.token;

    if (!token) {
        return res.status(401).send('Not authorized');
    }

    try {

        const { id } = jwt.verify(token, process.env.JWT_SECRET);

        if (!id) {
            return res.status(401).send('Not authorized');
        }

        await connectDB();
        const projectId = req.params.name;

        const project = await Project.findById(projectId);

        if (!project || project.user.toString() !== id || !project.isGenerated) {
            return res.status(404).send('Video not found');
        }

        const videoPath = join(process.cwd(), "created", `${id}${projectId}.mp4`);

        if (!fs.existsSync(videoPath)) {
            return res.status(404).send('Video not found');
        }

        return res.status(200).sendFile(videoPath);

    } catch (err) {
        console.log(err);
        return res.status(401).send('Not authorized');
    }
}

module.exports = AuthController;