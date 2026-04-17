import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type PopupAd = {
  id: string;
  title: string;
  message: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
};

const POPUP_ADS_COLLECTION = "popupAds";

const getString = (data: Record<string, unknown>, key: string) => {
  const value = data[key];
  return typeof value === "string" ? value : "";
};

const getOptionalString = (data: Record<string, unknown>, key: string) => {
  const value = data[key];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
};

const getNumber = (data: Record<string, unknown>, key: string) => {
  const value = data[key];
  return typeof value === "number" ? value : 0;
};

const mapDocToPopupAd = (id: string, data: Record<string, unknown>): PopupAd => ({
  id,
  title: getString(data, "title"),
  message: getString(data, "message"),
  imageUrl: getOptionalString(data, "imageUrl"),
  ctaText: getOptionalString(data, "ctaText"),
  ctaUrl: getOptionalString(data, "ctaUrl"),
  active: Boolean(data.active),
  createdAt: getNumber(data, "createdAt"),
  updatedAt: getNumber(data, "updatedAt"),
});

const deactivateActiveAds = async () => {
  const activeQuery = query(
    collection(db, POPUP_ADS_COLLECTION),
    where("active", "==", true)
  );
  const activeDocs = await getDocs(activeQuery);

  const now = Date.now();
  await Promise.all(
    activeDocs.docs.map((entry) =>
      updateDoc(doc(db, POPUP_ADS_COLLECTION, entry.id), {
        active: false,
        updatedAt: now,
      })
    )
  );
};

export const listPopupAds = async () => {
  const adsQuery = query(
    collection(db, POPUP_ADS_COLLECTION),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(adsQuery);
  return snapshot.docs.map((entry) => mapDocToPopupAd(entry.id, entry.data()));
};

export const getActivePopupAd = async () => {
  const activeQuery = query(
    collection(db, POPUP_ADS_COLLECTION),
    where("active", "==", true)
  );
  const snapshot = await getDocs(activeQuery);
  if (snapshot.empty) return null;

  const docs = snapshot.docs
    .map((entry) => mapDocToPopupAd(entry.id, entry.data()))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const entry = docs[0];
  return entry;
};

export const createPopupAd = async (input: {
  title: string;
  message: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  active: boolean;
}) => {
  const now = Date.now();

  if (input.active) {
    await deactivateActiveAds();
  }

  const docRef = await addDoc(collection(db, POPUP_ADS_COLLECTION), {
    title: input.title,
    message: input.message,
    imageUrl: input.imageUrl ?? null,
    ctaText: input.ctaText ?? null,
    ctaUrl: input.ctaUrl ?? null,
    active: input.active,
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
};

export const setPopupAdActive = async (id: string, active: boolean) => {
  const now = Date.now();

  if (active) {
    await deactivateActiveAds();
  }

  await updateDoc(doc(db, POPUP_ADS_COLLECTION, id), {
    active,
    updatedAt: now,
  });
};

export const deletePopupAd = async (id: string) => {
  await deleteDoc(doc(db, POPUP_ADS_COLLECTION, id));
};