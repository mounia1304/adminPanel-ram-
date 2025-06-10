import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Archive,
  Eye,
  LogOut,
  User,
  Plane,
  Users,
  BarChart3,
  Loader,
  X,
  CheckCircle,
  Clock,
  MapPin,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Activity,
  Menu,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertCircle,
  Package,
  FolderOpen,
  Home,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../services/config/firebase";
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

// Import des fonctions Firestore
import {
  getFoundObjects,
  getLostObjects,
  getAllOwners,
  getAcceptedMatches,
  saveFoundObjectReport,
  addLostObject,
  updateFoundObject,
  updateLostObject,
  deleteFoundObject,
  deleteLostObject,
  deleteMatch,
  deleteOwnerDoc,
  searchAllCollections,
  getDashboardStats,
} from "../services/firestore";

// Import des composants de formulaire
import FoundForm from "./FoundForm";
import EditLostObjectForm from "./EditLostObjectForm";
import EditFoundObjectForm from "./EditFoundObjectForm";
import logoRamB from "../images/logoRamB.jpeg";

// Import des nouvelles pages
import PendingObjectsPage from "./pendingObjectsPage";
import ArchiveObjectsPage from "./archiveObjectsPage";
import NonDepositedObjectsPage from "./nonDepositedObjectsPage";

