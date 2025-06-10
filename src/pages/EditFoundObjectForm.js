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
  Plane,
  Loader,
} from "lucide-react";
import { updateFoundObject } from "../services/firestore";

const EditFoundObjectForm = ({
  objectId,
  initialData,
  onCancel,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    ref: "",
    type: "",
    description: "",
    location: "",
    pickupLocation: "",
    email: "",
    phone: "",
    volId: "",
    status: "found",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Types d'objets prédéfinis
  const objectTypes = [
    "Autre",
    "Bagage",
    "Téléphone",
    "Document",
    "Bijou",
    "Électronique",
    "Vêtement",
    "Accessoire",
  ];

  const statusOptions = [
    { value: "found", label: "Trouvé" },
    { value: "delivered", label: "Livré" },
    { value: "returned", label: "Rendu" },
  ];

  // Charger les données initiales
  useEffect(() => {
    if (initialData) {
      setFormData({
        ref: initialData.ref || "",
        type: initialData.type || "",
        description: initialData.description || "",
        location: initialData.location || "",
        pickupLocation: initialData.pickupLocation || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        volId: initialData.volId || "",
        status: initialData.status || "found",
      });

      // Afficher l'image existante (vérifier les deux champs possibles)
      const imageUrl = initialData.image || initialData.imageUrl;
      if (imageUrl) {
        setImagePreview(imageUrl);
      }
    }
  }, [initialData]);

  // Gérer les changements de champs
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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

  // Valider le formulaire
  const validateForm = () => {
    if (!formData.type) {
      setError("Le type d'objet est obligatoire");
      return false;
    }
    if (!formData.location.trim()) {
      setError("Le lieu de découverte est obligatoire");
      return false;
    }
    if (!formData.email.trim()) {
      setError("L'email de contact est obligatoire");
      return false;
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Veuillez entrer une adresse email valide");
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
      const result = await updateFoundObject(objectId, updateData, imageFile);

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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Modification de l'objet trouvé
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
                  initialData?.status === "found"
                    ? "bg-blue-100 text-blue-700"
                    : initialData?.status === "matched"
                    ? "bg-green-100 text-green-700"
                    : initialData?.status === "delivered"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {initialData?.status || "found"}
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
                <Tag className="w-5 h-5 mr-2 text-blue-600" />
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
                    placeholder="FND0001"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un type</option>
                    {objectTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vol ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Plane className="w-4 h-4 inline mr-1" />
                    ID Vol
                  </label>
                  <input
                    type="text"
                    value={formData.volId}
                    onChange={(e) => handleInputChange("volId", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="AT123, TH456..."
                  />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Description détaillée de l'objet trouvé..."
                />
              </div>
            </div>

            {/* Lieux */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                Localisation
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lieu de découverte */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lieu de découverte *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Où l'objet a été trouvé..."
                  />
                </div>

                {/* Lieu de récupération */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lieu de récupération
                  </label>
                  <input
                    type="text"
                    value={formData.pickupLocation}
                    onChange={(e) =>
                      handleInputChange("pickupLocation", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Où récupérer l'objet..."
                  />
                </div>
              </div>
            </div>

            {/* Informations de contact */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Contact
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email de contact *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="contact@royalairmaroc.com"
                  />
                </div>

                {/* Téléphone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+212 XXX XXX XXX"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite - Image et informations supplémentaires */}
          <div className="space-y-6">
            {/* Image */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-blue-600" />
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

            {/* Historique */}
            {initialData && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                  Historique
                </h4>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Créé le:</span>
                    <span className="font-medium">
                      {initialData.createdAt
                        ? new Date(
                            initialData.createdAt.seconds * 1000
                          ).toLocaleDateString("fr-FR")
                        : "N/A"}
                    </span>
                  </div>

                  {initialData.updatedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Modifié le:</span>
                      <span className="font-medium">
                        {new Date(
                          initialData.updatedAt.seconds * 1000
                        ).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Statut:</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        initialData.status === "found"
                          ? "bg-blue-100 text-blue-700"
                          : initialData.status === "matched"
                          ? "bg-green-100 text-green-700"
                          : initialData.status === "delivered"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {initialData.status || "found"}
                    </span>
                  </div>
                </div>
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
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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

export default EditFoundObjectForm;
