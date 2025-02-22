var express = require('express');
var router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const { body, validationResult } = require("express-validator");
const apiResponse = require('../utils/api-response-map');

// Middleware untuk memeriksa apakah task ada berdasarkan ID
async function checkTaskExist(req, res, next) {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
        where: { id: parseInt(id) }
    })

    if (!task) {
        return res
            .status(404)
            .json(apiResponse(false, `Tugas dengan id:${id} tidak ditemukan`))
    }

    req.task = task
    next()
}

// Get All Tasks
router.get("/", async (req, res, next) => {
    const tasks = await prisma.task.findMany();

    if (tasks.length === 0) {
        return res
            .status(404)
            .json(apiResponse(true, "Tidak ada data tugas", null))
    }

    return res
        .status(200)
        .json(apiResponse(true, "Berhasil mengambil semua data tugas", tasks))
})

// Get Task By ID
router.get("/:id", checkTaskExist, async (req, res, next) => {
    const { id } = req.params;
    return res.status(200).json(
        apiResponse(true, `Berhasil mengambil data pengguna dengan id:${id}`, req.task)
    );
})

// Create Task
router.post(
    "/",
    [
        body("title")
            .notEmpty().withMessage("Field title tidak boleh kosong")
            .isString().withMessage("Field title haurs berupa string"),
        body("desc")
            .notEmpty().withMessage("Field desc tidak boleh kosong")
            .isString().withMessage("Field desc harus berupa string"),
        body("priority")
            .notEmpty().withMessage("Field priority tidak boleh kosong")
            .isString().withMessage("Field priority harus berupa string"),
        body("deadline")
            .notEmpty().withMessage("Field deadline tidak boleh kosong")
            .isString().withMessage("Field deadline harus berupa string"),
        body("is_done")
            .notEmpty().withMessage("Field is_done tidak boleh kosong")
            .isBoolean().withMessage("Field is_done harus berupa boolean"),
        body("created_by")
            .notEmpty().withMessage("Field created_by tidak boleh kosong")
            .isString().withMessage("Field created_by harus berupa string"),
    ],
    async (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res
                .status(422)
                .json(apiResponse(false, "Validasi gagal", errors.array()))
        }

        const { title, desc, priority, deadline, is_done, created_by } = req.body

        const existingTask = await prisma.task.findFirst({
            where: {
                title: title
            }
        })

        if (existingTask) {
            return res
                .status(422)
                .json(apiResponse(false, "Judul sudah terpakai"))
        }

        const task = await prisma.task.create(
            {
                data: {
                    title: title,
                    desc: desc,
                    priority: priority,
                    deadline: deadline,
                    is_done: is_done,
                    created_by: created_by
                }
            }
        )

        return res
            .status(200)
            .json(apiResponse(true, "Berhasil menambahkan data tugas", task))
    }
)

// Update Task
router.put(
    "/:id",
    [
        checkTaskExist,
        body("title")
            .optional()
            .isString().withMessage("Field title haurs berupa string"),
        body("desc")
            .optional()
            .isString().withMessage("Field desc harus berupa string"),
        body("priority")
            .optional()
            .isString().withMessage("Field priority harus berupa string"),
        body("deadline")
            .optional()
            .isString().withMessage("Field deadline harus berupa string"),
        body("is_done")
            .optional()
            .isBoolean().withMessage("Field is_done harus berupa boolean"),
        body("created_by")
            .optional()
            .isString().withMessage("Field created_by harus berupa string"),
    ],
    async (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res
                .status(422)
                .json(apiResponse(false, "Validasi gagal", errors.array()));
        }

        const { id } = req.params;
        const { title, desc, priority, deadline, is_done, created_by } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title.trim();
        if (desc !== undefined) updateData.desc = desc.trim();
        if (priority !== undefined) updateData.priority = priority.trim();
        if (deadline !== undefined) updateData.deadline = deadline.trim();
        if (is_done !== undefined) updateData.is_done = is_done;
        if (created_by !== undefined) updateData.created_by = created_by;
        if (Object.keys(updateData).length === 0) {
            return res
                .status(200)
                .json(apiResponse(false, "Tidak ada data yang diperbarui"));
        }

        const orConditions = []
        if (updateData.title) orConditions.push({ title: updateData.title })
        if (updateData.desc) orConditions.push({ desc: updateData.desc })
        if (updateData.priority) orConditions.push({ priority: updateData.priority })
        if (updateData.deadline) orConditions.push({ deadline: updateData.deadline })
        if (updateData.is_done) orConditions.push({ is_done: updateData.is_done })
        if (updateData.created_by) orConditions.push({ created_by: updateData.created_by })
        if (orConditions.length > 0) {
            const conflictingTask = await prisma.task.findFirst({
                where: {
                    id: { not: parseInt(id) },
                    OR: [
                        { title: title }
                    ],
                },
            });

            if (conflictingTask) {
                return res
                    .status(422)
                    .json(apiResponse(false, "Judul sudah terpakai"));
            }
        }

        const task = await prisma.task.update({
            where: { id: parseInt(id) },
            data: updateData,
        });

        return res.json(
            apiResponse(true, `Berhasil memperbarui pengguna dengan id:${id}`, task)
        );
    }
)

// Delete Task
router.delete("/:id", checkTaskExist, async (req, res) => {
    const { id } = req.params;
    const task = await prisma.task.update({
        where: { id: parseInt(id) },
        data: {
            is_deleted: true
        }
    });

    return res
        .status(200)
        .json(apiResponse(true, `Berhasil menghapus pengguna dengan id:${id}`, task));
});

module.exports = router;