export default function MessagesPage() {
  return (
    <div className="flex-1 max-w-2xl mx-auto px-4 py-6 lg:px-8">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-xl text-muted-foreground mb-4">Coming Soon</p>
        <p className="text-sm text-muted-foreground max-w-md">
          We're working on bringing you an amazing messaging experience. Stay tuned!
        </p>
      </div>
    </div>
  );
}

