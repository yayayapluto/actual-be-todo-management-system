const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');
const bcrypt = require("bcrypt")

const prisma = new PrismaClient();

/**
 * Seeding untuk model User, Task, dan UserTask
 * Cara pakai: npm run seed
 */

async function main() {
    await userSeed(5);
    await taskSeed(50);
}

async function userSeed(userCount = 20) {
    await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "User" RESTART IDENTITY CASCADE`
    );
    const users = [];
    for (let i = 0; i < userCount; i++) {
        const username = faker.person.firstName();
        const email = faker.internet.email({ firstName: username });
        const password = await bcrypt.hash("password123", 10);
        const user = {
            username: username,
            email: email,
            password: password,
        };
        users.push(user);
    }
    await prisma.user.createMany({ data: users });
}

async function taskSeed(taskCount = 50) {
    await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "Task" RESTART IDENTITY CASCADE`
    );

    const allUsers = await prisma.user.findMany({ select: { id: true, username: true } });
    const priorityChoices = ['low', 'medium', 'high'];
    for (let i = 0; i < taskCount; i++) {
        const title =
            'bullying a person with ' + faker.person.zodiacSign() + ' zodiac';
        const desc = faker.word.words({ count: 10 });
        const priority =
            priorityChoices[Math.floor(Math.random() * priorityChoices.length)];
        const deadline = faker.date.anytime().toISOString();
        const is_done = false;
        const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
        const created_by = randomUser.username;
        const task = {
            title: title,
            desc: desc,
            priority: priority,
            deadline: deadline,
            is_done: is_done,
            created_by: created_by,
        };

        const newtask = await prisma.task.create({data: task})

        await prisma.userTask.create({
            data: {
                user_id: randomUser.id,
                task_id: newtask.id
            }
        })
    }
}

main()
    .catch((e) => {
        console.log(e);
        process.exit(1);
    })
    .finally(async () => {
        console.log('Seeding Done!');
        await prisma.$disconnect();
    });
