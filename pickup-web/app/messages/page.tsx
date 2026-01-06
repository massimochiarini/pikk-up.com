'use client'

import { useAuth } from '@/components/AuthProvider'
import { Navbar } from '@/components/Navbar'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Conversation = {
  id: string
  participant1_id: string
  participant2_id: string
  last_message_at: string
  participant: {
    id: string
    first_name: string
    last_name: string
    username?: string
  }
  latest_message?: {
    content: string
    sender_id: string
  }
}

export default function MessagesPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user])

  const fetchConversations = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch conversations where user is participant
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })

      if (error) throw error

      // Fetch participant profiles and latest messages
      const enrichedConversations = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          // Get other participant's ID
          const otherUserId = conv.participant1_id === user.id 
            ? conv.participant2_id 
            : conv.participant1_id

          // Fetch other participant's profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', otherUserId)
            .single()

          // Fetch latest message
          const { data: messageData } = await supabase
            .from('messages')
            .select('content, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          return {
            ...conv,
            participant: profileData,
            latest_message: messageData,
          }
        })
      )

      setConversations(enrichedConversations)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy mb-2">
            Messages
          </h1>
          <p className="text-gray-600">
            Chat with other players
          </p>
        </div>

        <div className="card">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No messages yet
              </h3>
              <p className="text-gray-500">
                Start a conversation by joining a game and connecting with other players
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-blue to-neon-green flex items-center justify-center text-white font-bold">
                      {conversation.participant?.first_name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {conversation.participant?.first_name} {conversation.participant?.last_name}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {new Date(conversation.last_message_at).toLocaleDateString()}
                        </span>
                      </div>
                      {conversation.latest_message && (
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.latest_message.sender_id === user?.id && 'You: '}
                          {conversation.latest_message.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Note:</strong> Full messaging functionality requires real-time subscriptions. 
            This is a simplified version showing your conversation list. Individual conversation views 
            can be added based on your needs.
          </p>
        </div>
      </div>
    </div>
  )
}