// Composant StatsDashboard intégré (gardé tel quel)
const StatsDashboard = ({
  stats,
  foundObjects,
  lostObjects,
  acceptedMatches,
  owners,
}) => {
  const [timeRange, setTimeRange] = useState("30");
  const [chartData, setChartData] = useState({});

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
    }
  }, [foundObjects, lostObjects, acceptedMatches, timeRange]);

  const generateChartData = () => {
    const days = parseInt(timeRange);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const timeData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const foundCount = foundObjects.filter((obj) => {
        const objDate = obj.createdAt?.seconds
          ? new Date(obj.createdAt.seconds * 1000).toISOString().split("T")[0]
          : null;
        return objDate === dateStr;
      }).length;

      const lostCount = lostObjects.filter((obj) => {
        const objDate = obj.createdAt?.seconds
          ? new Date(obj.createdAt.seconds * 1000).toISOString().split("T")[0]
          : null;
        return objDate === dateStr;
      }).length;

      const matchedCount = acceptedMatches.filter((match) => {
        const matchDate =
          match.createdAt?.seconds || match.timestamp?.seconds
            ? new Date(
                (match.createdAt?.seconds || match.timestamp?.seconds) * 1000
              )
                .toISOString()
                .split("T")[0]
            : null;
        return matchDate === dateStr;
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

    const typeData = {};
    [...foundObjects, ...lostObjects].forEach((obj) => {
      const type = obj.type || "Autre";
      if (!typeData[type]) {
        typeData[type] = { name: type, found: 0, lost: 0, total: 0 };
      }
      if (foundObjects.includes(obj)) {
        typeData[type].found++;
      } else {
        typeData[type].lost++;
      }
      typeData[type].total++;
    });

    const typeArray = Object.values(typeData)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const statusData = [
      { name: "Trouvés", value: foundObjects.length, color: COLORS.found },
      { name: "Perdus", value: lostObjects.length, color: COLORS.lost },
      { name: "Matchés", value: acceptedMatches.length, color: COLORS.matched },
    ];

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

  const calculateKPIs = () => {
    const totalObjects = (stats?.totalFound || 0) + (stats?.totalLost || 0);
    const matchRate =
      totalObjects > 0
        ? (((stats?.totalMatches || 0) / totalObjects) * 100).toFixed(1)
        : 0;

    const foundTrend = "+12%";
    const lostTrend = "+8%";
    const matchTrend = "+25%";
    const ownersTrend = "+15%";

    return {
      totalObjects,
      matchRate,
      trends: {
        found: foundTrend,
        lost: lostTrend,
        match: matchTrend,
        owners: ownersTrend,
      },
    };
  };

  const kpis = calculateKPIs();

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Objets Trouvés"
          value={stats?.totalFound || 0}
          icon={Eye}
          color="bg-blue-600"
          trend={kpis.trends.found}
          trendUp={true}
        />
        <KPICard
          title="Objets Perdus"
          value={stats?.totalLost || 0}
          icon={Archive}
          color="bg-red-600"
          trend={kpis.trends.lost}
          trendUp={true}
        />
        <KPICard
          title="Matches Réussis"
          value={stats?.totalMatches || 0}
          subtitle={`Taux: ${kpis.matchRate}%`}
          icon={CheckCircle}
          color="bg-green-600"
          trend={kpis.trends.match}
          trendUp={true}
        />
        <KPICard
          title="Propriétaires"
          value={stats?.totalOwners || 0}
          icon={Users}
          color="bg-purple-600"
          trend={kpis.trends.owners}
          trendUp={true}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Total des déclarations"
          value={kpis.totalObjects}
          icon={Target}
          color="bg-indigo-600"
        />
        <KPICard
          title="Taux de Résolution"
          value={`${kpis.matchRate}%`}
          icon={Activity}
          color="bg-emerald-600"
        />
        <KPICard
          title="Temps Moyen"
          value="2.5j"
          subtitle="Délai de traitement"
          icon={Clock}
          color="bg-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <ChartCard title="Types d'objets" subtitle="Top 8 des catégories">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData.typeData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <ChartCard title="Résumé des performances" subtitle="Métriques clés">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.totalFound || 0}
                </div>
                <div className="text-sm text-blue-800">Objets Trouvés</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {stats?.totalLost || 0}
                </div>
                <div className="text-sm text-red-800">Objets Perdus</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats?.totalMatches || 0}
                </div>
                <div className="text-sm text-green-800">Matches</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {stats?.totalOwners || 0}
                </div>
                <div className="text-sm text-purple-800">Propriétaires</div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">
                  Taux de résolution
                </span>
                <span className="text-sm font-medium">{kpis.matchRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${kpis.matchRate}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Objets en attente:</span>
                <span className="font-medium">
                  {(stats?.totalFound || 0) +
                    (stats?.totalLost || 0) -
                    (stats?.totalMatches || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Délai moyen:</span>
                <span className="font-medium">2.5 jours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Satisfaction:</span>
                <span className="font-medium text-green-600">94%</span>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("found");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");

  // États pour les données Firestore
  const [foundObjects, setFoundObjects] = useState([]);
  const [lostObjects, setLostObjects] = useState([]);
  const [owners, setOwners] = useState([]);
  const [acceptedMatches, setAcceptedMatches] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Configuration des champs avec ordre et labels personnalisés
  const excludedFields = [
    "id",
    "docPath",
    "embedding",
    "embeddings",
    "vector",
    "searchVector",
  ];

  const fieldConfigs = {
    found: {
      ref: { label: "Référence", order: 1 },
      type: { label: "Type d'objet", order: 2 },
      description: { label: "Description", order: 3 },
      location: { label: "Lieu de découverte", order: 4 },
      pickupLocation: { label: "Lieu de récupération", order: 5 },
      email: { label: "Email contact", order: 6 },
      phone: { label: "Téléphone contact", order: 7 },
      volId: { label: "ID Vol", order: 8 },
      status: { label: "Statut", order: 9 },
      image: { label: "Image", order: 10, type: "image" },
      createdAt: { label: "Date de création", order: 11, type: "date" },
      updatedAt: { label: "Dernière modification", order: 12, type: "date" },
    },
    lost: {
      ref: { label: "Référence", order: 1 },
      type: { label: "Type d'objet", order: 2 },
      description: { label: "Description", order: 3 },
      additionalDetails: { label: "Détails supplémentaires", order: 4 },
      location: { label: "Dernière localisation connue", order: 5 },
      color: { label: "Couleurs", order: 6, type: "array" },
      ownerId: { label: "ID Propriétaire", order: 7 },
      userId: { label: "ID Utilisateur", order: 8 },
      status: { label: "Statut", order: 9 },
      imageUrl: { label: "Image", order: 10, type: "image" },
      createdAt: { label: "Date de création", order: 11, type: "date" },
      updatedAt: { label: "Dernière modification", order: 12, type: "date" },
    },
    owners: {
      firstName: { label: "Prénom", order: 1 },
      lastName: { label: "Nom", order: 2 },
      email: { label: "Email", order: 3 },
      phone: { label: "Téléphone", order: 4 },
      PNR: { label: "PNR", order: 5 },
      userId: { label: "ID Utilisateur", order: 6 },
      lostObjectsCount: { label: "Nombre d'objets perdus", order: 7 },
      createdAt: { label: "Date d'inscription", order: 8, type: "date" },
    },
    matches: {
      foundObjectId: { label: "ID Objet trouvé", order: 1 },
      lostObjectId: { label: "ID Objet perdu", order: 2 },
      foundId: { label: "ID Objet trouvé", order: 1 },
      lostId: { label: "ID Objet perdu", order: 2 },
      score: { label: "Score de correspondance", order: 3, type: "percentage" },
      userId: { label: "ID Utilisateur", order: 4 },
      status: { label: "Statut", order: 5 },
      createdAt: { label: "Date de match", order: 6, type: "date" },
      timestamp: { label: "Date de match", order: 6, type: "date" },
    },
  };

  // Fonction pour filtrer et organiser les champs à afficher
  const getDisplayableFields = (item, activeTab) => {
    if (!item) return {};

    const currentConfig = fieldConfigs[activeTab] || {};
    const displayableFields = {};

    Object.entries(item)
      .filter(([key]) => !excludedFields.includes(key))
      .forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          const config = currentConfig[key] || {
            label:
              key.charAt(0).toUpperCase() +
              key.slice(1).replace(/([A-Z])/g, " $1"),
            order: 999,
          };

          displayableFields[key] = {
            ...config,
            value: value,
          };
        }
      });

    return Object.fromEntries(
      Object.entries(displayableFields).sort(
        ([, a], [, b]) => a.order - b.order
      )
    );
  };

  // Fonction pour formater les valeurs selon leur type
  const formatFieldValue = (value, type) => {
    if (!value) return "N/A";

    switch (type) {
      case "date":
        return formatDate(value);

      case "percentage":
        return typeof value === "number"
          ? `${(value * 100).toFixed(1)}%`
          : value;

      case "image":
        return value;

      case "array":
        return Array.isArray(value) ? value.join(", ") : value;

      default:
        if (Array.isArray(value)) {
          return value.join(", ");
        }
        if (typeof value === "object" && value.seconds) {
          return formatDate(value);
        }
        return String(value);
    }
  };

  // Composant pour afficher un champ
  const FieldDisplay = ({ fieldKey, fieldConfig }) => {
    const { label, value, type } = fieldConfig;

    if (type === "image" && value) {
      return (
        <div className="col-span-2 p-4 rounded-lg bg-gray-50 border border-gray-200">
          <label className="block text-sm font-medium mb-2 text-gray-600">
            {label}
          </label>
          <div className="flex justify-center">
            <img
              src={value}
              alt={label}
              className="max-w-xs max-h-48 object-contain rounded-lg shadow-md"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "block";
              }}
            />
            <div
              className="text-gray-500 text-sm hidden"
              style={{ display: "none" }}
            >
              Image non disponible
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
        <label className="block text-sm font-medium mb-2 text-gray-600">
          {label}
        </label>
        <div className="text-sm break-words text-gray-900">
          {formatFieldValue(value, type)}
        </div>
      </div>
    );
  };

  // Fonction de déconnexion
  const handleLogout = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      setError("Erreur lors de la déconnexion");
    }
  };

  // Charger les données selon l'onglet actif
  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      switch (activeTab) {
        case "found":
          const foundResult = await getFoundObjects();
          if (foundResult.success) {
            setFoundObjects(foundResult.data || []);
          } else {
            setError(foundResult.error);
          }
          break;

        case "lost":
          const lostResult = await getLostObjects();
          if (lostResult.success) {
            setLostObjects(lostResult.data || []);
          } else {
            setError(lostResult.error);
          }
          break;

        case "owners":
          console.log("🔄 Chargement des propriétaires...");
          const ownersResult = await getAllOwners();

          if (ownersResult.success) {
            console.log(
              "✅ Propriétaires chargés avec succès:",
              ownersResult.data
            );
            setOwners(ownersResult.data || []);
          } else {
            console.error(
              "❌ Échec du chargement des propriétaires:",
              ownersResult.error
            );
            setError(`Erreur propriétaires: ${ownersResult.error}`);
          }
          break;

        case "matches":
          const matchesResult = await getAcceptedMatches();
          if (matchesResult.success) {
            setAcceptedMatches(matchesResult.data || []);
          } else {
            setError(matchesResult.error);
          }
          break;

        case "stats":
          const [statsResult, foundRes, lostRes, matchesRes, ownersRes] =
            await Promise.all([
              getDashboardStats(),
              getFoundObjects(),
              getLostObjects(),
              getAcceptedMatches(),
              getAllOwners(),
            ]);

          if (statsResult.success) {
            setStats(statsResult.data);
          } else {
            setError(statsResult.error);
          }

          if (foundRes.success) setFoundObjects(foundRes.data || []);
          if (lostRes.success) setLostObjects(lostRes.data || []);
          if (matchesRes.success) setAcceptedMatches(matchesRes.data || []);
          if (ownersRes.success) setOwners(ownersRes.data || []);
          break;
      }
    } catch (err) {
      setError(`Erreur lors du chargement: ${err.message}`);
    }

    setLoading(false);
  };

  // Charger les données quand l'onglet change
  useEffect(() => {
    if (currentPage === "dashboard") {
      loadData();
    }
  }, [activeTab, currentPage]);

  // Obtenir les données selon l'onglet actif
  const getCurrentData = () => {
    switch (activeTab) {
      case "found":
        return foundObjects;
      case "lost":
        return lostObjects;
      case "owners":
        return owners;
      case "matches":
        return acceptedMatches;
      default:
        return [];
    }
  };

  // Filtrer les données
  const filteredData = getCurrentData().filter((item) => {
    if (!item) return false;

    let searchFields = [];

    switch (activeTab) {
      case "found":
        searchFields = [
          item.ref,
          item.description,
          item.type,
          item.location,
          item.email,
          item.phone,
          item.volId,
          item.status,
        ];
        break;
      case "lost":
        searchFields = [
          item.ref,
          item.description,
          item.type,
          item.location,
          item.additionalDetails,
          item.ownerId,
          item.userId,
          item.status,
        ];
        break;
      case "owners":
        searchFields = [
          item.id,
          item.email,
          item.firstName,
          item.lastName,
          item.phone,
          item.PNR,
          item.userId,
        ];
        break;
      case "matches":
        searchFields = [
          item.id,
          item.foundObjectId || item.foundId,
          item.lostObjectId || item.lostId,
          item.userId,
          item.status,
        ];
        break;
      default:
        searchFields = [item.ref, item.description, item.type];
    }

    searchFields = searchFields.filter(Boolean).map((field) => String(field));

    const matchesSearch =
      searchTerm === "" ||
      searchFields.some((field) =>
        field.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesFilter =
      selectedFilter === "all" ||
      item.status === selectedFilter ||
      (selectedFilter === "lost" && item.status === "lost") ||
      (selectedFilter === "found" && item.status === "found") ||
      (selectedFilter === "matched" && item.status === "matched") ||
      (selectedFilter === "accepted" && item.status === "accepted");

    return matchesSearch && matchesFilter;
  });

  // Recherche universelle
  const handleUniversalSearch = async () => {
    if (!searchTerm.trim()) {
      setError("Veuillez saisir un terme de recherche");
      return;
    }

    setLoading(true);
    const result = await searchAllCollections(searchTerm);
    if (result.success) {
      setSearchResults(result.data || []);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  // Ajouter un objet
  const handleAddObject = async (objectData, image) => {
    setLoading(true);
    setError(null);

    try {
      let result;
      if (activeTab === "found") {
        result = await saveFoundObjectReport(objectData, image);
      }

      if (result && result.success) {
        setShowAddForm(false);
        await loadData();
      } else {
        setError(result?.error || "Erreur lors de l'ajout");
      }
    } catch (error) {
      setError(`Erreur lors de l'ajout: ${error.message}`);
    }

    setLoading(false);
  };

  // Modifier un objet
  const handleUpdateObject = async (objectId, objectData, imageUri) => {
    setLoading(true);
    setError(null);

    try {
      let result;
      if (activeTab === "found") {
        result = await updateFoundObject(objectId, objectData, imageUri);
      } else if (activeTab === "lost") {
        result = await updateLostObject(objectId, objectData, imageUri);
      }

      if (result && result.success) {
        setEditingItem(null);
        await loadData();
      } else {
        setError(result?.error || "Erreur lors de la modification");
      }
    } catch (error) {
      setError(`Erreur lors de la modification: ${error.message}`);
    }

    setLoading(false);
  };

  // Supprimer un objet
  const handleDeleteObject = async (objectId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet élément ?"))
      return;

    setLoading(true);
    setError(null);

    try {
      let result;
      if (activeTab === "found") {
        result = await deleteFoundObject(objectId);
      } else if (activeTab === "lost") {
        result = await deleteLostObject(objectId);
      } else if (activeTab === "matches") {
        result = await deleteMatch(objectId);
      } else if (activeTab === "owners")
        result = await deleteOwnerDoc(objectId);

      if (result && result.success) {
        await loadData();
      } else {
        setError(result?.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      setError(`Erreur lors de la suppression: ${error.message}`);
    }

    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "trouvé":
      case "found":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "perdu":
      case "lost":
        return "bg-red-50 text-red-700 border-red-200";
      case "matché":
      case "matched":
        return "bg-emerald-green-50 text-emerald-700 border-emerald-200";
      case "en attente":
      case "waiting":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "restitué":
      case "delivered":
      case "accepted":
      case "confirmed":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString("fr-FR");
    }

    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString("fr-FR");
    }

    return new Date(timestamp).toLocaleDateString("fr-FR");
  };

  const handleNavigation = (pageId) => {
    setCurrentPage(pageId);
    console.log(`Navigation vers: ${pageId}`);

    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // Rendu des colonnes selon l'onglet
  const renderTableHeaders = () => {
    switch (activeTab) {
      case "found":
        return (
          <>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Référence
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Type
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Description
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Lieu
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Vol ID
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Date
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Statut
            </th>
            <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wider text-gray-600">
              Actions
            </th>
          </>
        );
      case "lost":
        return (
          <>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Référence
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Type
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Description
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Lieu de perte
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Couleurs
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Propriétaire
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Date
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Statut
            </th>
            <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wider text-gray-600">
              Actions
            </th>
          </>
        );
      case "owners":
        return (
          <>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              ID
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Prénom
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Nom
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Email
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Téléphone
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              PNR
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Date création
            </th>
            <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wider text-gray-600">
              Actions
            </th>
          </>
        );
      case "matches":
        return (
          <>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              ID Match
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Objet Trouvé
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Objet Perdu
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Utilisateur
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Score
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Date Match
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
              Statut
            </th>
            <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wider text-gray-600">
              Actions
            </th>
          </>
        );
      default:
        return null;
    }
  };

  const renderTableRow = (item) => {
    switch (activeTab) {
      case "found":
        return (
          <>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="text-sm font-medium text-red-700">
                {item.ref || `ID: ${item.id?.slice(0, 8)}`}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="text-sm text-gray-900">
                {item.type || "N/A"}
              </span>
            </td>
            <td className="px-6 py-4 max-w-xs">
              <span className="text-sm text-gray-900 truncate block">
                {item.description || "N/A"}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-yellow-600" />
                <span className="text-sm text-gray-600">
                  {item.location || "N/A"}
                </span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="text-sm text-gray-600">
                {item.volId || "N/A"}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="text-sm text-gray-600">
                {formatDate(item.createdAt)}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span
                className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                  item.status
                )}`}
              >
                {item.status || "found"}
              </span>
            </td>
          </>
        );
      case "lost":
        return (
          <>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="text-sm font-medium text-red-700">
                {item.ref || `ID: ${item.id?.slice(0, 8)}`}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="text-sm text-gray-900">
                {item.type || "N/A"}
              </span>
            </td>
            <td className="px-6 py-4 max-w-xs">
              <span className="text-sm text-gray-900 truncate block">
                {item.description || item.additionalDetails || "N/A"}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-yellow-600" />
                <span className="text-sm text-gray-600">
                  {item.location || "N/A"}
                </span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="text-sm text-gray-600">
                {Array.isArray(item.color)
                  ? item.color.join(", ")
                  : item.color || "N/A"}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="text-sm text-gray-600">
                {item.ownerId?.slice(0, 8) || "N/A"}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="text-sm text-gray-600">
                {formatDate(item.createdAt)}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span
                className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                  item.status
                )}`}
              >
                {item.status || "lost"}
              </span>
            </td>
          </>
        );
      case "owners":
        return (
          <>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="text-sm font-medium text-red-700">
                {item.id?.slice(0, 8) || "N/A"}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="text-sm text-gray-900">
                {item.firstName || "N/A"}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="text-sm text-gray-900">
                {item.lastName || "N/A"}
              </span>
            </td>
            <td className="px-6 py-4 max-w-xs">
              <span className="text-sm text-gray-900 truncate block">
                {item.email || "N/A"}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="text-sm text-gray-600">
                {item.phone || "N/A"}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="text-sm text-gray-600">{item.PNR || "N/A"}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="text-sm text-gray-600">
                {formatDate(item.createdAt)}
              </span>
            </td>
          </>
        );
      case "matches":
        return (
          <>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="text-sm font-medium text-red-700">
                {item.id?.slice(0, 8) || "N/A"}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {(item.foundObjectId || item.foundId)?.slice(0, 8) || "N/A"}
                </span>
                {item.foundObjectData && (
                  <span className="text-xs text-gray-600">
                    {item.foundObjectData.type} - {item.foundObjectData.ref}
                  </span>
                )}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {(item.lostObjectId || item.lostId)?.slice(0, 8) || "N/A"}
                </span>
                {item.lostObjectData && (
                  <span className="text-xs text-gray-600">
                    {item.lostObjectData.type} - {item.lostObjectData.ref}
                  </span>
                )}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="text-sm text-gray-600">
                {item.userId?.slice(0, 8) || "N/A"}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="text-sm text-gray-600">
                {item.score ? (item.score * 100).toFixed(1) + "%" : "N/A"}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="text-sm text-gray-600">
                {formatDate(item.createdAt || item.timestamp)}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span
                className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                  item.status
                )}`}
              >
                {item.status || "accepted"}
              </span>
            </td>
          </>
        );
      default:
        return null;
    }
  };

  // Composant Sidebar mis à jour
  const Sidebar = ({ isOpen, onToggle, currentPage, onNavigate }) => {
    const navigationItems = [
      {
        id: "dashboard",
        label: "Tableau de bord",
        icon: Home,
        badge: null,
        description: "Vue d'ensemble",
      },
      {
        id: "pending-declarations",
        label: "Déclarations en attente",
        icon: AlertCircle,
        badge: "12",
        description: "En cours de traitement",
      },
      {
        id: "unclaimed-objects",
        label: "Objets non récupérés",
        icon: Package,
        badge: "8",
        description: "Objets trouvés non récupérés",
      },
      {
        id: "archives",
        label: "Archives",
        icon: FolderOpen,
        badge: null,
        description: "Données archivées",
      },
      {
        id: "reports",
        label: "Rapports",
        icon: FileText,
        badge: null,
        description: "Génération de rapports",
      },
      {
        id: "settings",
        label: "Paramètres",
        icon: Settings,
        badge: null,
        description: "Configuration système",
      },
    ];

    return (
      <>
        {isOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
        <div
          className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white shadow-xl z-40 transition-all duration-300 ease-in-out border-r border-gray-200 ${
            isOpen ? "w-80" : "w-16"
          }`}
        >
          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                  currentPage === item.id
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
                title={!isOpen ? item.label : ""}
              >
                <item.icon
                  className={`w-5 h-5 ${
                    !isOpen ? "mx-auto" : ""
                  } flex-shrink-0`}
                />

                {isOpen && (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {item.description}
                      </p>
                    </div>

                    {item.badge && (
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            ))}
          </nav>
        </div>
      </>
    );
  };

  // Fonction pour rendre le contenu principal
  const renderMainContent = () => {
    switch (currentPage) {
      case "pending-declarations":
        return <PendingObjectsPage />;
      case "unclaimed-objects":
        return <NonDepositedObjectsPage />;
      case "archives":
        return <ArchiveObjectsPage />;
      case "reports":
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Rapports
                </h2>
                <p className="text-gray-600">
                  Module de génération de rapports en cours de développement
                </p>
              </div>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
              <div className="text-center">
                <Settings className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Paramètres
                </h2>
                <p className="text-gray-600">
                  Configuration système en cours de développement
                </p>
              </div>
            </div>
          </div>
        );
      case "dashboard":
      default:
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {error && (
              <div className="mb-6 p-4 rounded-lg flex items-center justify-between bg-red-50 border border-red-200">
                <p className="text-red-700">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="p-1 rounded hover:opacity-80 text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Onglets du dashboard principal */}
            <div className="flex space-x-1 mb-8 bg-white p-1 rounded-xl shadow-lg border border-gray-200">
              {[
                {
                  key: "found",
                  label: "Objets Trouvés",
                  count: foundObjects.length,
                  icon: Eye,
                  color: "#2563eb",
                },
                {
                  key: "lost",
                  label: "Objets Perdus",
                  count: lostObjects.length,
                  icon: Archive,
                  color: "#dc2626",
                },
                {
                  key: "matches",
                  label: "Matches Confirmés",
                  count: acceptedMatches.length,
                  icon: CheckCircle,
                  color: "#059669",
                },
                {
                  key: "owners",
                  label: "Propriétaires",
                  count: owners.length,
                  icon: Users,
                  color: "#7c2d12",
                },
                {
                  key: "stats",
                  label: "Statistiques",
                  count: 0,
                  icon: BarChart3,
                  color: "#d97706",
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-2 ${
                    activeTab === tab.key
                      ? "text-white shadow-md bg-red-700"
                      : "text-gray-600 hover:opacity-80"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        activeTab === tab.key
                          ? "bg-white text-red-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Affichage des statistiques */}
            {activeTab === "stats" && (
              <div>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="w-8 h-8 animate-spin text-red-700" />
                    <span className="ml-2 text-gray-600">
                      Chargement des statistiques...
                    </span>
                  </div>
                ) : (
                  <StatsDashboard
                    stats={stats}
                    foundObjects={foundObjects}
                    lostObjects={lostObjects}
                    acceptedMatches={acceptedMatches}
                    owners={owners}
                  />
                )}
              </div>
            )}

            {/* Barre de recherche */}
            {activeTab !== "stats" && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher par description, référence, type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleUniversalSearch()
                      }
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={selectedFilter}
                        onChange={(e) => setSelectedFilter(e.target.value)}
                        className="pl-10 pr-8 py-3 rounded-lg border border-gray-300 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="all">Tous les statuts</option>
                        <option value="found">Trouvé</option>
                        <option value="lost">Perdu</option>
                        <option value="matched">matché</option>
                        <option value="waiting">En attente</option>
                        <option value="delivered">Livré</option>
                        <option value="accepted">Accepté</option>
                      </select>
                    </div>

                    <button
                      onClick={handleUniversalSearch}
                      className="text-white px-4 py-3 rounded-lg bg-red-700 hover:bg-red-800 transition-all shadow-md"
                    >
                      Rechercher
                    </button>

                    {activeTab === "found" && (
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="text-white px-6 py-3 rounded-lg bg-orange-600 hover:bg-orange-700 transition-all flex items-center space-x-2 shadow-md"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Ajouter</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Table des données */}
            {activeTab !== "stats" && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="w-8 h-8 animate-spin text-red-700" />
                    <span className="ml-2 text-gray-600">Chargement...</span>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-red-50 border-b-2 border-gray-200">
                          <tr>{renderTableHeaders()}</tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredData.map((item) => (
                            <tr
                              key={item.id}
                              className="transition-all duration-200 hover:bg-gray-50 hover:shadow-md cursor-pointer"
                            >
                              {renderTableRow(item)}
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => setSelectedItem(item)}
                                    className="p-2 rounded-lg transition-colors hover:bg-blue-100 text-blue-600"
                                    title="Voir détails"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>

                                  {(activeTab === "found" ||
                                    activeTab === "lost") && (
                                    <button
                                      onClick={() => setEditingItem(item)}
                                      className="p-2 rounded-lg transition-colors hover:bg-purple-100 text-purple-600"
                                      title="Modifier"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleDeleteObject(item.id)}
                                    className="p-2 rounded-lg transition-colors hover:bg-red-100 text-red-600"
                                    title="Supprimer"
                                  >
                                    <Archive className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {filteredData.length === 0 && !loading && (
                      <div className="text-center py-12">
                        <Plane className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600">
                          {searchTerm
                            ? "Aucun résultat trouvé pour votre recherche"
                            : "Aucun élément trouvé"}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        currentPage={currentPage}
        onNavigate={handleNavigation}
      />

      {/* Contenu principal avec marge dynamique */}
      <div
        className={`min-h-screen bg-gray-50 transition-all duration-300 ${
          sidebarOpen ? "ml-80" : "ml-16"
        }`}
      >
        {/* Header principal */}
        <header className="bg-red-700 shadow-lg sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center h-16 px-4">
                {/* Bouton menu mobile */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-lg text-white hover:bg-white hover:bg-opacity-20 transition-colors mr-4 flex-shrink-0"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md overflow-hidden mr-3">
                  <img
                    src={logoRamB}
                    alt="logo ram"
                    className="w-8 h-8 object-contain"
                  />
                </div>

                <div>
                  <h1 className="text-xl font-bold text-white">
                    Royal Air Maroc
                  </h1>
                  <p className="text-xs text-red-200">Panel Administrateur</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-white hover:opacity-80 transition-colors px-4 py-2 rounded-lg bg-white bg-opacity-20"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Contenu principal */}
        {renderMainContent()}

        {/* Modale d'ajout */}
        {showAddForm && activeTab === "found" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-red-700">
                  Ajouter un objet trouvé
                </h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <FoundForm
                  onSubmit={handleAddObject}
                  onCancel={() => setShowAddForm(false)}
                  type={activeTab}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modale d'édition */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-red-700">
                  Modifier l'objet{" "}
                  {editingItem.ref || `ID: ${editingItem.id?.slice(0, 8)}`}
                </h2>
                <button
                  onClick={() => setEditingItem(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === "found" ? (
                  <EditFoundObjectForm
                    objectId={editingItem.id}
                    initialData={editingItem}
                    onCancel={() => setEditingItem(null)}
                    onSuccess={async () => {
                      setEditingItem(null);
                      await loadData();
                    }}
                  />
                ) : (
                  <EditLostObjectForm
                    objectId={editingItem.id}
                    initialData={editingItem}
                    onCancel={() => setEditingItem(null)}
                    onSuccess={async () => {
                      setEditingItem(null);
                      await loadData();
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de détails avec contrôle des champs */}
        {selectedItem && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-xl max-w-6xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div>
                  <h3 className="text-2xl font-bold text-red-700">
                    Détails -{" "}
                    {selectedItem.ref || `ID: ${selectedItem.id?.slice(0, 8)}`}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {activeTab === "found" && "Objet trouvé"}
                    {activeTab === "lost" && "Objet perdu"}
                    {activeTab === "owners" && "Propriétaire"}
                    {activeTab === "matches" && "Match confirmé"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenu avec contrôle des champs */}
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(
                  getDisplayableFields(selectedItem, activeTab)
                ).map(([key, config]) => (
                  <FieldDisplay key={key} fieldKey={key} fieldConfig={config} />
                ))}
              </div>

              {/* Section spéciale pour les matches */}
              {activeTab === "matches" &&
                (selectedItem.foundObjectData ||
                  selectedItem.lostObjectData) && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                      Détails des objets associés
                    </h4>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Objet trouvé */}
                      {selectedItem.foundObjectData && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h5 className="font-medium text-blue-800 mb-3">
                            Objet Trouvé
                          </h5>
                          <div className="space-y-2 text-sm">
                            <div>
                              <strong>Réf:</strong>{" "}
                              {selectedItem.foundObjectData.ref}
                            </div>
                            <div>
                              <strong>Type:</strong>{" "}
                              {selectedItem.foundObjectData.type}
                            </div>
                            <div>
                              <strong>Description:</strong>{" "}
                              {selectedItem.foundObjectData.description}
                            </div>
                            <div>
                              <strong>Lieu:</strong>{" "}
                              {selectedItem.foundObjectData.location}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Objet perdu */}
                      {selectedItem.lostObjectData && (
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                          <h5 className="font-medium text-red-800 mb-3">
                            Objet Perdu
                          </h5>
                          <div className="space-y-2 text-sm">
                            <div>
                              <strong>Réf:</strong>{" "}
                              {selectedItem.lostObjectData.ref}
                            </div>
                            <div>
                              <strong>Type:</strong>{" "}
                              {selectedItem.lostObjectData.type}
                            </div>
                            <div>
                              <strong>Description:</strong>{" "}
                              {selectedItem.lostObjectData.description ||
                                selectedItem.lostObjectData.additionalDetails}
                            </div>
                            <div>
                              <strong>Lieu:</strong>{" "}
                              {selectedItem.lostObjectData.location}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Footer */}
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-6 py-2 transition-colors rounded-lg hover:bg-gray-100 text-gray-600 border border-gray-300 bg-gray-50"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
