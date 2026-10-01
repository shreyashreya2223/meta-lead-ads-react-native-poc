const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN?.trim();
const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;

const leads = [];

// ==============================
// SOCKET.IO
// ==============================

io.on("connection", (socket) => {
  console.log("🔌 React Native client connected:", socket.id);

  // Send existing leads to newly connected client
  socket.emit("initial_leads", leads);

  socket.on("disconnect", () => {
    console.log("🔌 React Native client disconnected:", socket.id);
  });
});

// ==============================
// HOME
// ==============================

app.get("/", (req, res) => {
  res.json({
    message: "Meta Lead Ads Backend is running",
  });
});

// ==============================
// GET ALL LEADS
// ==============================

app.get("/leads", (req, res) => {
  res.json(leads);
});

// ==============================
// META WEBHOOK VERIFICATION
// ==============================

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"]?.trim();
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified successfully");
    return res.status(200).send(challenge);
  }

  console.log("Webhook verification failed");
  return res.sendStatus(403);
});

// ==============================
// META WEBHOOK
// ==============================

app.post("/webhook", async (req, res) => {
  console.log("\n==============================");
  console.log("META WEBHOOK RECEIVED");
  console.log("==============================");

  console.log(JSON.stringify(req.body, null, 2));

  try {
    if (req.body.object !== "page") {
      return res.sendStatus(404);
    }

    for (const entry of req.body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === "leadgen") {
          const leadgenId = change.value.leadgen_id;

          console.log("\nNEW LEAD RECEIVED");
          console.log("------------------------------");
          console.log("Lead ID:", leadgenId);
          console.log("Page ID:", change.value.page_id);
          console.log("Form ID:", change.value.form_id);
          console.log("Ad ID:", change.value.ad_id);
          console.log("Ad Group ID:", change.value.adgroup_id);
          console.log("Created Time:", change.value.created_time);
          console.log("------------------------------");

          // ==============================
          // FETCH ACTUAL LEAD FROM META
          // ==============================

          if (PAGE_ACCESS_TOKEN) {
            const url =
              `https://graph.facebook.com/v26.0/${leadgenId}` +
              `?fields=id,created_time,field_data,form_id,ad_id` +
              `&access_token=${PAGE_ACCESS_TOKEN}`;

            const response = await fetch(url);
            const leadData = await response.json();

            console.log("\nLEAD DETAILS");
            console.log("==============================");
            console.log(JSON.stringify(leadData, null, 2));
            console.log("==============================");

            if (!leadData.error) {
              const newLead = {
                id: leadData.id,
                created_time: leadData.created_time,
                field_data: leadData.field_data,
                form_id: leadData.form_id,
                ad_id: leadData.ad_id || null,
              };

              // Store lead
              leads.push(newLead);

              console.log("Lead stored in memory");
              console.log("Total leads:", leads.length);

              // ==============================
              // SEND LEAD TO CONNECTED CLIENTS
              // ==============================

              io.emit("new_lead", newLead);

              console.log("New lead emitted through Socket.IO");
            } else {
              console.log(
                "Unable to retrieve lead:",
                leadData.error.message
              );
            }
          } else {
            console.log("META_PAGE_ACCESS_TOKEN is missing");
          }
        }
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.sendStatus(500);
  }
});

// ==============================
// START SERVER
// ==============================

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`Socket.IO server running on port ${PORT}`);
});