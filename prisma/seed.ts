import {
  PrismaClient,
  Role,
  DocumentType,
  TrainingStatus,
  Department,
  Position,
  Shift,
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
  force: boolean;
  "add-sites": boolean;
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
    force: {
      description: "Force clearing existing data and recreating all seed data",
      type: "boolean",
      default: false,
    },
    "add-sites": {
      description: "Create new sites instead of using existing ones",
      type: "boolean",
      default: false,
    },
  })
  .help()
  .parseSync() as Arguments;

// Define site interface to avoid any[] type
interface SiteWithDetails {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

async function main() {
  const count = argv.count || 5;
  const useFaker = argv["use-faker"] !== false;
  const force = argv.force || false;
  const addSites = argv["add-sites"] || false;

  // Check if data already exists beyond just the admin user
  const existingSitesCount = await prisma.site.count();
  const existingUsersCount = await prisma.user.count();
  const adminUserExists = await prisma.user.findFirst({
    where: { email: "admin@admin.admin" },
  });

  // Check if we have more than just the admin user
  const hasOnlyAdminUser = adminUserExists && existingUsersCount === 1;
  const hasSubstantialData = existingSitesCount > 0 && existingUsersCount > 1;

  // If we have substantial data and no force flag, exit
  if (hasSubstantialData && !force) {
    console.log(
      "Database already contains data beyond the admin user. Use --force to clear and recreate all data."
    );
    console.log(
      `Existing data: ${existingSitesCount} sites, ${existingUsersCount} users`
    );
    return;
  }

  console.log(`Generating ${count} records per model...`);

  // Clear data if --force is used or --clear is used
  if (force || argv.clear) {
    console.log("Clearing existing data...");
    await prisma.trainingProgress.deleteMany();
    await prisma.document.deleteMany();
    await prisma.sOP.deleteMany();
    await prisma.user.deleteMany();
    await prisma.position.deleteMany();
    await prisma.department.deleteMany();
    await prisma.site.deleteMany();
  }

  // Check for default site
  let defaultSite = await prisma.site.findFirst({
    where: { code: "DEFAULT" },
  });

  // Create sites
  const sites: SiteWithDetails[] = [];

  // Create default site if it doesn't exist
  if (!defaultSite) {
    defaultSite = await prisma.site.create({
      data: {
        name: "Default Site",
        code: "DEFAULT",
        description: "A sample site description",
        isActive: true,
      },
    });
  }
  sites.push(defaultSite);

  // Get existing sites or create new ones based on the add-sites flag
  // Always proceed if we only have the admin user
  if (count > 1 || force || hasOnlyAdminUser) {
    if (addSites) {
      // Create additional sites (original behavior)
      const additionalSites = await Promise.all(
        Array.from({ length: count - 1 }, async () => {
          const siteCode = faker.string.alphanumeric(6).toUpperCase();
          // Check if site with this code already exists
          const existingSite = await prisma.site.findFirst({
            where: { code: siteCode },
          });

          if (existingSite && !force) {
            return existingSite;
          }

          return prisma.site.create({
            data: {
              name: useFaker
                ? faker.company.name()
                : `Site ${faker.number.int({ min: 1, max: 999 })}`,
              code: siteCode,
              description: useFaker
                ? faker.company.catchPhrase()
                : "A sample site description",
              isActive: true,
            },
          });
        })
      );
      sites.push(...additionalSites);
    } else {
      // Use existing sites instead of creating new ones
      const existingSites = await prisma.site.findMany({
        where: {
          code: { not: "DEFAULT" }, // Exclude the default site which we already have
        },
        take: count - 1, // Limit to count-1 since we already have the default site
      });

      if (existingSites.length > 0) {
        sites.push(...existingSites);
        console.log(
          `Using ${existingSites.length} existing sites instead of creating new ones.`
        );
      } else {
        console.log(
          "No existing sites found other than DEFAULT. Consider using --add-sites to create new sites."
        );
      }
    }
  }

  // Create departments and positions for each site
  const departments: Department[] = [];
  const positions: Position[] = [];

  // Check for default department and position
  let defaultDepartment = await prisma.department.findFirst({
    where: {
      name: "DEFAULT_DEPT",
      siteId: defaultSite.id,
    },
  });

  if (!defaultDepartment) {
    defaultDepartment = await prisma.department.create({
      data: {
        name: "DEFAULT_DEPT",
        description: "Default department for new users",
        isActive: true,
        site: {
          connect: { id: defaultSite.id },
        },
      },
    });
  }
  departments.push(defaultDepartment);

  let defaultPosition = await prisma.position.findFirst({
    where: {
      name: "DEFAULT_POSITION",
      siteId: defaultSite.id,
    },
  });

  if (!defaultPosition) {
    defaultPosition = await prisma.position.create({
      data: {
        name: "DEFAULT_POSITION",
        description: "Default position for new users",
        isActive: true,
        site: {
          connect: { id: defaultSite.id },
        },
      },
    });
  }
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
  if (count > 1 || force || hasOnlyAdminUser) {
    for (const site of sites) {
      // Skip default site if we already have default department and position
      if (site.id === defaultSite.id && !force) continue;

      // Generate 3-6 random departments for each site
      const numDepartments = faker.number.int({ min: 3, max: 6 });
      const siteCategories = faker.helpers.arrayElements(
        departmentCategories,
        numDepartments
      );

      for (const category of siteCategories) {
        const deptName = faker.helpers.arrayElement(category);
        const departmentName = `${deptName} ${faker.number.int({
          min: 1,
          max: 3,
        })}`;

        // Check if department already exists for this site
        const existingDepartment = await prisma.department.findFirst({
          where: {
            name: departmentName,
            siteId: site.id,
          },
        });

        const department =
          existingDepartment ||
          (await prisma.department.create({
            data: {
              name: departmentName,
              description: faker.company.catchPhrase(),
              isActive: faker.helpers.arrayElement([true, true, true, false]), // 75% chance of being active
              site: {
                connect: { id: site.id },
              },
            },
          }));

        if (!existingDepartment) {
          departments.push(department);
        }

        // Create 2-4 positions for each department
        const numPositions = faker.number.int({ min: 2, max: 4 });
        const positionTypes = faker.helpers.arrayElements(
          positionCategories,
          numPositions
        );

        for (const type of positionTypes) {
          const posName = faker.helpers.arrayElement(type);
          const positionName = `${deptName} ${posName}`;

          // Check if position already exists for this site
          const existingPosition = await prisma.position.findFirst({
            where: {
              name: positionName,
              siteId: site.id,
            },
          });

          const position =
            existingPosition ||
            (await prisma.position.create({
              data: {
                name: positionName,
                description: faker.company.catchPhrase(),
                isActive: faker.helpers.arrayElement([true, true, true, false]), // 75% chance of being active
                site: {
                  connect: { id: site.id },
                },
              },
            }));

          if (!existingPosition) {
            positions.push(position);
          }
        }
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

  // Check for default admin
  let defaultAdmin = await prisma.user.findFirst({
    where: { email: "admin@admin.admin" },
  });

  if (!defaultAdmin) {
    defaultAdmin = await prisma.user.create({
      data: {
        email: "admin@admin.admin",
        name: "System Admin",
        password: await bcrypt.hash("adminpass", 10),
        role: "ADMIN",
        isActive: true,
        siteId: defaultSite.id,
        departmentId: defaultDepartment.id,
        positionId: defaultPosition.id,
        ssoId: generateRandomSsoId(),
        shift: getRandomShift(),
      },
    });
  }
  users.push(defaultAdmin);

  // Create joe and bob for first non-default site if it exists
  if (sites.length > 1) {
    const firstNonDefaultSite = sites.find(
      (site) => site.id !== defaultSite.id
    );
    if (firstNonDefaultSite) {
      // Filter departments and positions for this site
      const siteDepartments = departments.filter(
        (dept) => dept.siteId === firstNonDefaultSite.id
      );
      const sitePositions = positions.filter(
        (pos) => pos.siteId === firstNonDefaultSite.id
      );

      // Only create if we have departments and positions for this site
      if (siteDepartments.length > 0 && sitePositions.length > 0) {
        // Check for existing joe
        let joeSiteAdmin = await prisma.user.findFirst({
          where: { email: "joe@joe.joe" },
        });

        if (!joeSiteAdmin) {
          joeSiteAdmin = await prisma.user.create({
            data: {
              email: "joe@joe.joe",
              name: "Joe Admin",
              password: await bcrypt.hash("sapass", 10),
              role: "SITE_ADMIN",
              isActive: true,
              siteId: firstNonDefaultSite.id,
              departmentId: faker.helpers.arrayElement(siteDepartments).id,
              positionId: faker.helpers.arrayElement(sitePositions).id,
              ssoId: generateRandomSsoId(),
              shift: getRandomShift(),
            },
          });
        }
        users.push(joeSiteAdmin);

        // Check for existing bob
        let bobAdmin = await prisma.user.findFirst({
          where: { email: "bob@bob.bob" },
        });

        if (!bobAdmin) {
          bobAdmin = await prisma.user.create({
            data: {
              email: "bob@bob.bob",
              name: "Bob Admin",
              password: await bcrypt.hash("adminpass", 10),
              role: "ADMIN",
              isActive: true,
              siteId: firstNonDefaultSite.id,
              departmentId: faker.helpers.arrayElement(siteDepartments).id,
              positionId: faker.helpers.arrayElement(sitePositions).id,
              ssoId: generateRandomSsoId(),
              shift: getRandomShift(),
            },
          });
        }
        users.push(bobAdmin);
      }
    }
  }

  // Create one site admin per site (except for default site and first non-default site which already has joe)
  if (count > 1 || force || hasOnlyAdminUser) {
    for (const site of sites) {
      // Skip the default site and first non-default site
      if (
        site.id === defaultSite.id ||
        (sites.length > 1 &&
          site.id === sites.find((s) => s.id !== defaultSite.id)?.id)
      )
        continue;

      // Filter departments and positions for this site
      const siteDepartments = departments.filter(
        (dept) => dept.siteId === site.id
      );
      const sitePositions = positions.filter((pos) => pos.siteId === site.id);

      // Skip if no departments or positions
      if (siteDepartments.length === 0 || sitePositions.length === 0) continue;

      // Check for existing site admin
      const siteAdminEmail = useFaker
        ? faker.internet.email().toLowerCase()
        : `siteadmin@${site.code.toLowerCase()}.com`;

      let siteAdmin = await prisma.user.findFirst({
        where: {
          email: siteAdminEmail,
          siteId: site.id,
        },
      });

      if (!siteAdmin) {
        siteAdmin = await prisma.user.create({
          data: {
            email: siteAdminEmail,
            name: useFaker
              ? faker.person.fullName()
              : `Site Admin ${site.code}`,
            password: await bcrypt.hash(ROLE_PASSWORDS["SITE_ADMIN"], 10),
            role: "SITE_ADMIN",
            isActive: true,
            siteId: site.id,
            departmentId: faker.helpers.arrayElement(siteDepartments).id,
            positionId: faker.helpers.arrayElement(sitePositions).id,
            ssoId: generateRandomSsoId(),
            shift: getRandomShift(),
          },
        });
      }
      users.push(siteAdmin);
    }
  }

  // Create other users (skip default site)
  if (count > 1 || force || hasOnlyAdminUser) {
    for (const site of sites) {
      // Skip the default site - only admin user there
      if (site.id === defaultSite.id) continue;

      // Filter departments and positions for this site
      const siteDepartments = departments.filter(
        (dept) => dept.siteId === site.id
      );
      const sitePositions = positions.filter((pos) => pos.siteId === site.id);

      // Skip if no departments or positions
      if (siteDepartments.length === 0 || sitePositions.length === 0) continue;

      const roles: Role[] = ["OWNER", "ADMIN", "SUPERVISOR", "USER"];
      for (const role of roles) {
        // Skip creating another admin for the first non-default site if it already has bob
        if (
          sites.length > 1 &&
          site.id === sites.find((s) => s.id !== defaultSite.id)?.id &&
          role === "ADMIN"
        )
          continue;

        const userEmail = useFaker
          ? faker.internet.email().toLowerCase()
          : `${role.toLowerCase()}@${site.code.toLowerCase()}.com`;

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
          where: {
            email: userEmail,
            siteId: site.id,
          },
        });

        if (!existingUser) {
          const user = await prisma.user.create({
            data: {
              email: userEmail,
              name: useFaker
                ? faker.person.fullName()
                : `${role} ${faker.number.int(999)}`,
              password: await bcrypt.hash(ROLE_PASSWORDS[role], 10),
              role,
              isActive: true,
              siteId: site.id,
              departmentId: faker.helpers.arrayElement(siteDepartments).id,
              positionId: faker.helpers.arrayElement(sitePositions).id,
              ssoId: generateRandomSsoId(),
              shift: getRandomShift(),
            },
          });
          users.push(user);
        }
      }
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

  if (count > 0 || force || hasOnlyAdminUser) {
    for (const site of sites) {
      // Get users for this site
      const siteUsers = users.filter((user) => user.siteId === site.id);

      // Skip if no users for this site
      if (siteUsers.length === 0) continue;

      for (const [category, procedures] of Object.entries(sopCategories)) {
        for (const procedure of procedures) {
          const sopName = `${site.code} - ${procedure} SOP`;

          // Check if SOP already exists
          const existingSop = await prisma.sOP.findFirst({
            where: { name: sopName },
          });

          if (existingSop) {
            sops.push({ ...existingSop, category, siteId: site.id });
            continue;
          }

          const createdBy = faker.helpers.arrayElement(siteUsers);
          const lastModifiedBy = faker.helpers.arrayElement(siteUsers);

          const sop = await prisma.sOP.create({
            data: {
              name: sopName,
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
          siteId: site.id,
        },
      });
    })
  );

  // Create training progress records
  const trainingStatuses: TrainingStatus[] = ["IN_PROGRESS", "COMPLETED"];

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

      return prisma.trainingProgress.create({
        data: {
          userId: user.id,
          sopId: sop.id,
          status,
          completedAt,
          notes: useFaker ? faker.lorem.sentence() : undefined,
        },
      });
    })
  );

  console.log("Seed data created successfully!");
  console.log(`Created:
- ${sites.length} sites${!addSites ? " (using existing sites)" : ""}
- ${departments.length} departments (including DEFAULT_DEPT)
- ${positions.length} positions (including DEFAULT_POSITION)
- ${users.length} users (including default admin bob@bob.bob)
- ${sops.length} SOPs
- ${documents.length} documents
- ${count * 3} training progress records`);
}

// Helper function to generate a random 6-digit SSOID
function generateRandomSsoId(): string {
  return faker.string.numeric(6);
}

// Helper function to get a random shift
function getRandomShift(): Shift {
  return faker.helpers.arrayElement([Shift.FIRST, Shift.SECOND, Shift.THIRD]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
