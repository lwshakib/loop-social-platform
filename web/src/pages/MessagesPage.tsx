export default function MessagesPage() {
  return (
    <div className="flex-1 max-w-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] text-center">
        <div className="mb-4 sm:mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-3 sm:mb-4 rounded-full bg-muted flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Messages</h1>
        <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-3 sm:mb-4">Coming Soon</p>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-md px-4">
          We're working on bringing you an amazing messaging experience. Stay tuned!
        </p>
      </div>
    </div>
  );
}

