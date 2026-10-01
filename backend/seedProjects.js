require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");
const Project = require("./models/Project");
const Client = require("./models/Client");

const projectTemplates = [
  {
    name: "Aurora Website",
    client: { name: "Aurora Health", address: "18 Lakeview Road, Bengaluru", email: "hello@aurorahealth.example", contactNo: "+91 80 4123 8801" },
    progress: 72,
    accent: "#0f766e",
  },
  {
    name: "Nexus Mobile App",
    client: { name: "Nexus Finance", address: "44 Residency Avenue, Mumbai", email: "projects@nexusfinance.example", contactNo: "+91 22 4987 2210" },
    progress: 48,
    accent: "#2563eb",
  },
  {
    name: "Atlas Dashboard",
    client: { name: "Atlas Logistics", address: "7 Portside Park, Chennai", email: "contact@atlaslogistics.example", contactNo: "+91 44 3678 1450" },
    progress: 86,
    accent: "#c2410c",
  },
  {
    name: "Pulse CRM",
    client: { name: "Pulse Retail", address: "92 Market Street, Hyderabad", email: "delivery@pulseretail.example", contactNo: "+91 40 4556 9032" },
    progress: 31,
    accent: "#7c3aed",
  },
];

async function seedProjects() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({ isActive: true }).sort({ createdAt: 1 }).limit(12);

    if (users.length < 2) {
      console.log("Create at least two active users before seeding projects.");
      process.exit(1);
    }

    const clients = await Promise.all(
      projectTemplates.map((template) =>
        Client.findOneAndUpdate(
          { name: template.client.name },
          { ...template.client, isActive: true },
          { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
        )
      )
    );

    const projects = projectTemplates.map((template, index) => ({
      ...template,
      client: clients[index]._id,
      teamLead: users[index % users.length]._id,
      employees: users
        .filter((_, userIndex) => userIndex !== index % users.length)
        .slice(0, Math.min(4, users.length - 1))
        .map((user) => user._id),
      status: "Active",
      isActive: true,
    }));

    await Promise.all(
      projects.map((project) =>
        Project.findOneAndUpdate(
          { name: project.name },
          project,
          { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
        )
      )
    );

    console.log(`Seeded ${projects.length} project records.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seedProjects();