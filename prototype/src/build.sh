#!/bin/bash
cd "$(dirname "$0")"
{ cat head.html; echo '<style>'; cat base.css oldcss.css newcss.css landing.css home.css calm.css read.css; echo '</style>'
  cat defs.html; echo '<div class="wrap" id="app"></div><div id="toast" role="status" aria-live="polite" hidden></div><script>'; 
  cat logic.js state.js photos.js art.js menu.js home.js orbit.js ticketutil.js guest.js staff.js auth.js manage.js pages.js events.js
  echo '</script>'; } > ../tableease-demo.html
cat logic.js state.js photos.js art.js menu.js home.js orbit.js ticketutil.js guest.js staff.js auth.js events.js > ../app.js
cd .. && node --check app.js && echo OK && wc -c tableease-demo.html
