import heroImage from "@/assets/oterroir-hero.jpg";
import riceImage from "@/assets/riz-collection.jpg";
import cornImage from "@/assets/mais-violet.jpg";
import liqueurImage from "@/assets/liqueurs.jpg";

export type ProductCategory = "RIZ LOCAL" | "MAÏS" | "PRODUITS DU TERROIR" | "LIQUEURS";

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  price: string;
  image: string;
  imagePosition?: string;
};

export const products: Product[] = [
  { id: "riz-danane", name: "Riz Danané", category: "RIZ LOCAL", description: "Un riz local délicat, sélectionné pour son grain et son authenticité.", price: "3 500 FCFA · 5 kg", image: riceImage, imagePosition: "18% 20%" },
  { id: "riz-c10", name: "Riz C10", category: "RIZ LOCAL", description: "Une variété ivoirienne polyvalente pour les recettes du quotidien.", price: "4 000 FCFA · 5 kg", image: riceImage, imagePosition: "50% 18%" },
  { id: "riz-rouge", name: "Riz rouge", category: "RIZ LOCAL", description: "Un grain rouge au caractère généreux et à la présence singulière.", price: "4 500 FCFA · 5 kg", image: riceImage, imagePosition: "84% 20%" },
  { id: "riz-violet", name: "Riz violet", category: "RIZ LOCAL", description: "Une variété rare à la couleur profonde, pour une table remarquable.", price: "5 500 FCFA · 5 kg", image: riceImage, imagePosition: "18% 78%" },
  { id: "riz-brun", name: "Riz brun", category: "RIZ LOCAL", description: "Un riz complet à la texture authentique, simplement valorisé.", price: "5 500 FCFA · 5 kg", image: riceImage, imagePosition: "50% 76%" },
  { id: "riz-noir", name: "Riz noir", category: "RIZ LOCAL", description: "Un riz intense et élégant qui sublime les assiettes créatives.", price: "6 000 FCFA · 5 kg", image: riceImage, imagePosition: "84% 78%" },
  { id: "mais-violet", name: "Poudre de maïs violet", category: "MAÏS", description: "Une poudre locale fine, authentique et inspirante en cuisine.", price: "Prix sur demande", image: cornImage },
  { id: "cola-gorille", name: "Cola de gorille", category: "PRODUITS DU TERROIR", description: "Une découverte traditionnelle issue de la richesse de notre terroir.", price: "Prix sur demande", image: heroImage, imagePosition: "88% 60%" },
  { id: "liqueur-bissap", name: "Liqueur de bissap", category: "LIQUEURS", description: "Une création artisanale aux notes florales et à la robe rubis.", price: "Prix sur demande", image: liqueurImage, imagePosition: "14% 45%" },
  { id: "liqueur-tomi", name: "Liqueur de tomi", category: "LIQUEURS", description: "Une expression originale et raffinée du fruit local.", price: "Prix sur demande", image: liqueurImage, imagePosition: "39% 45%" },
  { id: "liqueur-baobab", name: "Liqueur de baobab", category: "LIQUEURS", description: "Une liqueur artisanale douce et singulière.", price: "Prix sur demande", image: liqueurImage, imagePosition: "61% 45%" },
  { id: "liqueur-gingembre", name: "Gingembre & herbes", category: "LIQUEURS", description: "Une composition vive aux herbes aromatiques soigneusement choisies.", price: "Prix sur demande", image: liqueurImage, imagePosition: "40% 55%" },
  { id: "liqueur-aphrodisiaque", name: "Liqueur aphrodisiaque", category: "LIQUEURS", description: "Une recette artisanale de caractère, réservée aux adultes.", price: "10 000 FCFA", image: liqueurImage, imagePosition: "88% 45%" },
  { id: "liqueur-digestive", name: "Liqueur digestive", category: "LIQUEURS", description: "Une création aromatique artisanale, réservée aux adultes.", price: "5 000 FCFA", image: liqueurImage, imagePosition: "67% 48%" },
];

export const riceProducts = products.filter((product) => product.category === "RIZ LOCAL");
export const galleryImages = [heroImage, riceImage, cornImage, liqueurImage];
