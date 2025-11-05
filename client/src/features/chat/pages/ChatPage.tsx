import { Button } from '@/shared/components/ui/Button';
import { Hash, Users, Send } from 'lucide-react';
import { Input } from '@/shared/components/ui/Input';

export default function ChatPage() {
  return (
    <div className="h-screen flex animate-fade-in">
      {/* Channels Sidebar */}
      <div className="w-64 border-r border-gray-200 bg-white p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-gray-900">Channels</h2>
          <Button variant="ghost" size="icon">+</Button>
        </div>

        {/* Channel List */}
        <div className="space-y-1">
          {[
            { name: 'general', unread: 3 },
            { name: 'development', unread: 0 },
            { name: 'marketing', unread: 7 },
            { name: 'design', unread: 0 },
          ].map((channel, index) => (
            <button
              key={index}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
                index === 0 ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Hash className="w-4 h-4" />
                <span className="text-sm font-medium">{channel.name}</span>
              </div>
              {channel.unread > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                  {channel.unread}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Direct Messages</h3>
          <div className="space-y-1">
            {['John Doe', 'Jane Smith', 'Mike Johnson'].map((user, index) => (
              <button
                key={index}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-semibold">
                  {user.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="text-sm">{user}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Hash className="w-5 h-5 text-gray-600" />
            <div>
              <h2 className="font-semibold text-gray-900">general</h2>
              <p className="text-xs text-gray-500">12 members</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Users className="w-4 h-4 mr-2" />
            Members
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-6 space-y-4 bg-gray-50">
          {[
            { user: 'John Doe', message: 'Hey team! How is everyone doing?', time: '10:30 AM' },
            { user: 'Jane Smith', message: 'Great! Just finished the new feature.', time: '10:32 AM' },
            { user: 'Mike Johnson', message: 'Awesome work! Can\'t wait to test it.', time: '10:35 AM' },
            { user: 'You', message: 'Looking good! Let me know if you need any help.', time: '10:37 AM' },
          ].map((msg, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {msg.user.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline space-x-2">
                  <span className="font-semibold text-gray-900">{msg.user}</span>
                  <span className="text-xs text-gray-500">{msg.time}</span>
                </div>
                <p className="text-gray-700 mt-1">{msg.message}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button variant="gradient" size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

