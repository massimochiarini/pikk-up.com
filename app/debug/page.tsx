'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'

type TestResult = {
  name: string
  status: 'pending' | 'success' | 'error'
  message: string
  data?: any
}

export default function DebugPage() {
  const { user, profile, session, loading: authLoading } = useAuth()
  const [tests, setTests] = useState<TestResult[]>([])
  const [running, setRunning] = useState(false)

  const updateTest = (name: string, update: Partial<TestResult>) => {
    setTests(prev => prev.map(t => t.name === name ? { ...t, ...update } : t))
  }

  const runTests = async () => {
    setRunning(true)
    
    const initialTests: TestResult[] = [
      { name: 'Environment Variables', status: 'pending', message: 'Checking...' },
      { name: 'Supabase Connection', status: 'pending', message: 'Checking...' },
      { name: 'Profiles Table', status: 'pending', message: 'Checking...' },
      { name: 'Time Slots Table', status: 'pending', message: 'Checking...' },
      { name: 'Classes Table', status: 'pending', message: 'Checking...' },
      { name: 'Booking Count RPC', status: 'pending', message: 'Checking...' },
      { name: 'Auth Session', status: 'pending', message: 'Checking...' },
    ]
    setTests(initialTests)

    // Test 1: Environment Variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      updateTest('Environment Variables', {
        status: 'error',
        message: `Missing: ${!supabaseUrl ? 'SUPABASE_URL ' : ''}${!supabaseKey ? 'SUPABASE_ANON_KEY' : ''}`
      })
    } else {
      updateTest('Environment Variables', {
        status: 'success',
        message: `URL: ${supabaseUrl.substring(0, 30)}...`
      })
    }

    // Test 2: Supabase Connection (simple query)
    try {
      const start = Date.now()
      const { error } = await supabase.from('profiles').select('count').limit(1)
      const duration = Date.now() - start
      if (error) {
        updateTest('Supabase Connection', {
          status: 'error',
          message: `Connection failed: ${error.message}`
        })
      } else {
        updateTest('Supabase Connection', {
          status: 'success',
          message: `Connected (${duration}ms)`
        })
      }
    } catch (err: any) {
      updateTest('Supabase Connection', {
        status: 'error',
        message: `Exception: ${err.message}`
      })
    }

    // Test 3: Profiles Table
    try {
      const { data, error, count } = await supabase
        .from('profiles')
        .select('id, email, is_instructor', { count: 'exact' })
        .limit(5)
      
      if (error) {
        updateTest('Profiles Table', {
          status: 'error',
          message: `Query failed: ${error.message}`
        })
      } else {
        const instructors = data?.filter(p => p.is_instructor).length || 0
        updateTest('Profiles Table', {
          status: 'success',
          message: `${count || 0} profiles found (${instructors} instructors)`,
          data: data?.slice(0, 3)
        })
      }
    } catch (err: any) {
      updateTest('Profiles Table', {
        status: 'error',
        message: `Exception: ${err.message}`
      })
    }

    // Test 4: Time Slots Table
    try {
      const { data, error, count } = await supabase
        .from('time_slots')
        .select('*', { count: 'exact' })
        .gte('date', new Date().toISOString().split('T')[0])
        .limit(5)
      
      if (error) {
        updateTest('Time Slots Table', {
          status: 'error',
          message: `Query failed: ${error.message}`
        })
      } else {
        const available = data?.filter(s => s.status === 'available').length || 0
        updateTest('Time Slots Table', {
          status: 'success',
          message: `${count || 0} future slots (${available} available)`,
          data: data?.slice(0, 3)
        })
      }
    } catch (err: any) {
      updateTest('Time Slots Table', {
        status: 'error',
        message: `Exception: ${err.message}`
      })
    }

    // Test 5: Classes Table
    try {
      const { data, error, count } = await supabase
        .from('classes')
        .select(`
          id, title, status,
          time_slot:time_slots(date),
          instructor:profiles!instructor_id(email)
        `, { count: 'exact' })
        .eq('status', 'upcoming')
        .limit(5)
      
      if (error) {
        updateTest('Classes Table', {
          status: 'error',
          message: `Query failed: ${error.message}`
        })
      } else {
        updateTest('Classes Table', {
          status: data && data.length > 0 ? 'success' : 'error',
          message: data && data.length > 0 
            ? `${count || 0} upcoming classes found`
            : 'No upcoming classes found - this is why the classes page is empty!',
          data: data?.slice(0, 3)
        })
      }
    } catch (err: any) {
      updateTest('Classes Table', {
        status: 'error',
        message: `Exception: ${err.message}`
      })
    }

    // Test 6: Booking Count RPC
    try {
      // Get a class ID to test with
      const { data: classData } = await supabase
        .from('classes')
        .select('id')
        .limit(1)
        .single()
      
      if (classData) {
        const { data, error } = await supabase.rpc('get_booking_count', { 
          class_uuid: classData.id 
        })
        
        if (error) {
          updateTest('Booking Count RPC', {
            status: 'error',
            message: `RPC failed: ${error.message}`
          })
        } else {
          updateTest('Booking Count RPC', {
            status: 'success',
            message: `RPC working, returned: ${data}`
          })
        }
      } else {
        updateTest('Booking Count RPC', {
          status: 'error',
          message: 'No classes to test with'
        })
      }
    } catch (err: any) {
      updateTest('Booking Count RPC', {
        status: 'error',
        message: `Exception: ${err.message}`
      })
    }

    // Test 7: Auth Session
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        updateTest('Auth Session', {
          status: 'error',
          message: `Session error: ${error.message}`
        })
      } else if (session) {
        updateTest('Auth Session', {
          status: 'success',
          message: `Logged in as: ${session.user.email}`,
          data: { email: session.user.email, id: session.user.id }
        })
      } else {
        updateTest('Auth Session', {
          status: 'success',
          message: 'No active session (not logged in)'
        })
      }
    } catch (err: any) {
      updateTest('Auth Session', {
        status: 'error',
        message: `Exception: ${err.message}`
      })
    }

    setRunning(false)
  }

  useEffect(() => {
    runTests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🔧 PickUp Debug Panel</h1>
          <p className="text-gray-400">
            This page tests your Supabase connection and database setup.
          </p>
        </div>

        {/* Auth Context State */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="font-bold mb-3 text-lg">Auth Context State</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Loading:</span>{' '}
              <span className={authLoading ? 'text-yellow-400' : 'text-green-400'}>
                {authLoading ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">User:</span>{' '}
              <span className={user ? 'text-green-400' : 'text-red-400'}>
                {user ? user.email : 'None'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Profile:</span>{' '}
              <span className={profile ? 'text-green-400' : 'text-red-400'}>
                {profile ? `${profile.first_name} (instructor: ${profile.is_instructor})` : 'None'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Session:</span>{' '}
              <span className={session ? 'text-green-400' : 'text-red-400'}>
                {session ? 'Active' : 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-3 mb-8">
          {tests.map((test) => (
            <div 
              key={test.name}
              className={`p-4 rounded-lg ${
                test.status === 'pending' ? 'bg-gray-800' :
                test.status === 'success' ? 'bg-green-900/50 border border-green-700' :
                'bg-red-900/50 border border-red-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {test.status === 'pending' ? '⏳' : test.status === 'success' ? '✅' : '❌'}{' '}
                  {test.name}
                </span>
                <span className={`text-sm ${
                  test.status === 'success' ? 'text-green-400' : 
                  test.status === 'error' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {test.message}
                </span>
              </div>
              {test.data && (
                <pre className="mt-2 text-xs bg-black/30 p-2 rounded overflow-x-auto">
                  {JSON.stringify(test.data, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-4 flex-wrap">
          <button 
            onClick={runTests}
            disabled={running}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50"
          >
            {running ? 'Running...' : '🔄 Run Tests Again'}
          </button>
          
          <Link 
            href="/classes"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium"
          >
            → Go to Classes
          </Link>
          
          <Link 
            href="/auth/login"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium"
          >
            → Student Login
          </Link>
          
          <Link 
            href="/instructor/auth/login"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium"
          >
            → Instructor Login
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Check browser console (F12) for more detailed logs.</p>
        </div>
      </div>
    </div>
  )
}
