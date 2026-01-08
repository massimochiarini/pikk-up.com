'use client'

import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { useEffect, useState } from 'react'
import { supabase, type GroupChat, type Game, type GroupMessage, type Profile } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'

type GroupChatWithDetails = {
  groupChat: GroupChat
  game: Game | null
  memberCount: number
  unreadCount: number
}

export default function MessagesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [groupChats, setGroupChats] = useState<GroupChatWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChat, setSelectedChat] = useState<GroupChatWithDetails | null>(null)
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    if (user) {
      fetchGroupChats()
    }
  }, [user])

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.groupChat.id)
      fetchMembers(selectedChat.groupChat.id)
      // Subscribe to new messages
      const channel = supabase
        .channel(`group_messages:${selectedChat.groupChat.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'group_messages',
            filter: `group_chat_id=eq.${selectedChat.groupChat.id}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as GroupMessage])
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedChat])

  const fetchGroupChats = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Get group chats where user is a member
      const { data: memberships } = await supabase
        .from('group_chat_members')
        .select('group_chat_id')
        .eq('user_id', user.id)

      if (!memberships || memberships.length === 0) {
        setGroupChats([])
        setLoading(false)
        return
      }

      const groupChatIds = memberships.map((m) => m.group_chat_id)

      // Fetch group chats
      const { data: chatsData } = await supabase
        .from('group_chats')
        .select('*')
        .in('id', groupChatIds)
        .order('last_message_at', { ascending: false, nullsFirst: false })

      if (!chatsData) {
        setGroupChats([])
        setLoading(false)
        return
      }

      // Enrich with game details and member count
      const enrichedChats = await Promise.all(
        chatsData.map(async (chat) => {
          // Fetch game
          const { data: gameData } = await supabase
            .from('games')
            .select('*')
            .eq('id', chat.game_id)
            .single()

          // Count members
          const { count } = await supabase
            .from('group_chat_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_chat_id', chat.id)

          return {
            groupChat: chat,
            game: gameData,
            memberCount: count || 0,
            unreadCount: 0, // TODO: Implement unread tracking
          }
        })
      )

      setGroupChats(enrichedChats)
    } catch (error) {
      console.error('Error fetching group chats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (groupChatId: string) => {
    try {
      const { data } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_chat_id', groupChatId)
        .order('created_at', { ascending: true })

      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const fetchMembers = async (groupChatId: string) => {
    try {
      const { data: memberData } = await supabase
        .from('group_chat_members')
        .select('user_id')
        .eq('group_chat_id', groupChatId)

      if (memberData) {
        const userIds = memberData.map((m) => m.user_id)
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds)

        setMembers(profilesData || [])
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const sendMessage = async () => {
    if (!user || !selectedChat || !newMessage.trim()) return

    setSendingMessage(true)
    try {
      const { error } = await supabase.from('group_messages').insert({
        group_chat_id: selectedChat.groupChat.id,
        sender_id: user.id,
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
      })

      if (error) throw error

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  const getSenderName = (senderId: string) => {
    if (senderId === user?.id) return 'You'
    const member = members.find((m) => m.id === senderId)
    return member ? member.first_name : 'Unknown'
  }

  if (selectedChat) {
    // Chat view
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="container mx-auto max-w-4xl">
            <button
              onClick={() => setSelectedChat(null)}
              className="text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-2"
            >
              ← Back to chats
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-navy">{selectedChat.groupChat.name}</h2>
                <p className="text-sm text-gray-600">{members.length} members</p>
              </div>
              {selectedChat.game && (
                <button
                  onClick={() => router.push(`/game/${selectedChat.game?.id}`)}
                  className="btn-outline text-sm"
                >
                  View Game
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="container mx-auto max-w-4xl px-4 py-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">💬</div>
                <p className="text-gray-500">No messages yet. Be the first to say hello!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  const isMe = message.sender_id === user?.id
                  return (
                    <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-md ${isMe ? 'order-2' : 'order-1'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-600">
                            {getSenderName(message.sender_id)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {format(parseISO(message.created_at), 'h:mm a')}
                          </span>
                        </div>
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isMe
                              ? 'bg-neon-green text-navy'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 px-4 py-4">
          <div className="container mx-auto max-w-4xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !sendingMessage && sendMessage()}
                placeholder="Type a message..."
                className="input-field flex-1"
                disabled={sendingMessage}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sendingMessage}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingMessage ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Chat list view
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy mb-2">
            Messages
          </h1>
          <p className="text-gray-600">
            Game chats and conversations
          </p>
        </div>

        <div className="card">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green"></div>
            </div>
          ) : groupChats.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No messages yet
              </h3>
              <p className="text-gray-500 mb-4">
                Join a game to start chatting with other players
              </p>
              <button
                onClick={() => router.push('/home')}
                className="btn-primary"
              >
                Find Games
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {groupChats.map((chat) => (
                <div
                  key={chat.groupChat.id}
                  onClick={() => setSelectedChat(chat)}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-blue to-neon-green flex items-center justify-center text-white font-bold">
                      🎾
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {chat.groupChat.name}
                        </h3>
                        {chat.groupChat.last_message_at && (
                          <span className="text-xs text-gray-500">
                            {format(parseISO(chat.groupChat.last_message_at), 'MMM d')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{chat.memberCount} members</span>
                        {chat.game && (
                          <span className="text-xs text-gray-500">
                            • {format(parseISO(chat.game.game_date), 'MMM d')}
                          </span>
                        )}
                      </div>
                      {chat.groupChat.last_message_preview && (
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {chat.groupChat.last_message_preview}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

