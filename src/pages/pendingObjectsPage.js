import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Eye,
  Loader,
  X,
  Clock,
  AlertCircle,
  CheckCircle,
  Archive,
  RefreshCw,
  Package,
  Settings,
  ChevronDown,
} from "lucide-react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../services/config/firebase";

const PendingObjectsPage = () => {
  const [pendingObjects, setPendingObjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Configuration de l'API
  const API_BASE_URL = "https://17e7-105-190-182-242.ngrok-free.app";

  // Charger les objets en attente depuis Firestore
  const loadPendingObjects = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔄 Chargement des objets en attente depuis Firestore...");

      const pendingCollection = collection(db, "objects_pending");
      const pendingQuery = query(
        pendingCollection,
        orderBy("timestamp", "desc")
      );
      const pendingSnapshot = await getDocs(pendingQuery);

      const objects = [];
      pendingSnapshot.forEach((doc) => {
        const data = doc.data();
        objects.push({
          id: doc.id,
          docId: data.docId || "N/A",
          description: data.description || "N/A",
          type: data.type || "N/A",
          timestamp: data.timestamp || null,
          ...data,
        });
      });

      setPendingObjects(objects);
      console.log(`✅ ${objects.length} objets en attente chargés:`, objects);
    } catch (err) {
      console.error("❌ Erreur lors du chargement des objets en attente:", err);
      setError(`Erreur lors du chargement: ${err.message}`);
    }

    setLoading(false);
  };

  // Traiter les objets en attente via l'API
  const processPendingObjects = async () => {
    const readyObjects = pendingObjects.filter(
      (obj) =>
        obj.docId &&
        obj.docId !== "N/A" &&
        obj.description &&
        obj.description !== "N/A" &&
        (obj.type === "found" || obj.type === "lost")
    );

    if (readyObjects.length === 0) {
      setError("Aucun objet prêt pour le traitement");
      return;
    }

    if (
      !window.confirm(`Voulez-vous traiter ${readyObjects.length} objet(s) ?`)
    ) {
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      console.log(`🚀 Début du traitement de ${readyObjects.length} objets...`);
      console.log("📡 Appel API:", `${API_BASE_URL}/process-pending-objects`);

      const response = await fetch(`${API_BASE_URL}/process-pending-objects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      console.log("📥 Réponse API reçue:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erreur de réponse API:", errorText);
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("✅ Résultat du traitement:", result);

      setSuccess(
        `Traitement terminé avec succès! ${
          result.processed?.length || 0
        } objets traités.`
      );

      // Recharger les données après traitement
      setTimeout(() => {
        console.log("🔄 Rechargement des données après traitement...");
        loadPendingObjects();
      }, 1500);
    } catch (err) {
      console.error("❌ Erreur lors du traitement:", err);
      setError(`Erreur lors du traitement: ${err.message}`);
    }

    setProcessing(false);
  };

  // Charger les données au montage du composant
  useEffect(() => {
    console.log("🎯 Composant monté, chargement initial des données...");
    loadPendingObjects();
  }, []);

  // Filtrer les données
  const filteredData = pendingObjects.filter((item) => {
    if (!item) return false;

    const searchFields = [item.docId, item.description, item.type].filter(
      Boolean
    );

    const matchesSearch =
      searchTerm === "" ||
      searchFields.some((field) =>
        String(field).toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesFilter =
      selectedFilter === "all" || item.type === selectedFilter;

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

  // Obtenir la couleur selon le type
  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case "found":
        return "bg-green-50 text-green-700 border-green-200";
      case "lost":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  // Calculer les statistiques
  const stats = {
    total: pendingObjects.length,
    found: pendingObjects.filter((obj) => obj.type === "found").length,
    lost: pendingObjects.filter((obj) => obj.type === "lost").length,
    ready: pendingObjects.filter(
      (obj) =>
        obj.docId &&
        obj.docId !== "N/A" &&
        obj.description &&
        obj.description !== "N/A" &&
        (obj.type === "found" || obj.type === "lost")
    ).length,
  };

  const filterOptions = [
    { value: "all", label: "Tous les types" },
    { value: "found", label: "Objets trouvés" },
    { value: "lost", label: "Objets perdus" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header minimaliste */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-orange-600" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Objets en Attente de Traitement
              </h1>
              <p className="text-gray-600 text-sm">
                Gestion des objets en attente de génération d'embeddings et de
                matching
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
                <p className="text-sm text-gray-600">Total en attente</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <Eye className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Objets trouvés</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.found}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <Archive className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Objets perdus</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lost}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <Settings className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Prêts à traiter</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.ready}
                </p>
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
                  placeholder="Rechercher par description, docId, type..."
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
                  <div className="absolute top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
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
                onClick={loadPendingObjects}
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

              <button
                onClick={processPendingObjects}
                disabled={processing || stats.ready === 0}
                className="flex items-center space-x-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {processing ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Settings className="w-4 h-4" />
                )}
                <span>
                  {processing
                    ? "Traitement en cours..."
                    : `Traiter ${stats.ready} objets`}
                </span>
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
                Chargement des objets en attente...
              </span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Doc ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((item) => {
                      const isReady =
                        item.docId &&
                        item.docId !== "N/A" &&
                        item.description &&
                        item.description !== "N/A" &&
                        (item.type === "found" || item.type === "lost");

                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-orange-600">
                              {item.docId}
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
                          <td className="px-6 py-4 max-w-xs">
                            <span className="text-sm text-gray-900 truncate block">
                              {item.description}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-500">
                              {formatTimestamp(item.timestamp)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                isReady
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {isReady ? "Prêt" : "Incomplet"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredData.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">
                    {searchTerm
                      ? "Aucun résultat trouvé pour votre recherche"
                      : "Aucun objet en attente de traitement"}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Les objets apparaîtront ici lorsqu'ils seront ajoutés à la
                    collection "objects_pending"
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
                  Détails - {selectedItem.docId}
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
                  <label className="block text-sm font-medium mb-2 text-gray-600">
                    Document ID
                  </label>
                  <div className="text-sm text-gray-900 break-words">
                    {selectedItem.docId}
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

                <div className="p-4 rounded-lg bg-gray-50 border md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-gray-600">
                    Description
                  </label>
                  <div className="text-sm text-gray-900 break-words">
                    {selectedItem.description}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 border">
                  <label className="block text-sm font-medium mb-2 text-gray-600">
                    date
                  </label>
                  <div className="text-sm text-gray-900">
                    {formatTimestamp(selectedItem.timestamp)}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 border">
                  <label className="block text-sm font-medium mb-2 text-gray-600">
                    ID Firestore
                  </label>
                  <div className="text-sm text-gray-900 break-words">
                    {selectedItem.id}
                  </div>
                </div>

                {/* Afficher tous les autres champs disponibles */}
                {Object.entries(selectedItem)
                  .filter(
                    ([key]) =>
                      ![
                        "id",
                        "docId",
                        "type",
                        "description",
                        "timestamp",
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

export default PendingObjectsPage;
