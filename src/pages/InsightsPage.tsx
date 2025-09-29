import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Brain, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { useDistortions } from '@/store/useDistortions';
import { TestEndpoint } from '@/components/TestEndpoint';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

export default function InsightsPage() {
  const { distortions, loadDistortions } = useDistortions();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadDistortions();
  }, [loadDistortions]);

  // Filter distortions by time range
  const getFilteredDistortions = () => {
    const now = new Date();
    const cutoff = new Date();
    
    switch (timeRange) {
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setDate(now.getDate() - 30);
        break;
      default:
        return distortions;
    }
    
    return distortions.filter(d => new Date(d.createdAt) >= cutoff);
  };

  const filteredDistortions = getFilteredDistortions();

  // Process data for charts
  const distortionCounts = filteredDistortions.reduce((acc, d) => {
    acc[d.type] = (acc[d.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartColors = [
    'rgba(59, 130, 246, 0.8)',   // Blue
    'rgba(16, 185, 129, 0.8)',   // Green  
    'rgba(245, 101, 101, 0.8)',  // Red
    'rgba(251, 191, 36, 0.8)',   // Yellow
    'rgba(139, 92, 246, 0.8)',   // Purple
    'rgba(236, 72, 153, 0.8)',   // Pink
    'rgba(6, 182, 212, 0.8)',    // Cyan
    'rgba(34, 197, 94, 0.8)',    // Lime
  ];

  const doughnutData = {
    labels: Object.keys(distortionCounts),
    datasets: [
      {
        data: Object.values(distortionCounts),
        backgroundColor: chartColors,
        borderColor: chartColors.map(color => color.replace('0.8', '1')),
        borderWidth: 2,
      },
    ],
  };

  // Weekly trend data
  const getWeeklyTrend = () => {
    const weekData = Array(7).fill(0);
    const weekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    filteredDistortions.forEach(d => {
      const dayOfWeek = new Date(d.createdAt).getDay();
      weekData[dayOfWeek]++;
    });

    return {
      labels: weekLabels,
      datasets: [
        {
          label: 'Distortions Detected',
          data: weekData,
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  };

  const lineData = getWeeklyTrend();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const lineOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-therapeutic p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex items-center gap-4">
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Insights</h1>
            <p className="text-muted-foreground">Track your thought patterns and progress</p>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex gap-2">
            {(['week', 'month', 'all'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="capitalize"
              >
                {range === 'all' ? 'All Time' : `Last ${range}`}
              </Button>
            ))}
          </div>
        </header>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-medium">
            <CardContent className="p-6 text-center">
              <Brain className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary">
                {filteredDistortions.length}
              </div>
              <p className="text-sm text-muted-foreground">Total Distortions</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-medium">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 text-accent-strong mx-auto mb-2" />
              <div className="text-2xl font-bold text-accent-strong">
                {Object.keys(distortionCounts).length}
              </div>
              <p className="text-sm text-muted-foreground">Types Identified</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-medium">
            <CardContent className="p-6 text-center">
              <Calendar className="w-8 h-8 text-therapeutic-warmth mx-auto mb-2" />
              <div className="text-2xl font-bold text-therapeutic-warmth">
                {Math.round(filteredDistortions.length / Math.max(1, timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365))}
              </div>
              <p className="text-sm text-muted-foreground">Per Day Average</p>
            </CardContent>
          </Card>
        </div>

        {/* Test Endpoint Component */}
        <TestEndpoint />

        {filteredDistortions.length === 0 ? (
          <Card className="shadow-medium">
            <CardContent className="p-8 text-center">
              <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Data Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start journaling to see your thought pattern insights here.
              </p>
              <Link to="/handwriting">
                <Button>Start Writing</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Distortion Types Chart */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Distortion Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Doughnut data={doughnutData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            {/* Weekly Trend */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Weekly Pattern</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Line data={lineData} options={lineOptions} />
                </div>
              </CardContent>
            </Card>

            {/* Recent Distortions */}
            <Card className="shadow-medium lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {filteredDistortions
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 10)
                    .map((distortion) => (
                    <div key={distortion.id} className="flex justify-between items-start p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{distortion.type}</p>
                        <p className="text-sm text-muted-foreground mt-1">"{distortion.phrase}"</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(distortion.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
          </div>
        )}
        
      </div>
    </div>
  );
}