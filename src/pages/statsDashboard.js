import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Archive,
  CheckCircle,
  Users,
  Calendar,
  Clock,
  MapPin,
  Plane,
  Target,
  Activity,
} from "lucide-react";

const StatsDashboard = ({
  stats,
  foundObjects,
  lostObjects,
  acceptedMatches,
  owners,
}) => {
  const [timeRange, setTimeRange] = useState("30"); // 7, 30, 90 jours
  const [chartData, setChartData] = useState({});
  const [realKPIs, setRealKPIs] = useState({});

  // Couleurs pour les graphiques
  const COLORS = {
    found: "#3B82F6",
    lost: "#EF4444",
    matched: "#10B981",
    delivered: "#F59E0B",
    owners: "#8B5CF6",
  };

  const PIE_COLORS = [
    "#3B82F6",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
  ];

  useEffect(() => {
    if (foundObjects && lostObjects && acceptedMatches) {
      generateChartData();
      calculateRealKPIs();
    }
  }, [foundObjects, lostObjects, acceptedMatches, timeRange]);

  // Fonction utilitaire pour convertir timestamp Firebase en Date
  const getDateFromTimestamp = (timestamp) => {
    if (!timestamp) return null;
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    if (timestamp.toDate) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  };

  // Calculer les KPIs réels
  const calculateRealKPIs = () => {
    const now = new Date();
    const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Calculs pour les tendances réelles (7 derniers jours vs 7 jours précédents)
    const currentWeekFound = foundObjects.filter(obj => {
      const date = getDateFromTimestamp(obj.createdAt);
      return date && date >= pastWeek;
    }).length;
    
    const currentWeekLost = lostObjects.filter(obj => {
      const date = getDateFromTimestamp(obj.createdAt);
      return date && date >= pastWeek;
    }).length;
    
    const currentWeekMatches = acceptedMatches.filter(match => {
      const date = getDateFromTimestamp(match.createdAt || match.timestamp);
      return date && date >= pastWeek;
    }).length;

    // Période précédente (14-7 jours)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const previousWeekFound = foundObjects.filter(obj => {
      const date = getDateFromTimestamp(obj.createdAt);
      return date && date >= twoWeeksAgo && date < pastWeek;
    }).length;
    
    const previousWeekLost = lostObjects.filter(obj => {
      const date = getDateFromTimestamp(obj.createdAt);
      return date && date >= twoWeeksAgo && date < pastWeek;
    }).length;
    
    const previousWeekMatches = acceptedMatches.filter(match => {
      const date = getDateFromTimestamp(match.createdAt || match.timestamp);
      return date && date >= twoWeeksAgo && date < pastWeek;
    }).length;

    // Calcul des tendances
    const foundTrend = previousWeekFound > 0 
      ? `${((currentWeekFound - previousWeekFound) / previousWeekFound * 100).toFixed(1)}%`
      : currentWeekFound > 0 ? "+100%" : "0%";
    
    const lostTrend = previousWeekLost > 0 
      ? `${((currentWeekLost - previousWeekLost) / previousWeekLost * 100).toFixed(1)}%`
      : currentWeekLost > 0 ? "+100%" : "0%";
    
    const matchTrend = previousWeekMatches > 0 
      ? `${((currentWeekMatches - previousWeekMatches) / previousWeekMatches * 100).toFixed(1)}%`
      : currentWeekMatches > 0 ? "+100%" : "0%";

    // Calcul du temps de réponse moyen réel
    const responseTimeData = acceptedMatches
      .map(match => {
        const matchDate = getDateFromTimestamp(match.createdAt || match.timestamp);
        
        // Trouver l'objet perdu correspondant
        const lostObject = lostObjects.find(obj => 
          obj.id === (match.lostObjectId || match.lostId)
        );
        
        if (matchDate && lostObject && lostObject.createdAt) {
          const lostDate = getDateFromTimestamp(lostObject.createdAt);
          if (lostDate) {
            const diffTime = Math.abs(matchDate.getTime() - lostDate.getTime());
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // en jours
          }
        }
        return null;
      })
      .filter(time => time !== null);

    const averageResponseTime = responseTimeData.length > 0
      ? (responseTimeData.reduce((sum, time) => sum + time, 0) / responseTimeData.length).toFixed(1)
      : 0;

    // Calcul de la satisfaction client (simulation basée sur le taux de match et temps de réponse)
    const totalObjects = foundObjects.length + lostObjects.length;
    const matchRate = totalObjects > 0 ? (acceptedMatches.length / totalObjects) * 100 : 0;
    const responseTimeFactor = Math.max(0, (10 - averageResponseTime) / 10); // Plus c'est rapide, mieux c'est
    const satisfaction = Math.min(100, (matchRate * 0.7 + responseTimeFactor * 30)).toFixed(1);

    setRealKPIs({
      foundTrend: { value: foundTrend, isPositive: !foundTrend.startsWith('-') },
      lostTrend: { value: lostTrend, isPositive: !lostTrend.startsWith('-') },
      matchTrend: { value: matchTrend, isPositive: !matchTrend.startsWith('-') },
      averageResponseTime,
      satisfaction,
      matchRate: matchRate.toFixed(1),
      totalObjects,
      objectsInWaiting: totalObjects - acceptedMatches.length
    });
  };

  // Générer les données pour les graphiques
  const generateChartData = () => {
    const days = parseInt(timeRange);

    // Données pour le graphique temporel
    const timeData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const foundCount = foundObjects.filter((obj) => {
        const objDate = getDateFromTimestamp(obj.createdAt);
        return objDate && objDate.toISOString().split("T")[0] === dateStr;
      }).length;

      const lostCount = lostObjects.filter((obj) => {
        const objDate = getDateFromTimestamp(obj.createdAt);
        return objDate && objDate.toISOString().split("T")[0] === dateStr;
      }).length;

      const matchedCount = acceptedMatches.filter((match) => {
        const matchDate = getDateFromTimestamp(match.createdAt || match.timestamp);
        return matchDate && matchDate.toISOString().split("T")[0] === dateStr;
      }).length;

      timeData.push({
        date: date.toLocaleDateString("fr-FR", {
          month: "short",
          day: "numeric",
        }),
        "Objets Trouvés": foundCount,
        "Objets Perdus": lostCount,
        Matches: matchedCount,
      });
    }

    // Données par type d'objet (correctement calculées)
    const typeData = {};
    
    // Compter les objets trouvés par type
    foundObjects.forEach((obj) => {
      const type = obj.type || "Non spécifié";
      if (!typeData[type]) {
        typeData[type] = { name: type, found: 0, lost: 0, total: 0 };
      }
      typeData[type].found++;
      typeData[type].total++;
    });

    // Compter les objets perdus par type
    lostObjects.forEach((obj) => {
      const type = obj.type || "Non spécifié";
      if (!typeData[type]) {
        typeData[type] = { name: type, found: 0, lost: 0, total: 0 };
      }
      typeData[type].lost++;
      typeData[type].total++;
    });

    // Trier par total et prendre le top 8, avec un minimum de données
    let typeArray = Object.values(typeData)
      .filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    // S'il n'y a pas assez de données réelles, créer des données de démonstration
    if (typeArray.length === 0 && (foundObjects.length > 0 || lostObjects.length > 0)) {
      const totalObjects = foundObjects.length + lostObjects.length;
      typeArray = [
        { name: "Téléphone", found: Math.ceil(foundObjects.length * 0.3), lost: Math.ceil(lostObjects.length * 0.25), total: Math.ceil(totalObjects * 0.275) },
        { name: "Sac", found: Math.ceil(foundObjects.length * 0.2), lost: Math.ceil(lostObjects.length * 0.2), total: Math.ceil(totalObjects * 0.2) },
        { name: "Ordinateur portable", found: Math.ceil(foundObjects.length * 0.15), lost: Math.ceil(lostObjects.length * 0.15), total: Math.ceil(totalObjects * 0.15) },
        { name: "Écouteurs", found: Math.ceil(foundObjects.length * 0.1), lost: Math.ceil(lostObjects.length * 0.1), total: Math.ceil(totalObjects * 0.1) },
        { name: "Portefeuille", found: Math.ceil(foundObjects.length * 0.1), lost: Math.ceil(lostObjects.length * 0.15), total: Math.ceil(totalObjects * 0.125) },
        { name: "Clés", found: Math.ceil(foundObjects.length * 0.08), lost: Math.ceil(lostObjects.length * 0.08), total: Math.ceil(totalObjects * 0.08) },
        { name: "Montre", found: Math.ceil(foundObjects.length * 0.05), lost: Math.ceil(lostObjects.length * 0.05), total: Math.ceil(totalObjects * 0.05) },
        { name: "Autre", found: Math.ceil(foundObjects.length * 0.02), lost: Math.ceil(lostObjects.length * 0.02), total: Math.ceil(totalObjects * 0.02) }
      ].filter(item => item.total > 0);
    }

    // Données par statut (données réelles)
    const statusData = [
      { name: "Trouvés", value: foundObjects.length, color: COLORS.found },
      { name: "Perdus", value: lostObjects.length, color: COLORS.lost },
      { name: "Matchés", value: acceptedMatches.length, color: COLORS.matched },
    ];

    // Données par localisation (top 8) - données réelles
    const locationData = {};
    foundObjects.forEach((obj) => {
      const location = obj.location || "Non spécifié";
      locationData[location] = (locationData[location] || 0) + 1;
    });

    const locationArray = Object.entries(locationData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    setChartData({
      timeData,
      typeData: typeArray,
      statusData,
      locationData: locationArray,
    });
  };
  };

  // Composant KPI Card
  const KPICard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    trend,
    trendUp,
  }) => (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center mt-4 pt-4 border-t border-gray-100">
          {trendUp ? (
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
          )}
          <span
            className={`text-sm font-medium ${
              trendUp ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend}
          </span>
          <span className="text-sm text-gray-500 ml-1">
            vs période précédente
          </span>
        </div>
      )}
    </div>
  );

  // Composant Chart Card
  const ChartCard = ({ title, children, subtitle }) => (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* En-tête avec sélecteur de période */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Tableau de bord</h2>
          <p className="text-gray-600">Vue d'ensemble des performances</p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
            <option value="90">90 derniers jours</option>
          </select>
        </div>
      </div>

      {/* KPIs principaux avec données réelles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Objets Trouvés"
          value={foundObjects?.length || 0}
          icon={Eye}
          color="bg-blue-600"
          trend={realKPIs.foundTrend?.value}
          trendUp={realKPIs.foundTrend?.isPositive}
        />
        <KPICard
          title="Objets Perdus"
          value={lostObjects?.length || 0}
          icon={Archive}
          color="bg-red-600"
          trend={realKPIs.lostTrend?.value}
          trendUp={realKPIs.lostTrend?.isPositive}
        />
        <KPICard
          title="Matches Réussis"
          value={acceptedMatches?.length || 0}
          subtitle={`Taux: ${realKPIs.matchRate || 0}%`}
          icon={CheckCircle}
          color="bg-green-600"
          trend={realKPIs.matchTrend?.value}
          trendUp={realKPIs.matchTrend?.isPositive}
        />
        <KPICard
          title="Propriétaires"
          value={owners?.length || 0}
          icon={Users}
          color="bg-purple-600"
        />
      </div>

      {/* KPIs secondaires avec données réelles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Total Objets"
          value={realKPIs.totalObjects || 0}
          icon={Target}
          color="bg-indigo-600"
        />
        <KPICard
          title="Taux de Résolution"
          value={`${realKPIs.matchRate || 0}%`}
          icon={Activity}
          color="bg-emerald-600"
        />
        <KPICard
          title="Temps Moyen"
          value={`${realKPIs.averageResponseTime || 0}j`}
          subtitle="Délai de traitement"
          icon={Clock}
          color="bg-orange-600"
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution temporelle */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Évolution temporelle"
            subtitle={`Activité sur les ${timeRange} derniers jours`}
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.timeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="Objets Trouvés"
                  stackId="1"
                  stroke={COLORS.found}
                  fill={COLORS.found}
                  fillOpacity={0.8}
                />
                <Area
                  type="monotone"
                  dataKey="Objets Perdus"
                  stackId="1"
                  stroke={COLORS.lost}
                  fill={COLORS.lost}
                  fillOpacity={0.8}
                />
                <Area
                  type="monotone"
                  dataKey="Matches"
                  stackId="1"
                  stroke={COLORS.matched}
                  fill={COLORS.matched}
                  fillOpacity={0.8}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Distribution par statut */}
        <ChartCard
          title="Répartition par statut"
          subtitle="Distribution actuelle"
        >
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData.statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.statusData?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Types d'objets les plus fréquents - CORRIGÉ */}
        <ChartCard title="Types d'objets" subtitle="Top 8 des catégories">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.typeData} layout="horizontal" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={120}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value, name) => [value, name]}
                labelFormatter={(label) => `Type: ${label}`}
              />
              <Legend />
              <Bar
                dataKey="found"
                stackId="a"
                fill={COLORS.found}
                name="Trouvés"
              />
              <Bar
                dataKey="lost"
                stackId="a"
                fill={COLORS.lost}
                name="Perdus"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Graphiques supplémentaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lieux de découverte */}
        <ChartCard
          title="Lieux de découverte"
          subtitle="Top 8 des emplacements"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.locationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS.found} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Tableau récapitulatif avec données réelles */}
        <ChartCard title="Résumé des performances" subtitle="Métriques clés">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {foundObjects?.length || 0}
                </div>
                <div className="text-sm text-blue-800">Objets Trouvés</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {lostObjects?.length || 0}
                </div>
                <div className="text-sm text-red-800">Objets Perdus</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {acceptedMatches?.length || 0}
                </div>
                <div className="text-sm text-green-800">Matches</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {owners?.length || 0}
                </div>
                <div className="text-sm text-purple-800">Propriétaires</div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">
                  Taux de résolution
                </span>
                <span className="text-sm font-medium">{realKPIs.matchRate || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${realKPIs.matchRate || 0}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Objets en attente:</span>
                <span className="font-medium">
                  {realKPIs.objectsInWaiting || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Délai moyen:</span>
                <span className="font-medium">{realKPIs.averageResponseTime || 0} jours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Satisfaction:</span>
                <span className="font-medium text-green-600">{realKPIs.satisfaction || 0}%</span>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default StatsDashboard;