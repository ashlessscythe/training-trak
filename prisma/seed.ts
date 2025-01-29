import {
  PrismaClient,
  Role,
  DocumentType,
  TrainingStatus,
  Department,
  Position,
} from "@prisma/client";
import { faker } from "@faker-js/faker";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ROLE_PASSWORDS = {
  OWNER: "ownerpass",
  ADMIN: "adminpass",
  SITE_ADMIN: "sapass",
  SUPERVISOR: "supervisorpass",
  USER: "userpass",
  PENDING: "pendingpass",
} as const;

// Parse command line arguments
interface Arguments {
  count: number;
  "use-faker": boolean;
  clear: boolean;
}

const argv = yargs(hideBin(process.argv))
  .options({
    count: {
      alias: "c",
      description: "Number of records to generate",
      type: "number",
      default: 5,
    },
    "use-faker": {
      alias: "f",
      description: "Use faker for generating data",
      type: "boolean",
      default: true,
    },
    clear: {
      description: "Clear existing data before seeding",
      type: "boolean",
      default: false,
    },
  })
  .help()
  .parseSync() as Arguments;

async function main() {
  const count = argv.count || 5;
  const useFaker = argv["use-faker"] !== false;

  console.log(`Generating ${count} records per model...`);

  if (argv.clear) {
    console.log("Clearing existing data...");
    await prisma.trainingProgress.deleteMany();
    await prisma.document.deleteMany();
    await prisma.sOP.deleteMany();
    await prisma.user.deleteMany();
    await prisma.position.deleteMany();
    await prisma.department.deleteMany();
    await prisma.site.deleteMany();
  }

  // Create default department
  const defaultDepartment = await prisma.department.create({
    data: {
      name: "DEFAULT_DEPT",
      description: "Default department for new users",
      isActive: true,
    },
  });

  // Create other departments
  const departments = [defaultDepartment];
  const departmentNames = [
    "Operations",
    "Warehouse",
    "Quality Control",
    "Shipping",
  ];

  for (const name of departmentNames) {
    const department = await prisma.department.create({
      data: {
        name,
        description: useFaker
          ? faker.company.catchPhrase()
          : `${name} department`,
        isActive: true,
      },
    });
    departments.push(department);
  }

  // Create default position
  const defaultPosition = await prisma.position.create({
    data: {
      name: "DEFAULT_POSITION",
      description: "Default position for new users",
      isActive: true,
    },
  });

  // Create other positions
  const positions = [defaultPosition];
  const positionNames = [
    "Clerk",
    "Supervisor",
    "Loader",
    "Inspector",
    "Operator",
    "Team Lead",
  ];

  for (const name of positionNames) {
    const position = await prisma.position.create({
      data: {
        name,
        description: useFaker
          ? faker.company.catchPhrase()
          : `${name} position`,
        isActive: true,
      },
    });
    positions.push(position);
  }

  // Create sites
  const sites = await Promise.all(
    Array.from({ length: count }, async (_, index) => {
      return prisma.site.create({
        data: {
          name:
            index === 0
              ? "Default Site"
              : useFaker
              ? faker.company.name()
              : `Site ${faker.number.int({ min: 1, max: 999 })}`,
          code:
            index === 0
              ? "DEFAULT"
              : faker.string.alphanumeric(6).toUpperCase(),
          description: useFaker
            ? faker.company.catchPhrase()
            : "A sample site description",
          isActive: true,
        },
      });
    })
  );

  // Create users for each site with different roles
  const users: Array<{
    id: string;
    email: string;
    name: string;
    password: string;
    role: Role;
    isActive: boolean;
    siteId: string;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  // Create joe as siteadmin
  const defaultSiteAdmin = await prisma.user.create({
    data: {
      email: "joe@joe.joe",
      name: "Joe Admin",
      password: await bcrypt.hash("adminpass", 10),
      role: "SITE_ADMIN",
      isActive: true,
      siteId: sites[0].id,
      departmentId: defaultDepartment.id,
      positionId: defaultPosition.id,
    },
  });
  users.push(defaultSiteAdmin);

  // bob as superadmin
  const defaultAdmin = await prisma.user.create({
    data: {
      email: "bob@bob.bob",
      name: "Bob Admin",
      password: await bcrypt.hash("adminpass", 10),
      role: "ADMIN",
      isActive: true,
      siteId: sites[0].id,
      departmentId: defaultDepartment.id,
      positionId: defaultPosition.id,
    },
  });
  users.push(defaultAdmin);

  // Create other users
  for (const site of sites) {
    const roles: Role[] = [
      "OWNER",
      "ADMIN",
      "SITE_ADMIN",
      "SUPERVISOR",
      "USER",
    ];
    for (const role of roles) {
      // Skip creating another admin for the default site
      if (site.id === sites[0].id && role === "ADMIN") continue;

      const user = await prisma.user.create({
        data: {
          email: useFaker
            ? faker.internet.email().toLowerCase()
            : `${role.toLowerCase()}@${site.code.toLowerCase()}.com`,
          name: useFaker
            ? faker.person.fullName()
            : `${role} ${faker.number.int(999)}`,
          password: await bcrypt.hash(ROLE_PASSWORDS[role], 10),
          role,
          isActive: true,
          siteId: site.id,
          departmentId: faker.helpers.arrayElement(departments).id,
          positionId: faker.helpers.arrayElement(positions).id,
        },
      });
      users.push(user);
    }
  }

  // Create SOPs
  const sops = await Promise.all(
    Array.from({ length: count }, async () => {
      const createdBy = faker.helpers.arrayElement(users);
      const lastModifiedBy = faker.helpers.arrayElement(users);

      return prisma.sOP.create({
        data: {
          name: useFaker
            ? faker.commerce.productName()
            : `SOP ${faker.number.int(999)}`,
          description: useFaker
            ? faker.lorem.paragraph()
            : "A sample SOP description",
          version: `${faker.number.int({ min: 1, max: 5 })}.${faker.number.int({
            min: 0,
            max: 9,
          })}`,
          content: useFaker ? faker.lorem.paragraphs(3) : "Sample content",
          isActive: faker.datatype.boolean(),
          createdById: createdBy.id,
          lastModifiedById: lastModifiedBy.id,
          requiredRoles: faker.helpers.arrayElements(
            ["SUPERVISOR", "USER"],
            faker.number.int({ min: 1, max: 2 })
          ),
        },
      });
    })
  );

  // Create documents
  const documentTypes: DocumentType[] = [
    "TRAINING_DOCUMENT",
    "SIGNATURE_SHEET",
    "SOP_DOCUMENT",
    "OTHER",
  ];

  const documents = await Promise.all(
    Array.from({ length: count * 2 }, async () => {
      const uploadedBy = faker.helpers.arrayElement(users);
      const sop = faker.helpers.arrayElement(sops);
      const type = faker.helpers.arrayElement(documentTypes);

      return prisma.document.create({
        data: {
          name: useFaker
            ? faker.system.fileName()
            : `Document ${faker.number.int(999)}`,
          type,
          url: faker.internet.url(),
          metadata: {
            fileSize: faker.number.int({ min: 100, max: 10000 }),
            mimeType: faker.system.mimeType(),
            tags: faker.helpers.arrayElements(
              ["important", "draft", "final", "archived"],
              faker.number.int({ min: 1, max: 3 })
            ),
          },
          sopId: type === "SOP_DOCUMENT" ? sop.id : null,
          uploadedById: uploadedBy.id,
        },
      });
    })
  );

  // Create training progress records
  const trainingStatuses: TrainingStatus[] = [
    "IN_PROGRESS",
    "COMPLETED",
    "APPROVED",
    "REJECTED",
  ];

  await Promise.all(
    Array.from({ length: count * 3 }, async () => {
      const user = faker.helpers.arrayElement(users);
      const sop = faker.helpers.arrayElement(sops);
      const status = faker.helpers.arrayElement(trainingStatuses);
      const completedAt =
        status !== "IN_PROGRESS" ? faker.date.past() : undefined;
      const approvedBy =
        status === "APPROVED"
          ? faker.helpers.arrayElement(
              users.filter((u) =>
                ["OWNER", "ADMIN", "SUPERVISOR"].includes(u.role)
              )
            )
          : undefined;

      return prisma.trainingProgress.create({
        data: {
          userId: user.id,
          sopId: sop.id,
          status,
          completedAt,
          approvedById: approvedBy?.id,
          approvedAt:
            status === "APPROVED" && completedAt
              ? faker.date.between({
                  from: completedAt,
                  to: new Date(),
                })
              : undefined,
          notes: useFaker ? faker.lorem.sentence() : undefined,
        },
      });
    })
  );

  console.log("Seed data created successfully!");
  console.log(`Created:
- ${sites.length} sites
- ${departments.length} departments (including DEFAULT_DEPT)
- ${positions.length} positions (including DEFAULT_POSITION)
- ${users.length} users (including default admin bob@bob.bob)
- ${sops.length} SOPs
- ${documents.length} documents
- ${count * 3} training progress records`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
