import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCases } from '@/contexts/CaseContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Activity, Calendar, Download, Filter,
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  FileText, Clock, CheckCircle2, AlertTriangle, Users
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const StatisticsPage: React.FC = () => {
  const { t } = useLanguage();
  const { cases } = useCases();
  const [period, setPeriod] = useState('month');

  // --- DONNÉES TEMPORELLES (GARDÉES STATIQUES POUR LE DESIGN DES COURBES) ---
  const casesOverTime = [
    { name: 'Jan', breast: 45, cervical: 32, total: 77 },
    { name: 'Fév', breast: 52, cervical: 41, total: 93 },
    { name: 'Mar', breast: 48, cervical: 38, total: 86 },
    { name: 'Avr', breast: 61, cervical: 45, total: 106 },
    { name: 'Mai', breast: 55, cervical: 42, total: 97 },
    { name: 'Juin', breast: 67, cervical: 51, total: 118 },
    { name: 'Juil', breast: 72, cervical: 58, total: 130 },
  ];

  const weeklyActivity = [
    { day: 'Lun', cases: 12, avgTime: 2.5 },
    { day: 'Mar', cases: 15, avgTime: 2.2 },
    { day: 'Mer', cases: 18, avgTime: 2.8 },
    { day: 'Jeu', cases: 14, avgTime: 2.1 },
    { day: 'Ven', cases: 20, avgTime: 2.4 },
    { day: 'Sam', cases: 8, avgTime: 1.9 },
    { day: 'Dim', cases: 5, avgTime: 1.5 },
  ];

  const performanceMetrics = [
    { month: 'Jan', submitted: 45, validated: 42, rejected: 3 },
    { month: 'Fév', submitted: 52, validated: 48, rejected: 4 },
    { month: 'Mar', submitted: 48, validated: 46, rejected: 2 },
    { month: 'Avr', submitted: 61, validated: 57, rejected: 4 },
    { month: 'Mai', submitted: 55, validated: 52, rejected: 3 },
    { month: 'Juin', submitted: 67, validated: 63, rejected: 4 },
  ];

  const turnaroundTime = [
    { range: '< 2h', count: 35 },
    { range: '2-4h', count: 28 },
    { range: '4-8h', count: 20 },
    { range: '8-24h', count: 12 },
    { range: '> 24h', count: 5 },
  ];

  // --- ÉTATS CONNECTÉS À SUPABASE (POUR LES KPIS ET LES CERCLES) ---
  const [realStats, setRealStats] = useState({
    totalCases: cases.length + 125,
    thisMonth: 32,
    monthChange: 12,
    avgTurnaround: '3.2h',
    turnaroundChange: -15,
    validationRate: 94,
    rateChange: 2,
    pendingCases: 18,
    pendingChange: -5,
  });

  const [realStatusDist, setRealStatusDist] = useState([
    { name: 'Brouillon', value: 15, color: 'hsl(var(--muted-foreground))' },
    { name: 'En attente', value: 25, color: 'hsl(var(--warning))' },
    { name: 'En analyse', value: 18, color: 'hsl(var(--primary))' },
    { name: 'Validé', value: 42, color: 'hsl(var(--success))' },
  ]);

  const [realPathologyDist, setRealPathologyDist] = useState([
    { name: 'Cancer du sein', value: 58, color: 'hsl(var(--chart-1))' },
    { name: 'Cancer du col', value: 42, color: 'hsl(var(--chart-2))' },
  ]);

  const [realPriorityDist, setRealPriorityDist] = useState([
    { name: 'Normal', value: 75, color: 'hsl(var(--muted-foreground))' },
    { name: 'Urgent', value: 25, color: 'hsl(var(--destructive))' },
  ]);

  // RÉCUPÉRATION DES DONNÉES RÉELLES
  useEffect(() => {
    const fetchSupabaseData = async () => {
      const { data, error } = await supabase.from('cases').select('*');
      
      if (!error && data) {
        const total = data.length;
        const draft = data.filter(c => c.status === 'draft').length;
        const pending = data.filter(c => c.status === 'pending' || c.status === 'analyzing').length;
        const validated = data.filter(c => c.status === 'validated').length;
        
        const breast = data.filter(c => c.pathology === 'breast').length;
        const cervical = data.filter(c => c.pathology === 'cervical').length;
        
        const urgent = data.filter(c => c.priority === 'urgent' || c.priority === 'high').length;
        const normal = data.filter(c => c.priority === 'normal').length;

        // Mise à jour des compteurs (les chiffres animés)
        setRealStats(prev => ({
          ...prev,
          totalCases: total,
          pendingCases: pending,
          validationRate: total > 0 ? Math.round((validated / total) * 100) : 0,
        }));

        // Mise à jour des cercles de répartition
        setRealStatusDist([
          { name: 'Brouillon', value: draft, color: 'hsl(var(--muted-foreground))' },
          { name: 'En attente/Analyse', value: pending, color: 'hsl(var(--warning))' },
          { name: 'Validé', value: validated, color: 'hsl(var(--success))' },
        ]);

        setRealPathologyDist([
          { name: 'Cancer du sein', value: breast, color: 'hsl(var(--chart-1))' },
          { name: 'Cancer du col', value: cervical, color: 'hsl(var(--chart-2))' },
        ]);

        setRealPriorityDist([
          { name: 'Normal', value: normal, color: 'hsl(var(--muted-foreground))' },
          { name: 'Urgent/Haut', value: urgent, color: 'hsl(var(--destructive))' },
        ]);
      }
    };

    fetchSupabaseData();
  }, []);

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    trend 
  }: { 
    title: string; 
    value: string | number; 
    change?: number; 
    icon: React.ElementType;
    trend?: 'up' | 'down';
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${
                trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
              }`}>
                {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{change > 0 ? '+' : ''}{change}% vs mois dernier</span>
              </div>
            )}
          </div>
          <div className="p-3 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Statistiques
          </h1>
          <p className="text-muted-foreground">
            Analyse détaillée de votre activité
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total des cas" 
          value={realStats.totalCases} 
          change={realStats.monthChange} 
          icon={FileText}
          trend="up"
        />
        <StatCard 
          title="Délai moyen" 
          value={realStats.avgTurnaround} 
          change={realStats.turnaroundChange} 
          icon={Clock}
          trend="down"
        />
        <StatCard 
          title="Taux de validation" 
          value={`${realStats.validationRate}%`} 
          change={realStats.rateChange} 
          icon={CheckCircle2}
          trend="up"
        />
        <StatCard 
          title="En attente" 
          value={realStats.pendingCases} 
          change={realStats.pendingChange} 
          icon={AlertTriangle}
          trend="down"
        />
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="evolution" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="evolution" className="gap-2">
            <LineChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Évolution</span>
          </TabsTrigger>
          <TabsTrigger value="distribution" className="gap-2">
            <PieChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Répartition</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activité</span>
          </TabsTrigger>
        </TabsList>

        {/* Evolution Tab */}
        <TabsContent value="evolution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Évolution des cas</CardTitle>
                <CardDescription>Nombre de cas par mois et par pathologie</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={casesOverTime}>
                    <defs>
                      <linearGradient id="colorBreast" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCervical" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="breast" 
                      name="Cancer du sein"
                      stroke="hsl(var(--chart-1))" 
                      fillOpacity={1} 
                      fill="url(#colorBreast)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cervical" 
                      name="Cancer du col"
                      stroke="hsl(var(--chart-2))" 
                      fillOpacity={1} 
                      fill="url(#colorCervical)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tendance globale</CardTitle>
                <CardDescription>Total des cas traités par mois</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={casesOverTime}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      name="Total"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statut des cas</CardTitle>
                <CardDescription>Répartition par statut</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={realStatusDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {realStatusDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {realStatusDist.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pathologies</CardTitle>
                <CardDescription>Répartition par type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={realPathologyDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {realPathologyDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {realPathologyDist.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Priorité</CardTitle>
                <CardDescription>Répartition par priorité</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={realPriorityDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {realPriorityDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {realPriorityDist.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance mensuelle</CardTitle>
                <CardDescription>Cas soumis vs validés vs rejetés</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceMetrics}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="submitted" name="Soumis" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="validated" name="Validés" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="rejected" name="Rejetés" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Délai de traitement</CardTitle>
                <CardDescription>Distribution des temps de réponse</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={turnaroundTime} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="range" type="category" className="text-xs" width={60} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar 
                      dataKey="count" 
                      name="Nombre de cas"
                      fill="hsl(var(--primary))" 
                      radius={[0, 4, 4, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activité hebdomadaire</CardTitle>
                <CardDescription>Nombre de cas par jour de la semaine</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar 
                      dataKey="cases" 
                      name="Cas créés"
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Temps moyen par jour</CardTitle>
                <CardDescription>Durée moyenne de traitement (heures)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" unit="h" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                      formatter={(value: number) => [`${value}h`, 'Temps moyen']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgTime" 
                      name="Temps moyen"
                      stroke="hsl(var(--chart-4))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--chart-4))', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Activity Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Jour le plus actif</p>
                    <p className="text-xl font-bold">Vendredi</p>
                    <p className="text-sm text-muted-foreground">20 cas en moyenne</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-accent">
                    <Clock className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Meilleur temps</p>
                    <p className="text-xl font-bold">Dimanche</p>
                    <p className="text-sm text-muted-foreground">1.5h en moyenne</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-secondary">
                    <Activity className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total cette semaine</p>
                    <p className="text-xl font-bold">92 cas</p>
                    <p className="text-sm text-primary">+8% vs semaine dernière</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StatisticsPage;