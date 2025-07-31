import { ChatMessage } from "@shared/types";

interface ChatMessageRendererProps {
  messages: ChatMessage[];
  className?: string;
}

export function ChatMessageRenderer({ messages, className = "" }: ChatMessageRendererProps) {
  return (
    <div className={`space-y-4 max-w-md mx-auto p-4 ${className}`}>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              message.isUser
                ? 'bg-blue-500 text-white rounded-br-md' // User messages (blue, right aligned)
                : 'bg-gray-200 text-gray-800 rounded-bl-md' // Other character messages (gray, left aligned)
            }`}
          >
            {/* Sender name for character messages */}
            {!message.isUser && message.sender && (
              <div className="text-xs font-medium text-gray-600 mb-1">
                {message.sender}
              </div>
            )}
            
            {/* Message content */}
            <div className="whitespace-pre-wrap">
              {message.message}
            </div>
            
            {/* Optional timestamp */}
            {message.timestamp && (
              <div className={`text-xs mt-1 opacity-70 ${
                message.isUser ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp}
              </div>
            )}
          </div>
        </div>
      ))}
      
      {/* Chat interface indicators */}
      <div className="flex justify-center mt-6">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
        </div>
      </div>
    </div>
  );
}