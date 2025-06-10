import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  setDoc,
  runTransaction,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, auth, storage } from "./config/firebase";
import { uploadImageAsync } from "./databaseService/storage";
// ============ OBJETS TROUVÉS ============

export const getFoundObjects = async () => {
  try {
    const foundRef = collection(db, "foundObjects");
    const q = query(foundRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    const foundObjects = [];
    snapshot.forEach((doc) => {
      foundObjects.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return {
      success: true,
      data: foundObjects,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des objets trouvés:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
//ajouter un nv objet perdu par un admin

/**
 * Génère un code court unique (ex : FND1234)
 */
const generateShortCode = async () => {
  const counterRef = doc(db, "counters", "foundObjects");

  const shortCode = await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);

    let newCount = 1;
    if (counterSnap.exists()) {
      const data = counterSnap.data();
      newCount = (data.lastCount || 0) + 1;
    }

    transaction.set(counterRef, { lastCount: newCount }, { merge: true });

    const padded = String(newCount).padStart(4, "0"); // FND0001, FND0023...
    return `FND${padded}`;
  });

  return shortCode;
};

/**
 * Enregistre le rapport d'objet trouvé avec image et code QR.
 * @param {Object} data - Données du formulaire.
 * @param {string} imageUri - URI de l'image sélectionnée.
 * @returns {Promise<{ docId: string, shortCode: string }>}
 */
export const saveFoundObjectReport = async (data, imageUri) => {
  try {
    console.log("🚀 Début enregistrement FOUND");
    let imageUrl = "";

    // Upload image si fournie
    if (
      imageUri &&
      typeof imageUri === "string" &&
      imageUri.startsWith("file")
    ) {
      console.log("⏫ Upload image en cours...");
      imageUrl = await uploadImageAsync(imageUri);
      console.log("✅ Image uploadée :", imageUrl);
    }

    // Génération du short code unique
    const shortCode = await generateShortCode();

    // Génération d'un docId (Firestore auto-ID)
    const newDocRef = doc(collection(db, "foundObjects"));
    const docId = newDocRef.id;

    // Création des données à enregistrer
    const reportData = {
      type: data.typeObjet,
      description: data.description,
      location: data.lieu,
      volId: data.numVol,
      createdAt: serverTimestamp(),
      updatedAt: null,
      image: imageUrl,
      ref: shortCode,
      docPath: `/foundObjects/${docId}`,
      status: "found",
      pickupLocation: data.pickupLocation,
    };

    // Enregistrement dans Firestore
    await setDoc(newDocRef, reportData);
    console.log("✅ Rapport enregistré :", docId);

    // --- 🔁 Appel à l'API Flask pour générer embedding et comparer ---
    (async () => {
      try {
        const fullDescription = `
Type: ${data.typeObjet}.
Lieu de récupération: ${data.lieu}.
Vol n°: ${data.numVol}.
Description: ${data.description}.
        `.trim();

        const response = await fetch(
          "https://464b-105-190-182-242.ngrok-free.app/generate-embedding",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              docId,
              description: fullDescription,
              type: "found",
            }),
          }
        );

        if (!response.ok) {
          console.warn("⚠️ API Flask erreur status:", response.status);
        } else {
          const result = await response.json();
          console.log("✅ API Flask réponse :", result);
        }
      } catch (apiError) {
        console.warn("⚠️ Erreur appel API Flask :", apiError);
      }
    })();
    // --- fin appel API ---

    return { docId, shortCode };
  } catch (error) {
    console.error("❌ Erreur saveFoundObjectReport :", error);
    throw error;
  }
};

