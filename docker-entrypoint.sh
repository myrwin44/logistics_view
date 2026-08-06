#!/bin/sh

cat <<EOF >/usr/share/nginx/html/env.js
window.__ENV__ = {
  API_BASE_URL: "${VITE_API_BASE_URL}"
};
EOF

echo "Generated env.js"

cat /usr/share/nginx/html/env.js
