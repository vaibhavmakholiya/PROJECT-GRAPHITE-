const components = [
  '/src/components/layout/AppLayout.tsx',
  '/src/components/layout/AppHeader.tsx',
  '/src/components/layout/BottomNav.tsx',
  '/src/components/layout/DevDrawer.tsx',
  '/src/components/common/SkeletonLoader.tsx',
  '/src/components/common/CommunityMotif.tsx',
  '/src/routes/SplashView.tsx',
  '/src/routes/RegisterView.tsx',
  '/src/routes/DashboardView.tsx',
  '/src/data/mockRepository.ts',
  '/src/hooks/useAuth.ts',
  '/src/hooks/useSyncState.ts',
];

async function checkAll() {
  for (const c of components) {
    try {
      const res = await fetch('http://127.0.0.1:5173' + c);
      if (res.status === 200) {
        console.log(c, '-> OK');
      } else {
        console.error(c, '-> FAILED', res.status, await res.text());
      }
    } catch (e) {
      console.error(c, '-> FETCH ERROR', e.message);
    }
  }
}

checkAll();
