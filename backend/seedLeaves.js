require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");
const Leave = require("./models/Leave");

async function seedPendingLeaves() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const users = await User.find().limit(5).lean();

    if (!users.length) {
      console.log("No users found. Create users before seeding leave data.");
      process.exit(1);
    }

    const pendingLeaves = [
      {
        user: users[0]._id,
        from: new Date("2026-09-10T00:00:00.000Z"),
        to: new Date("2026-09-12T00:00:00.000Z"),
        type: "Casual",
        reason: "Family function",
        status: "Pending",
      },
      {
        user: users[1]._id,
        from: new Date("2026-09-14T00:00:00.000Z"),
        to: new Date("2026-09-16T00:00:00.000Z"),
        type: "Sick",
        reason: "Health checkup",
        status: "Pending",
      },
      {
        user: users[2]._id,
        from: new Date("2026-09-18T00:00:00.000Z"),
        to: new Date("2026-09-20T00:00:00.000Z"),
        type: "Annual",
        reason: "Vacation",
        status: "Pending",
      },
      {
        user: users[3]._id,
        from: new Date("2026-09-22T00:00:00.000Z"),
        to: new Date("2026-09-23T00:00:00.000Z"),
        type: "Personal",
        reason: "Home visit",
        status: "Pending",
      },
      {
        user: users[4]._id,
        from: new Date("2026-09-25T00:00:00.000Z"),
        to: new Date("2026-09-27T00:00:00.000Z"),
        type: "Casual",
        reason: "Festival holiday",
        status: "Pending",
      },
    ];

    await Leave.deleteMany({ status: "Pending" });
    const created = await Leave.insertMany(pendingLeaves);

    console.log(`Seeded ${created.length} pending leave records.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seedPendingLeaves();
