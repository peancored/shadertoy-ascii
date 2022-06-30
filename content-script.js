const scriptUrl = chrome.runtime.getURL('ascii-renderer.js');
let script = document.createElement('script');
script.src = scriptUrl;
document.body.appendChild(script);

// s.onload = function() {
    // s.remove();
// };
