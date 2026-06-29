/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pxirxvmmqazosirbffge.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4aXJ4dm1tcWF6b3NpcmJmZmdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MjU2NDQsImV4cCI6MjA5NTEwMTY0NH0.6L8nMeQSYZ-rTonyf9cY3io3Ml4ddzoQxDUR1wsKrjg',
  },
}

export default nextConfig
