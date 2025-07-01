// 1. LOAD ENVIRONMENT VARIABLES
require('dotenv').config();
const WebSocket = require('ws');
const fetch = require('node-fetch');

// 2. LOAD CONFIG FROM .env
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_USER_TOKEN = process.env.TWITCH_USER_TOKEN;  // Your access token
const TWITCH_USER_ID = process.env.TWITCH_USER_ID;        // Numeric, not username
const TIMER_WS_URL = process.env.TIMER_WS_URL || 'ws://localhost:3000';

// Twitch EventSub WebSocket endpoint (official)
const TWITCH_EVENTSUB_WS_URL = 'wss://eventsub.wss.twitch.tv/ws';

// --- 3. CONNECT TO YOUR TIMER SERVER (so you can send donation events to it) ---
let timerWs = null;
function connectTimerWs() {
  timerWs = new WebSocket(TIMER_WS_URL);

  timerWs.on('open', () => {
    console.log('[Timer] Connected to timer server.');
  });

  timerWs.on('error', (e) => {
    console.error('[Timer] WS error:', e);
  });

  timerWs.on('close', () => {
    console.log('[Timer] WS closed, reconnecting in 2s...');
    setTimeout(connectTimerWs, 2000);
  });
}
connectTimerWs();

// --- 4. CONNECT TO TWITCH EVENTSUB WEBSOCKET ---
let twitchWs = null;
let sessionId = null;

function connectTwitchWs() {
  twitchWs = new WebSocket(TWITCH_EVENTSUB_WS_URL);

  twitchWs.on('open', () => {
    console.log('[Twitch] Connected to EventSub WebSocket.');
  });

  twitchWs.on('message', async (data) => {
    const msg = JSON.parse(data);

    // a) Handle the welcome/session message to get your session ID
    if (msg.metadata && msg.metadata.message_type === 'session_welcome') {
      sessionId = msg.payload.session.id;
      console.log('[Twitch] Session ID:', sessionId);
      // Register the events you want to listen for (subs, gifts, bits)
      await subscribeToEvents();
    }

    // b) Handle actual sub/gift/bit events
    if (msg.metadata && msg.metadata.message_type === 'notification') {
      const event = msg.payload.event;
      const type = msg.payload.subscription.type;
      handleTwitchEvent(type, event);
    }

    // c) (optional) log keepalive/ping or revoke/other messages if you want
  });

  twitchWs.on('close', () => {
    console.log('[Twitch] EventSub WS closed, reconnecting in 5s...');
    setTimeout(connectTwitchWs, 5000);
  });

  twitchWs.on('error', (e) => {
    console.error('[Twitch] WS error:', e);
  });
}
connectTwitchWs();

// --- 5. SUBSCRIBE TO SUB, GIFT, AND BITS EVENTS VIA API ---
async function subscribeToEvents() {
  // Subscribe to subs
  await subscribeTo('channel.subscribe');
  // Subscribe to sub gifts
  await subscribeTo('channel.subscription.gift');
  // Subscribe to bits/cheers
  await subscribeTo('channel.cheer');
}

async function subscribeTo(type) {
  const url = 'https://api.twitch.tv/helix/eventsub/subscriptions';
  const body = {
    type,
    version: '1',
    condition: {
      broadcaster_user_id: TWITCH_USER_ID
    },
    transport: {
      method: 'websocket',
      session_id: sessionId
    }
  };
  // Bits uses same condition, but good to have this as a reference.
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${TWITCH_USER_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const result = await res.json();
  if (!res.ok) {
    console.error(`[Twitch] Error subscribing to ${type}:`, result);
  } else {
    console.log(`[Twitch] Subscribed to ${type}`);
  }
}

// --- 6. HANDLE TWITCH EVENTS ---
function handleTwitchEvent(type, event) {
  let donorName, donationAmount, donationType;

  // SUBS (Prime, Paid, Tier 1-3)
  if (type === 'channel.subscribe') {
    donorName = event.user_name;
    // All subs treated as $3 by default
    donationAmount = 3;
    donationType = 'sub';
    sendToTimer(donorName, donationAmount, donationType);
  }

  // GIFTED SUBS (could be bulk or single)
  if (type === 'channel.subscription.gift') {
    donorName = event.gifter_user_name || event.gifter_login || 'Anonymous';
    // event.total or event.cumulative_total is number of gifted subs
    const count = event.total || event.cumulative_total || event.is_anonymous ? event.quantity || 1 : 1;
    donationAmount = count * 3;
    donationType = 'gifted';
    sendToTimer(donorName, donationAmount, donationType);
  }

  // BITS (cheers)
  if (type === 'channel.cheer') {
    donorName = event.user_name;
    donationAmount = (event.bits || 0) / 100;
    donationType = 'bits';
    sendToTimer(donorName, donationAmount, donationType);
  }
}

// --- 7. SEND DONATION EVENT TO TIMER SERVER ---
function sendToTimer(donorName, donationAmount, donationType) {
  if (timerWs && timerWs.readyState === WebSocket.OPEN) {
    timerWs.send(JSON.stringify({
      type: 'donation',
      donorName,
      donationAmount,
      donationType
    }));
    console.log(`[Timer] Sent donation: ${donorName} - $${donationAmount} - ${donationType}`);
  } else {
    console.warn('[Timer] WS not connected, could not send donation.');
  }
}
