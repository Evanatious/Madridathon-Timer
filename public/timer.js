const timerElement = document.getElementById('timer');
let duration = 24 * 60 * 60; //24 hours

function formatTime(sec) {
  const hours = String(Math.floor(sec / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const seconds = String(sec % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

const ws = new WebSocket(`ws://${window.location.host}`);

ws.onopen = () => {
  // Register this connection as a timer display
  ws.send(JSON.stringify({ type: 'registerTimer' }));
  console.log('Timer registered with server');
};

ws.onmessage = async (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'update') {
    duration = data.duration;
    timerElement.textContent = formatTime(duration);
  } else if (data.type === 'spinWheel') {
    // Handle wheel spin command from control panel
    const { seconds, wheelType, doublerFlag } = data;
    
    console.log('Received wheel spin command:', { seconds, wheelType, doublerFlag });
    
    // Check if wheel function is available
    if (typeof window.spinWheel === 'function') {
      try {
        const result = await window.spinWheel(seconds, wheelType, doublerFlag);
        
        console.log('Wheel spin result:', result);
        
        // If we got a result (not 0 from mine), add it to the timer
        if (result > 0) {
          // Send the result back to server to update timer
          ws.send(JSON.stringify({ type: 'add', amount: result }));
          console.log('Added to timer:', result);
        } else {
          console.log('Mine hit - no time added');
        }
      } catch (error) {
        console.error('Error spinning wheel:', error);
      }
    } else {
      console.error('Wheel function not available');
    }
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket connection closed');
};