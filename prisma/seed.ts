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

  // Create sites first
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

  // Create departments and positions for each site
  const departments: Department[] = [];
  const positions: Position[] = [];

  // Default department and position for the default site
  const defaultDepartment = await prisma.department.create({
    data: {
      name: "DEFAULT_DEPT",
      description: "Default department for new users",
      isActive: true,
      site: {
        connect: { id: sites[0].id },
      },
    },
  });
  departments.push(defaultDepartment);

  const defaultPosition = await prisma.position.create({
    data: {
      name: "DEFAULT_POSITION",
      description: "Default position for new users",
      isActive: true,
      site: {
        connect: { id: sites[0].id },
      },
    },
  });
  positions.push(defaultPosition);

  // Department categories to generate more realistic department names
  const departmentCategories = [
    ["Manufacturing", "Production", "Assembly", "Fabrication"],
    ["Quality Control", "Quality Assurance", "Inspection", "Testing"],
    ["Logistics", "Shipping", "Receiving", "Warehouse"],
    ["Maintenance", "Facilities", "Engineering", "Technical Support"],
    ["Operations", "Process Control", "Planning", "Scheduling"],
    ["Safety", "Environmental", "Compliance", "Training"],
  ];

  // Position categories to generate more realistic position names
  const positionCategories = [
    ["Manager", "Supervisor", "Lead", "Coordinator"],
    ["Technician", "Specialist", "Operator", "Analyst"],
    ["Engineer", "Designer", "Developer", "Planner"],
    ["Inspector", "Auditor", "Tester", "Examiner"],
    ["Assistant", "Associate", "Helper", "Support"],
  ];

  // Create varied departments and positions for each site
  for (const site of sites) {
    // Generate 3-6 random departments for each site
    const numDepartments = faker.number.int({ min: 3, max: 6 });
    const siteCategories = faker.helpers.arrayElements(
      departmentCategories,
      numDepartments
    );

    for (const category of siteCategories) {
      const deptName = faker.helpers.arrayElement(category);
      const department = await prisma.department.create({
        data: {
          name: `${deptName} ${faker.number.int({ min: 1, max: 3 })}`,
          description: faker.company.catchPhrase(),
          isActive: faker.helpers.arrayElement([true, true, true, false]), // 75% chance of being active
          site: {
            connect: { id: site.id },
          },
        },
      });
      departments.push(department);

      // Create 2-4 positions for each department
      const numPositions = faker.number.int({ min: 2, max: 4 });
      const positionTypes = faker.helpers.arrayElements(
        positionCategories,
        numPositions
      );

      for (const type of positionTypes) {
        const posName = faker.helpers.arrayElement(type);
        const position = await prisma.position.create({
          data: {
            name: `${deptName} ${posName}`,
            description: faker.company.catchPhrase(),
            isActive: faker.helpers.arrayElement([true, true, true, false]), // 75% chance of being active
            site: {
              connect: { id: site.id },
            },
          },
        });
        positions.push(position);
      }
    }
  }

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
    departmentId?: string;
    positionId?: string;
  }> = [];

  // Create joe as siteadmin
  const defaultSiteAdmin = await prisma.user.create({
    data: {
      email: "joe@joe.joe",
      name: "Joe Admin",
      password: await bcrypt.hash("sapass", 10),
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

  // Create one site admin per site (except for default site which already has joe)
  for (const site of sites) {
    // Skip the default site as it already has a site admin (joe)
    if (site.id === sites[0].id) continue;

    // Filter departments and positions for this site
    const siteDepartments = departments.filter(
      (dept) => dept.siteId === site.id
    );
    const sitePositions = positions.filter((pos) => pos.siteId === site.id);

    // Create one site admin for this site
    const siteAdmin = await prisma.user.create({
      data: {
        email: useFaker
          ? faker.internet.email().toLowerCase()
          : `siteadmin@${site.code.toLowerCase()}.com`,
        name: useFaker ? faker.person.fullName() : `Site Admin ${site.code}`,
        password: await bcrypt.hash(ROLE_PASSWORDS["SITE_ADMIN"], 10),
        role: "SITE_ADMIN",
        isActive: true,
        siteId: site.id,
        departmentId: faker.helpers.arrayElement(siteDepartments).id,
        positionId: faker.helpers.arrayElement(sitePositions).id,
      },
    });
    users.push(siteAdmin);
  }

  // Create other users
  for (const site of sites) {
    // Filter departments and positions for this site
    const siteDepartments = departments.filter(
      (dept) => dept.siteId === site.id
    );
    const sitePositions = positions.filter((pos) => pos.siteId === site.id);

    const roles: Role[] = ["OWNER", "ADMIN", "SUPERVISOR", "USER"];
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
          departmentId: faker.helpers.arrayElement(siteDepartments).id,
          positionId: faker.helpers.arrayElement(sitePositions).id,
        },
      });
      users.push(user);
    }
  }

  // Define interface for SOP with category
  interface SOPWithCategory {
    id: string;
    name: string;
    description: string | null;
    version: string;
    content: string | null;
    isActive: boolean;
    createdById: string;
    lastModifiedById: string;
    createdAt: Date;
    updatedAt: Date;
    category: string;
    siteId: string;
  }

  // Define SOP categories that align with department types
  const sopCategories = {
    Manufacturing: [
      "Equipment Operation",
      "Assembly Line",
      "Quality Control",
      "Material Handling",
    ],
    Quality: [
      "Inspection Protocol",
      "Testing Procedure",
      "Quality Metrics",
      "Defect Analysis",
    ],
    Logistics: [
      "Shipping Protocol",
      "Inventory Management",
      "Warehouse Safety",
      "Material Storage",
    ],
    Maintenance: [
      "Equipment Maintenance",
      "Preventive Maintenance",
      "Repair Procedure",
      "Tool Management",
    ],
    Safety: [
      "Emergency Response",
      "Safety Protocol",
      "PPE Requirements",
      "Incident Reporting",
    ],
  };

  // Create SOPs with categories for each site
  const sops: SOPWithCategory[] = [];
  for (const site of sites) {
    // Get users for this site
    const siteUsers = users.filter((user) => user.siteId === site.id);

    for (const [category, procedures] of Object.entries(sopCategories)) {
      for (const procedure of procedures) {
        const createdBy = faker.helpers.arrayElement(siteUsers);
        const lastModifiedBy = faker.helpers.arrayElement(siteUsers);

        const sop = await prisma.sOP.create({
          data: {
            name: `${site.code} - ${procedure} SOP`,
            description: `Standard Operating Procedure for ${procedure} at ${site.name}`,
            version: `${faker.number.int({
              min: 1,
              max: 5,
            })}.${faker.number.int({
              min: 0,
              max: 9,
            })}`,
            content: useFaker ? faker.lorem.paragraphs(3) : "Sample content",
            isActive: true,
            createdById: createdBy.id,
            lastModifiedById: lastModifiedBy.id,
            requiredRoles: faker.helpers.arrayElements(
              ["SUPERVISOR", "USER"],
              faker.number.int({ min: 1, max: 2 })
            ),
          },
        });
        sops.push({ ...sop, category, siteId: site.id });
      }
    }
  }

  // Assign SOPs to positions based on department type and site
  for (const position of positions) {
    // Skip the default position
    if (position.name === "DEFAULT_POSITION") continue;

    // Determine which category of SOPs to assign based on position name
    const relevantCategories = Object.keys(sopCategories).filter((category) =>
      position.name.toLowerCase().includes(category.toLowerCase())
    );

    if (relevantCategories.length > 0) {
      // Get SOPs from relevant categories that belong to the same site as the position
      const relevantSops = sops.filter(
        (sop) =>
          relevantCategories.includes(sop.category) &&
          sop.siteId === position.siteId
      );

      if (relevantSops.length > 0) {
        // Select 2-4 random SOPs from relevant ones (or all if less than 2)
        const numToSelect = Math.min(
          faker.number.int({ min: 2, max: 4 }),
          relevantSops.length
        );
        const selectedSops = faker.helpers.arrayElements(
          relevantSops,
          numToSelect
        );

        // Update position with selected SOPs
        await prisma.position.update({
          where: { id: position.id },
          data: {
            sops: {
              connect: selectedSops.map((sop) => ({ id: sop.id })),
            },
          },
        });
      }
    }
  }

  // Create documents
  const documentTypes: DocumentType[] = [
    "TRAINING_DOCUMENT",
    "SIGNATURE_SHEET",
    "SOP_DOCUMENT",
    "OTHER",
  ];

  const documents = await Promise.all(
    Array.from({ length: count * 5 }, async () => {
      // Select a random site
      const site = faker.helpers.arrayElement(sites);
      // Get users for this site
      const siteUsers = users.filter((user) => user.siteId === site.id);
      // Get SOPs for this site
      const siteSops = sops.filter((sop) => sop.siteId === site.id);

      const uploadedBy = faker.helpers.arrayElement(siteUsers);
      const sop =
        siteSops.length > 0 ? faker.helpers.arrayElement(siteSops) : null;
      const type = faker.helpers.arrayElement(documentTypes);

      // Generate a descriptive name with extension
      const extensions = ["txt", "pdf", "docx", "xlsx", "csv"];
      const extension = faker.helpers.arrayElement(extensions);
      const docType = type.toLowerCase().replace(/_/g, "-");
      const timestamp = faker.date.recent().toISOString().split("T")[0];
      const name = `${docType}-${timestamp}-${faker.string.alphanumeric(
        6
      )}.${extension}`;

      // Generate appropriate content based on extension
      let content: Buffer;
      if (extension === "txt") {
        content = Buffer.from(faker.lorem.paragraphs(3));
      } else {
        // For other types, create a larger buffer to simulate real documents
        content = Buffer.from(
          faker.lorem.paragraphs(10) + faker.lorem.paragraphs(10)
        );
      }

      return prisma.document.create({
        data: {
          name,
          type,
          content,
          metadata: {
            fileSize: content.length,
            mimeType:
              extension === "txt"
                ? "text/plain"
                : extension === "pdf"
                ? "application/pdf"
                : extension === "docx"
                ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                : extension === "xlsx"
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : "text/csv",
            uploadDate: new Date().toISOString(),
            tags: faker.helpers.arrayElements(
              ["important", "draft", "final", "archived"],
              faker.number.int({ min: 1, max: 3 })
            ),
          },
          sopId: type === "SOP_DOCUMENT" && sop ? sop.id : null,
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
      // Select a random site
      const site = faker.helpers.arrayElement(sites);
      // Get users for this site
      const siteUsers = users.filter((user) => user.siteId === site.id);
      // Get SOPs for this site
      const siteSops = sops.filter((sop) => sop.siteId === site.id);

      // Skip if no users or SOPs for this site
      if (siteUsers.length === 0 || siteSops.length === 0) {
        return null;
      }

      const user = faker.helpers.arrayElement(siteUsers);
      const sop = faker.helpers.arrayElement(siteSops);
      const status = faker.helpers.arrayElement(trainingStatuses);
      const completedAt =
        status !== "IN_PROGRESS" ? faker.date.past() : undefined;

      // Get approvers from the same site
      const siteApprovers = siteUsers.filter((u) =>
        ["OWNER", "ADMIN", "SUPERVISOR", "SITE_ADMIN"].includes(u.role)
      );

      const approvedBy =
        status === "APPROVED" && siteApprovers.length > 0
          ? faker.helpers.arrayElement(siteApprovers)
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
