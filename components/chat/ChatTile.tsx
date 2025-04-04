import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send } from 'lucide-react'

export interface ChatMessageType {
  message: string
  name: string
  isSelf: boolean
  timestamp: number
}

interface ChatTileProps {
  messages: ChatMessageType[]
  accentColor: string
  onSend: (message: string) => void
  height?: string // 可选的高度属性
}

export function ChatTile({ 
  messages, 
  accentColor, 
  onSend,
  height = "calc(100vh - 200px)" // 默认高度，可根据需要调整
}: ChatTileProps) {
  const [inputMessage, setInputMessage] = useState('')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleSend = () => {
    if (inputMessage.trim()) {
      onSend(inputMessage.trim())
      setInputMessage('')
    }
  }

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 当消息更新时滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="flex flex-col" style={{ height }}>
      <ScrollArea 
        className="flex-1 p-4"
        ref={scrollAreaRef}
      >
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.isSelf ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.isSelf
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
                style={msg.isSelf ? { backgroundColor: accentColor } : undefined}
              >
                <div className="text-sm font-semibold mb-1">{msg.name}</div>
                <div className="text-sm break-words">{msg.message}</div>
                <div className="text-xs opacity-70 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} /> {/* 用于自动滚动的标记元素 */}
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-background">
        <div className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button onClick={handleSend} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 