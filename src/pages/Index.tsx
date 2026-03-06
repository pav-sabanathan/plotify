import UpNextStrip from '@/components/UpNextStrip';
import CalendarView from '@/components/CalendarView';

const Dashboard = () => {
  return (
    <div className="space-y-6 pb-20 px-4 pt-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">StreamLine</h1>
        <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">Beta</span>
      </div>
      <UpNextStrip />
      <CalendarView />
    </div>
  );
};

export default Dashboard;
