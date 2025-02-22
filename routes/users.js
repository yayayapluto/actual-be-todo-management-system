var express = require("express");
var router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const apiResponse = require("../utils/api-response-map");
const { body, validationResult } = require("express-validator");

// Middleware untuk memeriksa apakah user ada berdasarkan ID
async function checkUserExists(req, res, next) {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
  });

  if (!user) {
    return res
      .status(404)
      .json(apiResponse(false, `Pengguna dengan id:${id} tidak ditemukan`));
  }

  req.user = user;
  next();
}

// Get All Users
router.get("/", async (req, res) => {
  const users = await prisma.user.findMany();

  if (users.length === 0) {
    return res
      .status(404)
      .json(apiResponse(true, "Tidak ada data pengguna", null))
  }

  return res
    .status(200)
    .json(apiResponse(true, "Berhasil mengambil semua data pengguna", users));
});

// Get User by ID
router.get("/:id", checkUserExists, async (req, res) => {
  const { id } = req.params;
  return res.status(200).json(
    apiResponse(true, `Berhasil mengambil data pengguna dengan id:${id}`, req.user)
  );
});

// Create User
router.post(
  "/",
  [
    body("username")
      .notEmpty().withMessage("Username tidak boleh kosong"),
    body("email")
      .notEmpty().withMessage("Field email tidak boleh kosong")
      .isString().withMessage("Field email harus berupa string")
      .isEmail().withMessage("Field email Tidak valid"),
    body("password")
      .notEmpty().withMessage("Field password tidak boleh kosong")
      .isString().withMessage("Field password harus berupa string")
      .isLength({ min: 6 }).withMessage("Field password minimal 6 karakter"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(422)
        .json(apiResponse(false, "Validasi gagal", errors.array()));
    }

    const { username, email, password } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: username }, { email: email }],
      },
    });

    if (existingUser) {
      return res
        .status(422)
        .json(apiResponse(false, "Nama atau Email sudah terpakai"));
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username: username,
        email: email,
        password: hashPassword,
      },
    });

    return res
      .status(200)
      .json(apiResponse(true, "Berhasil menambahkan data pengguna", user));
  }
);

// Update User
router.put(
  "/:id",
  [
    checkUserExists,
    body("email")
      .optional()
      .isString().withMessage("Field email harus berupa string")
      .isEmail().withMessage("Field email Tidak valid"),
    body("password")
      .optional()
      .isString().withMessage("Field password harus berupa string")
      .isLength({ min: 6 }).withMessage("Field password minimal 6 karakter"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(422)
        .json(apiResponse(false, "Validasi gagal", errors.array()));
    }

    const { id } = req.params;
    const { username, email, password } = req.body;

    const updateData = {};
    if (username !== undefined) updateData.username = username.trim();
    if (email !== undefined) updateData.email = email;
    if (password !== undefined) updateData.password = await bcrypt.hash(password, 10);
    if (Object.keys(updateData).length === 0) {
      return res
        .status(200)
        .json(apiResponse(false, "Tidak ada data yang diperbarui"));
    }

    const orConditions = [];
    if (updateData.username) orConditions.push({ username: updateData.username });
    if (updateData.email) orConditions.push({ email: updateData.email });
    if (orConditions.length > 0) {
      const conflictingUser = await prisma.user.findFirst({
        where: {
          id: { not: parseInt(id) },
          OR: orConditions,
        },
      });

      if (conflictingUser) {
        return res
          .status(422)
          .json(apiResponse(false, "Nama atau Email sudah terpakai"));
      }
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return res.json(
      apiResponse(true, `Berhasil memperbarui pengguna dengan id:${id}`, user)
    );
  }
);

// Delete User
router.delete("/:id", checkUserExists, async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.update({
    where: { id: parseInt(id) },
    data: {
      is_deleted: true
    }
  });

  return res
    .status(200)
    .json(apiResponse(true, `Berhasil menghapus pengguna dengan id:${id}`, user));
});

module.exports = router;