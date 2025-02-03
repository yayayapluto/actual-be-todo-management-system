var express = require('express');
var router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const { stringify } = require('jade/lib/utils');

// Get All Users Task
router.get('/get-all', async function (req, res, next) {
    const userTasks = await prisma.userTask.findMany();
    res.send(userTasks)
});

// Get User Task by ID
router.get('/get-user-task/:user_id/:task_id', async function (req, res, next) {
    const { user_id, task_id } = req.params;
    const userTask = await prisma.userTask.findUnique({
        where: {
            user_id_task_id: {
                user_id: parseInt(user_id),
                task_id: parseInt(task_id),
            },
        },
    });
    res.send(userTask);
});


// Create User Task
router.post('/create', async function (req, res, next) {
    const { user_id, task_id } = req.body;
    const userTask = await prisma.userTask.create({
        data: {
            user_id: parseInt(user_id),
            task_id: parseInt(task_id),
        },
    });
    res.send(userTask)
});

// Update User Task
router.put('/update-user-task/:user_id_param/:task_id_param', async function (req, res, next) {
    const { user_id_param, task_id_param } = req.params;  
    const { user_id, task_id } = req.body;

    const userTask = await prisma.userTask.update({
        where: {
            user_id_task_id: { 
                user_id: parseInt(user_id_param),
                task_id: parseInt(task_id_param),
            },
        },
        data: {
            user_id: parseInt(user_id),  
            task_id: parseInt(task_id),
        },
    });
    res.send(userTask);
});


// Delete User
router.delete('/delete/:id', async function (req, res, next) {
    const { id } = req.params;
    const user = await prisma.user.delete({
        where: {
            id: parseInt(id),
        },
    });
    res.send(user)
});

module.exports = router;
