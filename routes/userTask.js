var express = require('express');
var router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const { stringify } = require('jade/lib/utils');
const apiResponse = require('../utils/api-response-map');
const { body, validationResult } = require('express-validator');

async function checkUserTaskExists(req, res, next) {
    const { user_id, task_id } = req.params;
    const userTask = await prisma.userTask.findFirst({
        include: {
            user: true,
            task: true
        },
        where: {
            AND: {
                user_id: parseInt(user_id),
                task_id: parseInt(task_id),
            },
        },
    });

    if (!userTask) {
        return res
            .status(404)
            .json(apiResponse(false, `UserTask dengan user_id:${user_id} task_id:${task_id} tidak ditemukan`));
    }

    req.userTask = userTask
    next();
}

// Get All Users Task
router.get('/get-all', async function (req, res, next) {
    const userTasks = await prisma.userTask.findMany({
        include: {
            user: true,
            task: true
        }
    });

    if (userTasks.length === 0) {
        return res
            .status(404)
            .json(apiResponse(true, "Tidak ada data UserTask", null))
    }

    return res
        .status(200)
        .json(apiResponse(true, "Berhasil memgambil demua data UserTask", userTasks))
});

// Get User Task by ID
router.get('/get-user-task/:user_id/:task_id',
    [checkUserTaskExists],
    async function (req, res, next) {
        const { user_id, task_id } = req.params;

        return res
            .status(200)
            .json(apiResponse(true, `Berhasil mengambil UserTask dengan user_id:${user_id} task_id:${task_id}`, {
                id: req.userTask.id,
                user_id: req.userTask.user_id,
                task_id: req.userTask.task_id
            }))
    });

// Create User Task 
router.post(
    '/create',
    [
        body("user_id")
            .notEmpty().withMessage("Field user_id tidak boleh kosong")
            .isNumeric().withMessage("Field user_id harus berupa angka"),
        body("task_id")
            .notEmpty().withMessage("Field task_id tidak boleh kosong")
            .isNumeric().withMessage("Field task_id harus berupa angka"),
    ],
    async function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res
                .status(422)
                .json(apiResponse(false, "Validasi gagal", errors.array()));
        }
        const { user_id, task_id } = req.body;

        const existingUserTask = await prisma.userTask.findUnique({
            where: {
                user_id_task_id: { user_id: parseInt(user_id), task_id: parseInt(task_id) }
            }
        });

        if (existingUserTask) {
            return res
                .status(409)
                .json(apiResponse(false, "UserTask dengan kombinasi user_id dan task_id sudah ada"));
        }

        const userTask = await prisma.userTask.create({
            data: {
                user_id: parseInt(user_id),
                task_id: parseInt(task_id),
            },
        });
        return res
            .status(200)
            .json(apiResponse(true, "Berhasil menambahkan data UserTask", userTask))
    });

// Update User Task
router.put(
    '/update-user-task/:user_id/:task_id',
    [
        checkUserTaskExists,
        body("userId")
            .optional()
            .isNumeric().withMessage("Field user_id harus berupa angka"),
        body("taskId")
            .optional()
            .isNumeric().withMessage("Field task_id harus berupa angka"),
    ],
    async function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res
                .status(422)
                .json(apiResponse(false, "Validasi gagal", errors.array()));
        }

        const { user_id, task_id } = req.params;
        const { userId, taskId } = req.body;

        const updateData = {}
        if (userId !== undefined) updateData.userId = userId
        if (taskId !== undefined) updateData.taskId = taskId
        if (Object.keys(updateData).length === 0) {
            return res
                .status(200)
                .json(apiResponse(false, "Tidak ada data yang diperbarui"));
        }

        const orConditions = []
        if (updateData.userId) orConditions.push(updateData.userId)
        if (updateData.taskId) orConditions.push(updateData.taskId)
        if (orConditions.length > 0) {
            const conflictingUser = await prisma.userTask.findFirst({
                where: {
                    AND: {
                        user_id: parseInt(userId),
                        task_id: parseInt(taskId),
                    },
                },
            });

            if (conflictingUser) {
                return res
                    .status(422)
                    .json(apiResponse(false, "Kombinasi user_id dengan task_id sudah ada"));
            }
        }

        const userTask = await prisma.userTask.update({
            where: {
                user_id_task_id: {
                    user_id: parseInt(user_id),
                    task_id: parseInt(task_id),
                },
            },
            data: {
                user_id: parseInt(userId),
                task_id: parseInt(taskId),
            },
        });
        return res
            .status(200)
            .json(apiResponse(true, "Berhasil memperbarui UserTask", userTask));
    });

// Delete User
router.delete(
    '/delete/:user_id/:task_id',
    [checkUserTaskExists],
    async function (req, res, next) {
        const { user_id, task_id } = req.params;

        const userTask = await prisma.userTask.delete({
            where: {
                user_id_task_id: { user_id: parseInt(user_id), task_id: parseInt(task_id) }
            }
        });
        return res
            .status(200)
            .json(apiResponse(true, `Berhasil menghapus UserTask dengan user_id:${user_id} task_id:${task_id}`, userTask));
    });

module.exports = router;