export const updateFoundObject = async (objectId, objectData, imageUri) => {
  try {
    const foundRef = doc(db, "foundObjects", objectId);
    let updateData = {
      ...objectData,
      updatedAt: serverTimestamp(),
    };

    // Upload nouvelle image si fournie
    if (imageUri) {
      const imageRef = ref(
        storage,
        `found-objects/${Date.now()}-${Math.random()}`
      );
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const uploadResult = await uploadBytes(imageRef, blob);
      const imageUrl = await getDownloadURL(uploadResult.ref);
      updateData.imageUrl = imageUrl;
    }

    await updateDoc(foundRef, updateData);

    return {
      success: true,
      data: updateData,
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'objet trouvé:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const deleteFoundObject = async (objectId) => {
  try {
    // Récupérer les données de l'objet pour supprimer l'image
    const foundRef = doc(db, "foundObjects", objectId);
    const docSnap = await getDoc(foundRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // Supprimer l'image du storage si elle existe
      if (data.imageUrl) {
        try {
          const imageRef = ref(storage, data.imageUrl);
          await deleteObject(imageRef);
        } catch (storageError) {
          console.warn(
            "Erreur lors de la suppression de l'image:",
            storageError
          );
        }
      }
    }

    // Supprimer le document
    await deleteDoc(foundRef);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erreur lors de la suppression de l'objet trouvé:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============ OBJETS PERDUS ============

export const getLostObjects = async () => {
  try {
    const lostRef = collection(db, "lostObjects");
    const q = query(lostRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    const lostObjects = [];
    snapshot.forEach((doc) => {
      lostObjects.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return {
      success: true,
      data: lostObjects,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des objets perdus:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const addLostObject = async (objectData) => {
  try {
    const lostRef = collection(db, "lostObjects");
    const docData = {
      ...objectData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: objectData.status || "perdu",
    };

    const docRef = await addDoc(lostRef, docData);

    return {
      success: true,
      data: { id: docRef.id, ...docData },
    };
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'objet perdu:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const updateLostObject = async (objectId, objectData) => {
  try {
    const lostRef = doc(db, "lostObjects", objectId);
    const updateData = {
      ...objectData,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(lostRef, updateData);

    return {
      success: true,
      data: updateData,
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'objet perdu:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const deleteLostObject = async (objectId) => {
  try {
    const lostRef = doc(db, "lostObjects", objectId);
    await deleteDoc(lostRef);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erreur lors de la suppression de l'objet perdu:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============ PROPRIÉTAIRES ============

export const getOwnersData = async () => {
  try {
    console.log("🔍 Début de la récupération des propriétaires...");

    // Les propriétaires sont généralement créés lors de la soumission d'objets perdus
    // Récupérons les utilisateurs uniques depuis la collection lostObjects
    const lostRef = collection(db, "lostObjects");
    const snapshot = await getDocs(lostRef);

    console.log("📊 Nombre d'objets perdus trouvés:", snapshot.size);

    const ownersMap = new Map();

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log("📄 Données objet perdu:", data);

      if (data.email) {
        const ownerId = data.ownerId || doc.id;
        if (!ownersMap.has(data.email)) {
          ownersMap.set(data.email, {
            id: ownerId,
            email: data.email,
            telephone: data.telephone || data.phone,
            lostObjectsCount: 1,
            createdAt: data.createdAt,
            lostObjects: [doc.id],
          });
        } else {
          const existing = ownersMap.get(data.email);
          existing.lostObjectsCount += 1;
          existing.lostObjects.push(doc.id);
        }
      }
    });

    const owners = Array.from(ownersMap.values());
    console.log("👥 Propriétaires extraits:", owners);

    return {
      success: true,
      data: owners,
    };
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des propriétaires:",
      error
    );
    return {
      success: false,
      error: error.message,
    };
  }
};

// Alternative : Si vous avez une collection séparée pour les owners
export const getOwnersFromCollection = async () => {
  try {
    console.log("🔍 Tentative de récupération depuis la collection owners...");

    const ownersRef = collection(db, "ownersData");
    const snapshot = await getDocs(ownersRef);

    console.log(
      "📊 Nombre de propriétaires dans la collection owners:",
      snapshot.size
    );

    const owners = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log("👤 Propriétaire trouvé:", data);
      owners.push({
        id: doc.id,
        ...data,
      });
    });

    return {
      success: true,
      data: owners,
    };
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des propriétaires depuis la collection owners:",
      error
    );
    return {
      success: false,
      error: error.message,
    };
  }
};

// Nouvelle fonction : récupération hybride
export const getAllOwners = async () => {
  try {
    console.log("🔄 Récupération des propriétaires depuis ownersData...");

    // Utiliser la collection ownersData au lieu de owners
    const ownersRef = collection(db, "ownersData");
    const snapshot = await getDocs(ownersRef);

    console.log("📊 Nombre de propriétaires dans ownersData:", snapshot.size);

    const owners = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log("👤 Propriétaire trouvé:", data);

      // Mapper les champs selon votre structure
      owners.push({
        id: doc.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        PNR: data.PNR,
        userId: data.userId,
        createdAt: data.createdAt,
        // Calculer le nombre d'objets perdus pour ce propriétaire
        lostObjectsCount: 0, // Sera calculé séparément
      });
    });
    // Calculer le nombre d'objets perdus pour chaque propriétaire
    const lostRef = collection(db, "lostObjects");
    const lostSnapshot = await getDocs(lostRef);

    // Créer un map pour compter les objets par ownerId
    const lostCountMap = new Map();
    lostSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.ownerId) {
        lostCountMap.set(
          data.ownerId,
          (lostCountMap.get(data.ownerId) || 0) + 1
        );
      }
    });

    // Ajouter le compte d'objets perdus à chaque propriétaire
    owners.forEach((owner) => {
      owner.lostObjectsCount = lostCountMap.get(owner.id) || 0;
    });

    console.log("✅ Propriétaires traités:", owners);

    return {
      success: true,
      data: owners,
    };
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des propriétaires:",
      error
    );
    return {
      success: false,
      error: error.message,
    };
  }
};
export const deleteOwnerDoc = async (objectId) => {
  try {
    const ownerDocRef = doc(db, "ownersData", objectId); // ✅ Référence au document à supprimer
    await deleteDoc(ownerDocRef);

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression du propriétaire :", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============ MATCHES ACCEPTÉS ============

export const getAcceptedMatches = async () => {
  try {
    console.log("🔄 Récupération des matches acceptés...");

    const matchesRef = collection(db, "matches");
    const q = query(matchesRef, where("status", "==", "accepted"));
    const snapshot = await getDocs(q);

    console.log("📊 Nombre de matches acceptés:", snapshot.size);

    const matches = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      console.log("🔗 Match trouvé:", data);

      const matchData = {
        id: doc.id,
        foundObjectId: data.foundId, // Utiliser foundId au lieu de foundObjectId
        lostObjectId: data.lostId, // Utiliser lostId au lieu de lostObjectId
        score: data.score,
        status: data.status,
        createdAt: data.timestamp, // Utiliser timestamp au lieu de createdAt
        matchedAt: data.timestamp,
        userId: data.userId,
      };

      // Enrichir avec les données des objets trouvés et perdus
      try {
        if (data.foundId) {
          const foundRef = doc(db, "foundObjects", data.foundId);
          const foundSnap = await getDoc(foundRef);
          if (foundSnap.exists()) {
            matchData.foundObjectData = foundSnap.data();
          }
        }

        if (data.lostId) {
          const lostRef = doc(db, "lostObjects", data.lostId);
          const lostSnap = await getDoc(lostRef);
          if (lostSnap.exists()) {
            const lostData = lostSnap.data();
            matchData.lostObjectData = lostData;

            // Récupérer l'email du propriétaire depuis ownersData
            if (lostData.ownerId) {
              const ownerRef = doc(db, "ownersData", lostData.ownerId);
              const ownerSnap = await getDoc(ownerRef);
              if (ownerSnap.exists()) {
                matchData.ownerEmail = ownerSnap.data().email;
                matchData.ownerData = ownerSnap.data();
              }
            }
          }
        }
      } catch (enrichError) {
        console.warn("Erreur lors de l'enrichissement du match:", enrichError);
      }

      matches.push(matchData);
    }

    // Trier par date de création (plus récent d'abord)
    matches.sort((a, b) => {
      const dateA = a.createdAt?.seconds || a.matchedAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || b.matchedAt?.seconds || 0;
      return dateB - dateA;
    });

    console.log("✅ Matches traités:", matches);

    return {
      success: true,
      data: matches,
    };
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des matches:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const deleteMatch = async (matchId) => {
  try {
    const matchRef = doc(db, "matches", matchId);
    await deleteDoc(matchRef);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erreur lors de la suppression du match:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============ RECHERCHE UNIVERSELLE ============

export const searchAllCollections = async (searchTerm) => {
  try {
    console.log("🔍 Recherche universelle pour:", searchTerm);

    const results = {
      foundObjects: [],
      lostObjects: [],
      owners: [],
      matches: [],
    };

    const searchLower = searchTerm.toLowerCase();

    // Recherche dans les objets trouvés
    const foundRef = collection(db, "foundObjects");
    const foundSnapshot = await getDocs(foundRef);
    foundSnapshot.forEach((doc) => {
      const data = doc.data();
      const searchableFields = [
        data.ref,
        data.description,
        data.type,
        data.location,
        data.additionalDetails,
      ].filter(Boolean);

      if (
        searchableFields.some((field) =>
          String(field).toLowerCase().includes(searchLower)
        )
      ) {
        results.foundObjects.push({ id: doc.id, ...data });
      }
    });

    // Recherche dans les objets perdus
    const lostRef = collection(db, "lostObjects");
    const lostSnapshot = await getDocs(lostRef);
    lostSnapshot.forEach((doc) => {
      const data = doc.data();
      const searchableFields = [
        data.ref,
        data.description,
        data.type,
        data.location,
        data.additionalDetails,
        data.ownerId,
      ].filter(Boolean);

      if (
        searchableFields.some((field) =>
          String(field).toLowerCase().includes(searchLower)
        )
      ) {
        results.lostObjects.push({ id: doc.id, ...data });
      }
    });

    // Recherche dans les propriétaires (ownersData)
    const ownersRef = collection(db, "ownersData");
    const ownersSnapshot = await getDocs(ownersRef);
    ownersSnapshot.forEach((doc) => {
      const data = doc.data();
      const searchableFields = [
        data.firstName,
        data.lastName,
        data.email,
        data.phone,
        data.PNR,
      ].filter(Boolean);

      if (
        searchableFields.some((field) =>
          String(field).toLowerCase().includes(searchLower)
        )
      ) {
        results.owners.push({ id: doc.id, ...data });
      }
    });

    // Recherche dans les matches
    const matchesRef = collection(db, "matches");
    const matchesSnapshot = await getDocs(matchesRef);
    matchesSnapshot.forEach((doc) => {
      const data = doc.data();
      const searchableFields = [data.foundId, data.lostId, data.userId].filter(
        Boolean
      );

      if (
        searchableFields.some((field) =>
          String(field).toLowerCase().includes(searchLower)
        )
      ) {
        results.matches.push({ id: doc.id, ...data });
      }
    });

    console.log("🔍 Résultats de recherche:", results);

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    console.error("❌ Erreur lors de la recherche universelle:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============ STATISTIQUES ============
export const getDashboardStats = async () => {
  try {
    console.log("🔄 Calcul des statistiques...");

    // Compter les objets trouvés
    const foundRef = collection(db, "foundObjects");
    const foundSnapshot = await getDocs(foundRef);
    const totalFound = foundSnapshot.size;

    // Compter les objets perdus
    const lostRef = collection(db, "lostObjects");
    const lostSnapshot = await getDocs(lostRef);
    const totalLost = lostSnapshot.size;

    // Compter les propriétaires depuis ownersData
    const ownersRef = collection(db, "ownersData");
    const ownersSnapshot = await getDocs(ownersRef);
    const totalOwners = ownersSnapshot.size;

    // Compter les matches acceptés
    const matchesRef = collection(db, "matches");
    const matchesQuery = query(matchesRef, where("status", "==", "accepted"));
    const matchesSnapshot = await getDocs(matchesQuery);
    const totalMatches = matchesSnapshot.size;

    const stats = {
      totalFound,
      totalLost,
      totalOwners,
      totalMatches,
      totalObjects: totalFound + totalLost,
    };

    console.log("📊 Statistiques calculées:", stats);

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error("❌ Erreur lors du calcul des statistiques:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============ FONCTIONS UTILITAIRES ============

export const getObjectById = async (collectionName, objectId) => {
  try {
    const objectRef = doc(db, collectionName, objectId);
    const docSnap = await getDoc(objectRef);

    if (docSnap.exists()) {
      return {
        success: true,
        data: { id: docSnap.id, ...docSnap.data() },
      };
    } else {
      return {
        success: false,
        error: "Document non trouvé",
      };
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de l'objet:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const updateObjectStatus = async (
  collectionName,
  objectId,
  newStatus
) => {
  try {
    const objectRef = doc(db, collectionName, objectId);
    await updateDoc(objectRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const batchUpdateObjects = async (updates) => {
  try {
    const batch = writeBatch(db);

    updates.forEach(({ collectionName, objectId, data }) => {
      const objectRef = doc(db, collectionName, objectId);
      batch.update(objectRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour en lot:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
