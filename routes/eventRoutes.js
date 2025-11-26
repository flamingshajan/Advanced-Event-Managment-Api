const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const router = express.Router();

const dataFilePath = path.join(__dirname, "..", "data", "events.json");

// ---------- helpers ----------

async function readEvents() {
  try {
    const data = await fs.readFile(dataFilePath, "utf-8");
    if (!data.trim()) return [];
    return JSON.parse(data);
  } catch (err) {
    // If file missing, treat as empty list
    if (err.code === "ENOENT") return [];
    throw new Error("Failed to read events data (file may be corrupted).");
  }
}

async function writeEvents(events) {
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
  await fs.writeFile(dataFilePath, JSON.stringify(events, null, 2));
}

function generateId() {
  return Date.now().toString() + "-" + Math.floor(Math.random() * 100000);
}

// ---------- POST /api/events (Create) ----------
// Task 1
router.post("/", async (req, res, next) => {
  try {
    const { eventName, date, location, description, tags } = req.body;

    if (!eventName || !date || !location) {
      return res.status(400).json({
        error: "eventName, date, and location are required.",
      });
    }

    const events = await readEvents();

    // Duplicate check by eventName + date (no user/auth as requested)
    const duplicate = events.find(
      (e) => e.eventName === eventName && e.date === date
    );
    if (duplicate) {
      return res.status(409).json({
        error: "An event with the same eventName and date already exists.",
      });
    }

    const newEvent = {
      id: generateId(),
      eventName,
      date,
      location,
      description: description || "",
      tags: Array.isArray(tags) ? tags : tags ? [tags] : [],
    };

    events.push(newEvent);
    await writeEvents(events);

    res.status(201).json(newEvent);
  } catch (err) {
    next(err);
  }
});

// ---------- GET /api/events (Read all) ----------
// Task 2
router.get("/", async (req, res, next) => {
  try {
    const events = await readEvents();
    // If no events, return empty array as required
    res.json(events);
  } catch (err) {
    next(err);
  }
});

// ---------- PUT /api/events/:id (Update) ----------
// Task 3
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { location, description, tags, date, eventName, ...rest } = req.body;

    // Prevent changing id or eventName as per instructions
    if (eventName) {
      return res
        .status(400)
        .json({ error: "eventName cannot be updated for an existing event." });
    }
    if (rest.id) {
      return res
        .status(400)
        .json({ error: "id cannot be modified for an existing event." });
    }

    if (
      location === undefined &&
      description === undefined &&
      tags === undefined &&
      date === undefined
    ) {
      return res.status(400).json({
        error:
          "Provide at least one field to update: location, description, tags, or date.",
      });
    }

    const events = await readEvents();
    const index = events.findIndex((e) => e.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Event not found." });
    }

    // Update allowed fields only
    if (location !== undefined) events[index].location = location;
    if (description !== undefined) events[index].description = description;
    if (date !== undefined) events[index].date = date;
    if (tags !== undefined) {
      events[index].tags = Array.isArray(tags) ? tags : [tags];
    }

    await writeEvents(events);

    res.json(events[index]);
  } catch (err) {
    next(err);
  }
});

// ---------- DELETE /api/events/:id (Delete) ----------
// Task 4
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const events = await readEvents();
    const index = events.findIndex((e) => e.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Event not found." });
    }

    const updated = events.filter((e) => e.id !== id);
    await writeEvents(updated);

    res.json({ message: "Event deleted successfully." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
