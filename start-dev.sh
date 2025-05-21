#!/bin/zsh

# Function to handle clean exit
cleanup() {
  echo "Shutting down servers..."
  kill $DJANGO_PID $NEXT_PID 2>/dev/null
  exit 0
}

# Set trap for SIGINT (Ctrl+C)
trap cleanup INT

# Start Django server
echo "Starting Django server..."
cd newsfeed_backend
python manage.py runserver &
DJANGO_PID=$!
cd ..

# Start Next.js server
echo "Starting Next.js server..."
cd newsfeed_frontend
npm run dev &
NEXT_PID=$!
cd ..

echo "Both servers are running. Press Ctrl+C to stop both."

# Wait for both processes to complete (or until user presses Ctrl+C)
wait $DJANGO_PID $NEXT_PID
