import React, { useState, useEffect } from "react";
import {
  Save,
  X,
  Upload,
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  Tag,
  FileText,
  Palette,
  Loader,
} from "lucide-react";
import { updateLostObject, getObjectById } from "../services/firestore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/config/firebase";

const EditLostObjectForm = ({ objectId, initialData, onCancel, onSuccess }) => {
  const [formData, setFormData] = useState({
    ref: "",
    type: "",
    description: "",
    additionalDetails: "",
    location: "",
    color: [],
    ownerId: "",
    userId: "",
    status: "lost",
  });

  const [ownerData, setOwnerData] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingOwner, setLoadingOwner] = useState(false);
  const [error, setError] = useState("");

  // Couleurs disponibles avec codes couleur
  const AVAILABLE_COLORS = [
    { name: "Rouge", hex: "#FF0000", value: "rouge" },
    { name: "Bleu", hex: "#2872e4", value: "bleu" },
    { name: "Vert", hex: "#17d345", value: "green" },
    { name: "Jaune", hex: "#FFFF00", value: "jaune" },
    { name: "Noir", hex: "#000000", value: "noir" },
    { name: "Blanc", hex: "#FFFFFF", value: "blanc", textColor: "#000" },
    { name: "Gris", hex: "#808080", value: "gris" },
    { name: "Rose", hex: "#ee5fa0", value: "rose" },
    { name: "Orange", hex: "#f3b42f", value: "orange" },
    { name: "Violet", hex: "#800080", value: "violet" },
    { name: "Marron", hex: "#782416", value: "marron" },
    { name: "Turquoise", hex: "#40E0D0", value: "turquoise" },
  ];

  // Types d'objets prédéfinis
  const objectTypes = [
    "Téléphone",
    "Ordinateur portable",
    "Tablette",
    "Montre",
    "Bijoux",
    "Sac à main",
    "Portefeuille",
    "Passeport",
    "Carte d'identité",
    "Clés",
    "Lunettes",
    "Livre",
    "Vêtements",
    "Chaussures",
    "Casque audio",
    "Chargeur",
    "Appareil photo",
    "Autre",
  ];

  const statusOptions = [
    { value: "lost", label: "Perdu" },
    { value: "found", label: "Trouvé" },
    { value: "matched", label: "Matché" },
    { value: "delivered", label: "Livré" },
  ];

  // Charger les données initiales
  useEffect(() => {
    if (initialData) {
      setFormData({
        ref: initialData.ref || "",
        type: initialData.type || "",
        description: initialData.description || "",
        additionalDetails: initialData.additionalDetails || "",
        location: initialData.location || "",
        color: Array.isArray(initialData.color) ? initialData.color : [],
        ownerId: initialData.ownerId || "",
        userId: initialData.userId || "",
        status: initialData.status || "lost",
      });

      // Afficher l'image existante
      if (initialData.imageUrl) {
        setImagePreview(initialData.imageUrl);
      }

      // Charger les données du propriétaire
      if (initialData.ownerId) {
        loadOwnerData(initialData.ownerId);
      }
    }
  }, [initialData]);

  // Charger les données du propriétaire
  const loadOwnerData = async (ownerId) => {
    setLoadingOwner(true);
    try {
      const ownerRef = doc(db, "ownersData", ownerId);
      const ownerSnap = await getDoc(ownerRef);

      if (ownerSnap.exists()) {
        setOwnerData(ownerSnap.data());
      } else {
        console.warn("Propriétaire non trouvé:", ownerId);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du propriétaire:", error);
    } finally {
      setLoadingOwner(false);
    }
  };

  // Gérer les changements de champs
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Si l'ownerId change, charger les nouvelles données
    if (field === "ownerId" && value && value !== formData.ownerId) {
      loadOwnerData(value);
    }
  };

  // Gérer l'upload d'image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith("image/")) {
        setError("Veuillez sélectionner un fichier image valide");
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("L'image ne doit pas dépasser 5MB");
        return;
      }

      setImageFile(file);

      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Ajouter/retirer une couleur
  const toggleColor = (colorValue) => {
    setFormData((prev) => ({
      ...prev,
      color: prev.color.includes(colorValue)
        ? prev.color.filter((c) => c !== colorValue)
        : [...prev.color, colorValue],
    }));
  };

  // Obtenir la couleur par sa valeur
  const getColorByValue = (value) => {
    return AVAILABLE_COLORS.find((color) => color.value === value);
  };

  // Valider le formulaire
  const validateForm = () => {
    if (!formData.type) {
      setError("Le type d'objet est obligatoire");
      return false;
    }
    if (!formData.location.trim()) {
      setError("Le lieu de perte est obligatoire");
      return false;
    }
    return true;
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Préparer les données à envoyer
      const updateData = {
        ...formData,
        updatedAt: new Date(),
      };

      // Appeler la fonction de mise à jour
      const result = await updateLostObject(objectId, updateData, imageFile);

      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      setError("Erreur lors de la mise à jour de l'objet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* En-tête avec informations de base */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Modification de l'objet perdu
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">ID:</span> {objectId?.slice(0, 8)}
            </div>
            <div>
              <span className="font-medium">Créé le:</span>{" "}
              {initialData?.createdAt
                ? new Date(
                    initialData.createdAt.seconds * 1000
                  ).toLocaleDateString("fr-FR")
                : "N/A"}
            </div>
            <div>
              <span className="font-medium">Statut actuel:</span>
              <span
                className={`ml-2 px-2 py-1 rounded text-xs ${
                  initialData?.status === "lost"
                    ? "bg-red-100 text-red-700"
                    : initialData?.status === "found"
                    ? "bg-blue-100 text-blue-700"
                    : initialData?.status === "matched"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {initialData?.status || "lost"}
              </span>
            </div>
          </div>
        </div>

        {/* Affichage des erreurs */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale - Informations de l'objet */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations de base */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-red-600" />
                Informations de l'objet
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Référence - Non modifiable */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Référence
                  </label>
                  <input
                    type="text"
                    value={formData.ref}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    placeholder="LST0001"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type d'objet *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange("type", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Sélectionner un type</option>
                    {objectTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Statut */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      handleInputChange("status", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Description de l'objet..."
                />
              </div>

              {/* Détails supplémentaires */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Détails supplémentaires
                </label>
                <textarea
                  value={formData.additionalDetails}
                  onChange={(e) =>
                    handleInputChange("additionalDetails", e.target.value)
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Informations supplémentaires..."
                />
              </div>

              {/* Lieu de perte */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Lieu de perte *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Terminal, avion, etc..."
                />
              </div>
            </div>

            {/* Couleurs */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Palette className="w-5 h-5 mr-2 text-red-600" />
                Couleurs
              </h4>

              {/* Couleurs sélectionnées */}
              {formData.color.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Couleurs sélectionnées :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {formData.color.map((colorValue, index) => {
                      const colorInfo = getColorByValue(colorValue);
                      return (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm border"
                          style={{
                            backgroundColor: colorInfo?.hex || "#gray",
                            color: colorInfo?.textColor || "#fff",
                            borderColor: colorInfo?.hex || "#gray",
                          }}
                        >
                          {colorInfo?.name || colorValue}
                          <button
                            type="button"
                            onClick={() => toggleColor(colorValue)}
                            className="ml-2 hover:opacity-80"
                            style={{ color: colorInfo?.textColor || "#fff" }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sélecteur de couleurs */}
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Choisir les couleurs :
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {AVAILABLE_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => toggleColor(color.value)}
                      className={`relative p-3 rounded-lg border-2 transition-all ${
                        formData.color.includes(color.value)
                          ? "border-gray-800 scale-95"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {/* Indicateur de sélection */}
                      {formData.color.includes(color.value) && (
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ color: color.textColor || "#fff" }}
                        >
                          <X className="w-4 h-4 font-bold" />
                        </div>
                      )}

                      {/* Texte de la couleur */}
                      <span
                        className="sr-only"
                        style={{ color: color.textColor || "#fff" }}
                      >
                        {color.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* IDs Utilisateur */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-red-600" />
                Identifiants
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Propriétaire
                  </label>
                  <input
                    type="text"
                    value={formData.ownerId}
                    onChange={(e) =>
                      handleInputChange("ownerId", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="ID du propriétaire"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Utilisateur
                  </label>
                  <input
                    type="text"
                    value={formData.userId}
                    onChange={(e) =>
                      handleInputChange("userId", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="ID de l'utilisateur"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite - Image et informations propriétaire */}
          <div className="space-y-6">
            {/* Image */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-red-600" />
                Image
              </h4>

              {/* Aperçu de l'image */}
              {imagePreview && (
                <div className="mb-4">
                  <img
                    src={imagePreview}
                    alt="Aperçu"
                    className="w-full h-48 object-cover rounded-lg border border-gray-300"
                  />
                </div>
              )}

              {/* Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    {imagePreview ? "Changer l'image" : "Télécharger une image"}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    PNG, JPG jusqu'à 5MB
                  </span>
                </label>
              </div>
            </div>

            {/* Informations du propriétaire */}
            {formData.ownerId && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-red-600" />
                  Propriétaire
                </h4>

                {loadingOwner ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader className="w-5 h-5 animate-spin text-red-600" />
                    <span className="ml-2 text-sm text-gray-600">
                      Chargement...
                    </span>
                  </div>
                ) : ownerData ? (
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm">
                        {ownerData.firstName} {ownerData.lastName}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm">{ownerData.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm">{ownerData.phone}</span>
                    </div>
                    {ownerData.PNR && (
                      <div className="flex items-center">
                        <Tag className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm">PNR: {ownerData.PNR}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Propriétaire non trouvé
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin mr-2" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditLostObjectForm;
