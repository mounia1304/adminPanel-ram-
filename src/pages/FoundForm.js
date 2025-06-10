import React, { useState } from "react";
import { saveFoundObjectReport } from "../services/firestore";
import { objectTypes } from "../utils/objecttypes";

const FoundForm = () => {
  const [formData, setFormData] = useState({
    typeObjet: "",
    description: "",
    lieu: "",
    numVol: "",
    pickupLocation: "",
  });
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isAutreSelected = formData.typeObjet === "Autre";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (
      !formData.typeObjet ||
      !formData.lieu ||
      !formData.numVol ||
      !formData.pickupLocation ||
      (isAutreSelected && !formData.description)
    ) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await saveFoundObjectReport(formData, image);
      alert(`Objet trouvé enregistré avec succès ! Ref: ${result.shortCode}`);
      setFormData({
        typeObjet: "",
        description: "",
        lieu: "",
        numVol: "",
        pickupLocation: "",
      });
      setImage(null);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 max-w-xl mx-auto">
      <div>
        <label>Type d'objet *</label>
        <select
          name="typeObjet"
          value={formData.typeObjet}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        >
          <option value="">-- Sélectionner --</option>
          {objectTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {isAutreSelected ? (
        <div>
          <label>Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>
      ) : (
        <div>
          <label>Description (facultative)</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
      )}

      <div>
        <label>Lieu où l’objet a été trouvé *</label>
        <input
          type="text"
          name="lieu"
          value={formData.lieu}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label>Numéro de vol *</label>
        <input
          type="text"
          name="numVol"
          value={formData.numVol}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label>Lieu de récupération *</label>
        <input
          type="text"
          name="pickupLocation"
          value={formData.pickupLocation}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label>Image (facultative)</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full"
        />
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
      >
        {submitting ? "Enregistrement..." : "Enregistrer l'objet"}
      </button>
    </form>
  );
};

export default FoundForm;
