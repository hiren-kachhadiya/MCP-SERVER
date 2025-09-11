#!/usr/bin/env node

const WebSocket = require('ws');

// WebSocket Test Client for Real-time Notifications
console.log('🚀 Starting WebSocket Test Client...');

const WS_URL = 'ws://54.226.212.22:5001';  // Your EC2 WebSocket URL

function connectWebSocket() {
  console.log(`🔗 Connecting to: ${WS_URL}`);
  
  const ws = new WebSocket(WS_URL);
  
  ws.on('open', function() {
    console.log('✅ WebSocket Connected Successfully!');
    console.log('📡 Listening for real-time API notifications...\n');
    
    // Send status request
    ws.send(JSON.stringify({
      type: 'get_status',
      timestamp: new Date().toISOString()
    }));
    
    // Send ping every 30 seconds to keep connection alive
    setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'ping',
          timestamp: new Date().toISOString()
        }));
      }
    }, 30000);
  });
  
  ws.on('message', function(data) {
    try {
      const message = JSON.parse(data.toString());
      
      switch(message.type) {
        case 'welcome':
          console.log('🎉 Welcome Message:');
          console.log(`   Client ID: ${message.clientId}`);
          console.log(`   Features: ${message.features.join(', ')}`);
          console.log(`   Time: ${message.timestamp}\n`);
          break;
          
        case 'status':
          console.log('📊 Server Status:');
          console.log(`   Server: ${message.server}`);
          console.log(`   Connected Clients: ${message.connectedClients}`);
          console.log(`   Monitoring: ${message.monitoring}`);
          console.log(`   Last Check: ${message.lastCheck}`);
          console.log(`   Time: ${message.timestamp}\n`);
          break;
          
        case 'pong':
          console.log(`💓 Pong received at ${message.timestamp}`);
          break;
          
        case 'api_change_alert':
          console.log('🚨 API CHANGE ALERT! 🚨');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(`📝 Message: ${message.notification.message}`);
          console.log(`🔢 Changes: ${message.notification.changeCount}`);
          console.log(`⏰ Time: ${message.notification.timestamp}`);
          
          if (message.notification.changes) {
            console.log('\n📋 Change Details:');
            message.notification.changes.forEach((change, i) => {
              console.log(`   ${i + 1}. ${change.type.toUpperCase()}`);
              console.log(`      ${change.method} ${change.path}`);
              console.log(`      ${change.summary}`);
            });
          }
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          break;
          
        case 'server_shutdown':
          console.log('🛑 Server Shutdown Notice:');
          console.log(`   ${message.message}`);
          console.log(`   Time: ${message.timestamp}\n`);
          break;
          
        default:
          console.log('📨 Unknown Message Type:');
          console.log(JSON.stringify(message, null, 2));
          console.log('');
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error.message);
      console.log('Raw data:', data.toString());
    }
  });
  
  ws.on('close', function(code, reason) {
    console.log(`🔌 WebSocket Disconnected`);
    console.log(`   Code: ${code}`);
    console.log(`   Reason: ${reason || 'No reason provided'}`);
    console.log('🔄 Attempting to reconnect in 5 seconds...\n');
    
    // Auto-reconnect after 5 seconds
    setTimeout(connectWebSocket, 5000);
  });
  
  ws.on('error', function(error) {
    console.error('❌ WebSocket Error:', error.message);
    console.log('🔄 Will attempt to reconnect...\n');
  });
}

// Start connection
connectWebSocket();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket client...');
  process.exit(0);
});

console.log('💡 Instructions:');
console.log('   - This client will show real-time API notifications');
console.log('   - Make changes to your NestJS API to see alerts');
console.log('   - Press Ctrl+C to exit');
console.log('   - Auto-reconnects if connection drops\n');
