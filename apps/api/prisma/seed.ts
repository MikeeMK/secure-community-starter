import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      displayName: 'Alice',
      trustLevel: 'trusted',
      passwordHash: 'seed:seed',
    },
  });

  const group = await prisma.group.upsert({
    where: { name: 'Discussions générales' },
    update: {},
    create: { name: 'Discussions générales', isPrivate: false },
  });

  await prisma.forumTopic.create({
    data: {
      title: 'Bienvenue 👋',
      body: "Ce topic est un exemple. Remplace-le par tes règles et ton onboarding.",
      authorId: alice.id,
      groupId: group.id,
    },
  });

  console.log('Seed done');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
