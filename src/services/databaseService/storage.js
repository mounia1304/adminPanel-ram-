import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";
import { v4 as uuidv4 } from "uuid"; // ✅ version web de uuid

/**
 * Upload une image vers Firebase Storage à partir d'un fichier local (type File ou Blob)
 * @param {File | Blob} file - Fichier image à uploader
 * @returns {Promise<string>} URL de téléchargement de l'image
 */
export const uploadImageAsync = async (file) => {
  try {
    if (!file || !(file instanceof Blob || file instanceof File)) {
      throw new Error("Fichier invalide.");
    }

    const extension = file.name?.split(".").pop() || "jpg";
    const filename = `${uuidv4()}.${extension}`;
    const imageRef = ref(storage, `found_images/${filename}`);

    await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(imageRef);

    return downloadURL;
  } catch (error) {
    console.error("❌ Erreur lors de l'upload de l'image :", error);
    throw error;
  }
};
