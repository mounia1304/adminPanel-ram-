import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Eye,
  Loader,
  X,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  MapPin,
  RefreshCw,
  Package,
  Calendar,
  ChevronDown,
  Phone,
  Mail,
  Hash,
  FileText,
} from "lucide-react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../services/config/firebase";

const NonDepositedObjectsPage = () => {
  const [foundObjects, setFoundObjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Charger les objets trouvés non déposés depuis Firestore
  const loadNonDepositedObjects = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log(
        "🔄 Chargement des objets trouvés non déposés depuis Firestore..."
      );

      const foundCollection = collection(db, "foundObjects");
      // Filtrer les objets où pickupLocation est vide ou null
      const foundQuery = query(
        foundCollection,
        where("pickupLocation", "==", ""),
        orderBy("createdAt", "desc")
      );
      const foundSnapshot = await getDocs(foundQuery);

      const objects = [];
      foundSnapshot.forEach((doc) => {
        const data = doc.data();
        objects.push({
          id: doc.id,
          ref: data.ref || "N/A",
          description: data.description || "N/A",
          location: data.location || "N/A",
          type: data.type || "N/A",
          status: data.status || "found",
          email: data.email || "N/A",
          phone: data.phone || "N/A",
          volId: data.volId || "N/A",
          pickupLocation: data.pickupLocation || "",
          image: data.image || "",
          docPath: data.docPath || "",
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null,
          // Ne PAS inclure embedding
          ...Object.fromEntries(
            Object.entries(data).filter(([key]) => key !== "embedding")
          ),
        });
      });

      setFoundObjects(objects);
      console.log(
        `✅ ${objects.length} objets trouvés non déposés chargés:`,
        objects
      );
    } catch (err) {
      console.error("❌ Erreur lors du chargement des objets trouvés:", err);
      setError(`Erreur lors du chargement: ${err.message}`);
    }

    setLoading(false);
  };

  // Charger les données au montage du composant
  useEffect(() => {
    console.log(
      "🎯 Composant monté, chargement initial des objets non déposés..."
    );
    loadNonDepositedObjects();
  }, []);

  // Filtrer les données
  const filteredData = foundObjects.filter((item) => {
    if (!item) return false;

    const searchFields = [
      item.ref,
      item.description,
      item.location,
      item.type,
      item.email,
      item.phone,
      item.volId,
    ].filter(Boolean);

    const matchesSearch =
      searchTerm === "" ||
      searchFields.some((field) =>
        String(field).toLowerCase().includes(searchTerm.toLowerCase())
      );

    let matchesFilter = true;
    if (selectedFilter === "recent") {
      // Objets des 7 derniers jours
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const itemDate = item.createdAt?.seconds
        ? new Date(item.createdAt.seconds * 1000)
        : new Date(item.createdAt);
      matchesFilter = itemDate >= weekAgo;
    } else if (selectedFilter === "old") {
      // Objets de plus de 30 jours
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const itemDate = item.createdAt?.seconds
        ? new Date(item.createdAt.seconds * 1000)
        : new Date(item.createdAt);
      matchesFilter = itemDate < monthAgo;
    } else if (selectedFilter !== "all") {
      matchesFilter = item.type?.toLowerCase() === selectedFilter.toLowerCase();
    }

    return matchesSearch && matchesFilter;
  });

  // Formater la date
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";

    try {
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      return new Date(timestamp).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Erreur formatage date:", error);
      return "Date invalide";
    }
  };

  // Calculer l'ancienneté en jours
  const getDaysOld = (timestamp) => {
    if (!timestamp) return 0;

    try {
      const itemDate = timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);
      const now = new Date();
      const diffTime = Math.abs(now - itemDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      return 0;
    }
  };

  // Obtenir la couleur selon l'ancienneté
  const getAgeColor = (days) => {
    if (days <= 7) return "bg-green-100 text-green-800";
    if (days <= 30) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  // Obtenir la couleur selon le type
  const getTypeColor = (type) => {
    const colors = {
      téléphone: "bg-blue-100 text-blue-800",
      portefeuille: "bg-green-100 text-green-800",
      clés: "bg-yellow-100 text-yellow-800",
      sac: "bg-purple-100 text-purple-800",
      bijoux: "bg-pink-100 text-pink-800",
      montre: "bg-indigo-100 text-indigo-800",
      lunettes: "bg-gray-100 text-gray-800",
    };
    return colors[type?.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  // Calculer les statistiques
  const stats = {
    total: foundObjects.length,
    recent: foundObjects.filter((obj) => getDaysOld(obj.createdAt) <= 7).length,
    medium: foundObjects.filter((obj) => {
      const days = getDaysOld(obj.createdAt);
      return days > 7 && days <= 30;
    }).length,
    old: foundObjects.filter((obj) => getDaysOld(obj.createdAt) > 30).length,
  };

  // Options de filtre basées sur les types uniques
  const uniqueTypes = [
    ...new Set(foundObjects.map((obj) => obj.type).filter(Boolean)),
  ];
  const filterOptions = [
    { value: "all", label: "Tous les objets" },
    { value: "recent", label: "Récents (7 jours)" },
    { value: "old", label: "Anciens (+30 jours)" },
    ...uniqueTypes.map((type) => ({ value: type, label: type })),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header minimaliste */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Objets Trouvés Non Déposés
              </h1>
              <p className="text-gray-600 text-sm">
                Objets trouvés en attente de dépôt (pickupLocation vide)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Statistiques minimalistes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total non déposés</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Récents (≤7j)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.recent}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Moyens (8-30j)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.medium}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Anciens (+30j)</p>
                <p className="text-2xl font-bold text-gray-900">{stats.old}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages d'erreur et de succès */}
        {error && (
          <div className="mb-4 p-4 rounded-lg flex items-center justify-between bg-red-50 border border-red-200">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="p-1 rounded hover:bg-red-100 text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 rounded-lg flex items-center justify-between bg-green-50 border border-green-200">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <p className="text-green-700">{success}</p>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="p-1 rounded hover:bg-green-100 text-green-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Barre d'actions */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Recherche */}
            <div className="flex-1 w-full lg:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par ref, description, lieu, type, email, téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 w-full lg:w-auto">
              {/* Filtre */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <Filter className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-700">
                    {
                      filterOptions.find((opt) => opt.value === selectedFilter)
                        ?.label
                    }
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showFilterDropdown && (
                  <div className="absolute top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-64 overflow-y-auto">
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedFilter(option.value);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                          selectedFilter === option.value
                            ? "bg-orange-50 text-orange-700"
                            : "text-gray-700"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={loadNonDepositedObjects}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <RefreshCw
                  className={`w-4 h-4 text-gray-600 ${
                    loading ? "animate-spin" : ""
                  }`}
                />
                <span className="text-gray-700">Actualiser</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 animate-spin text-orange-600 mr-2" />
              <span className="text-gray-600">
                Chargement des objets non déposés...
              </span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Référence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date trouve
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Télephone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ancienneté
                      </th>

                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((item) => {
                      const daysOld = getDaysOld(item.createdAt);

                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-orange-600">
                              {item.ref}
                            </span>
                          </td>
                          <td className="px-6 py-4 max-w-xs">
                            <span className="text-sm font-medium text-gray-900 truncate block">
                              {item.description}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(
                                item.type
                              )}`}
                            >
                              {item.type}
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                              <span className="text-sm text-gray-500">
                                {formatTimestamp(item.createdAt)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-sm text-gray-700">
                                {item.phone}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-700">
                              {item.email}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAgeColor(
                                daysOld
                              )}`}
                            >
                              {daysOld} jour{daysOld > 1 ? "s" : ""}
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => setSelectedItem(item)}
                              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                              title="Voir détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredData.length === 0 && !loading && (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">
                    {searchTerm
                      ? "Aucun résultat trouvé pour votre recherche"
                      : "Aucun objet trouvé non déposé"}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {searchTerm
                      ? "Essayez de modifier votre recherche ou vos filtres"
                      : "Tous les objets trouvés ont été déposés ou aucun objet n'est enregistré"}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal de détails */}
        {selectedItem && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <h3 className="text-xl font-semibold text-gray-900">
                  Détails - {selectedItem.ref}
                </h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-gray-50 border">
                  <label className="block text-sm font-medium mb-2 text-gray-600 flex items-center">
                    <Hash className="w-4 h-4 mr-1" />
                    Référence
                  </label>
                  <div className="text-sm font-semibold text-orange-600">
                    {selectedItem.ref}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 border">
                  <label className="block text-sm font-medium mb-2 text-gray-600">
                    Statut
                  </label>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    {selectedItem.status}
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 border md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-gray-600 flex items-center">
                    <FileText className="w-4 h-4 mr-1" />
                    Description
                  </label>
                  <div className="text-sm text-gray-900 break-words">
                    {selectedItem.description}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 border">
                  <label className="block text-sm font-medium mb-2 text-gray-600">
                    Type
                  </label>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(
                      selectedItem.type
                    )}`}
                  >
                    {selectedItem.type}
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 border">
                  <label className="block text-sm font-medium mb-2 text-gray-600 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    Lieu trouve
                  </label>
                  <div className="text-sm text-gray-900">
                    {selectedItem.location}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 border">
                  <label className="block text-sm font-medium mb-2 text-gray-600 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Date trouve
                  </label>
                  <div className="text-sm text-gray-900">
                    {formatTimestamp(selectedItem.createdAt)}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 border">
                  <label className="block text-sm font-medium mb-2 text-gray-600">
                    vol ID
                  </label>
                  <div className="text-sm text-gray-900">
                    {selectedItem.volId}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 border">
                  <label className="block text-sm font-medium mb-2 text-gray-600 flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </label>
                  <div className="text-sm text-gray-900 break-words">
                    {selectedItem.email}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 border">
                  <label className="block text-sm font-medium mb-2 text-gray-600 flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    Téléphone
                  </label>
                  <div className="text-sm text-gray-900">
                    {selectedItem.phone}
                  </div>
                </div>

                {selectedItem.image && (
                  <div className="p-4 rounded-lg bg-gray-50 border">
                    <label className="block text-sm font-medium mb-2 text-gray-600">
                      Image
                    </label>
                    <div className="text-sm text-gray-900 break-words">
                      {selectedItem.image || "Aucune image"}
                    </div>
                  </div>
                )}

                {/* Afficher tous les autres champs disponibles (sauf embedding) */}
                {Object.entries(selectedItem)
                  .filter(
                    ([key]) =>
                      ![
                        "id",
                        "ref",
                        "description",
                        "location",
                        "type",
                        "status",
                        "email",
                        "phone",
                        "volId",
                        "pickupLocation",
                        "image",
                        "docPath",
                        "createdAt",
                        "updatedAt",
                        "embedding", // JAMAIS afficher embedding
                      ].includes(key)
                  )
                  .map(([key, value]) => (
                    <div key={key} className="p-4 rounded-lg bg-gray-50 border">
                      <label className="block text-sm font-medium mb-2 text-gray-600">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </label>
                      <div className="text-sm text-gray-900 break-words">
                        {typeof value === "object"
                          ? JSON.stringify(value, null, 2)
                          : String(value)}
                      </div>
                    </div>
                  ))}
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close filter dropdown */}
      {showFilterDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowFilterDropdown(false)}
        />
      )}
    </div>
  );
};

export default NonDepositedObjectsPage;
