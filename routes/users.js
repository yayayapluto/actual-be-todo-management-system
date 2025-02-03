var express = require('express');
var router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const { stringify } = require('jade/lib/utils');

// Get All Users
router.get('/get-all', async function (req, res, next) {
  const users = await prisma.user.findMany();
  res.send(users)
});

// Get User by ID
router.get('/get-user/:id', async function (req, res, next) {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: {
      id: parseInt(id),
    },
  });
  res.send(user)
});

// Create User
router.post('/create', async function (req, res, next) {
  const { name, email, password } = req.body;
  const hashPassword = await bcrypt.hash(password, 10);
  const stringPassword = await stringify(hashPassword);
  const user = await prisma.user.create({
    data: {
      username: name,
      email,
      password: stringPassword,
    },
  });
  res.send(user)
});

// Update User
router.put('/update/:id', async function (req, res, next) {
  const { id } = req.params;
  const { name, email, password } = req.body;
  const hashPassword = bcrypt.hash(password, 10);
  const stringPassword = stringify(hashPassword);
  const user = await prisma.user.update({
    where: {
      id: parseInt(id),
    },
    data: {
      username: name,
      email,
      password: stringPassword,
    },
  });
  res.send(user)
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
