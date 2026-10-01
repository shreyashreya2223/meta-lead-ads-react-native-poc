# Meta Lead Ads + React Native Real-Time Lead Capture PoC

A proof of concept that connects Meta Lead Ads with a React Native application and displays newly submitted leads in real time without requiring any manual action or refresh on the mobile app.

## Overview

The goal of this project is to demonstrate the complete flow:

**Meta Lead Form → Meta Webhook → Node.js Backend → Meta Graph API → Socket.IO → React Native App**

When a lead is created through the Meta Lead Ads Testing Tool, the backend receives the webhook event, retrieves the lead details from Meta, and immediately pushes the lead to an already-open React Native application using Socket.IO.

---

## Demo

### Loom 1 — Live End-to-End Demo

https://www.loom.com/share/d1527467f01c4cbdb4a2277e600f3b3c

This video demonstrates:

- React Native dashboard already open
- Test lead creation through Meta Lead Ads Testing Tool
- No manual action on the mobile app
- New lead appearing automatically in the React Native dashboard

### Loom 2 — Code & Architecture

https://www.loom.com/share/f60c73504f184cc4b13e647a37de9200

---

## Architecture

```text
                    META PLATFORM
                         |
                         |
                 Meta Lead Form
                         |
                         v
                Lead Ads Testing Tool
                         |
                         v
                  Meta Webhook
                         |
                         v
                Public HTTPS URL
                     (ngrok)
                         |
                         v
              Node.js + Express Server
                         |
                         |
              receives leadgen_id
                         |
                         v
                 Meta Graph API
                         |
                         v
                 Lead Information
                         |
                         v
                  In-memory Array
                         |
                         v
                  Socket.IO Event
                         |
                         v
                React Native App
                         |
                         v
                  Lead Dashboard
