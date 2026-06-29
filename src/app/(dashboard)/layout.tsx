import BottomNavWrapper from '@/components/layout/BottomNavWrapper'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'#0A0F1E', fontFamily:'Inter,sans-serif' }}>
      <BottomNavWrapper>
        {children}
      </BottomNavWrapper>
    </div>
  )
}
