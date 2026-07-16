import ringImg from "@/assets/product-ring.jpg";
import necklaceImg from "@/assets/product-necklace.jpg";
import earringsImg from "@/assets/product-earrings.jpg";
import braceletImg from "@/assets/product-bracelet.jpg";

export type Category = "rings" | "earrings" | "neckwear" | "bracelets";

export type Product = {
  id: string;
  name: string;
  price: number;
  category: Category;
  image: string;
  tagline: string;
  description: string;
  isNew?: boolean;
};

export const CATEGORIES: { slug: Category; label: string }[] = [
  { slug: "rings", label: "Rings" },
  { slug: "earrings", label: "Earrings" },
  { slug: "neckwear", label: "Neckwear" },
  { slug: "bracelets", label: "Bracelets" },
];

export const PRODUCTS: Product[] = [
  {
    id: "eternity-band",
    name: "Aria Eternity Band",
    price: 4899,
    category: "rings",
    image: ringImg,
    tagline: "Hallmarked 925 silver · Brilliant cut",
    description:
      "A slim eternity band set with a continuous halo of brilliant-cut stones. Rhodium plated to protect the sterling silver finish and keep every facet radiant.",
  },
  {
    id: "solitaire-teardrop",
    name: "Luna Teardrop Pendant",
    price: 3599,
    category: "neckwear",
    image: necklaceImg,
    tagline: "Halo teardrop · 18\" chain",
    description:
      "A softly weighted teardrop pendant framed by a delicate halo, suspended on an adjustable 18-inch cable chain in polished 925 sterling silver.",
    isNew: true,
  },
  {
    id: "classic-studs",
    name: "Éclat Solitaire Studs",
    price: 1899,
    category: "earrings",
    image: earringsImg,
    tagline: "4-prong · Everyday classic",
    description:
      "The everyday studs — a pair of round brilliant solitaires held in four-prong settings, secured with butterfly backs. Understated, endlessly versatile.",
  },
  {
    id: "tennis-bracelet",
    name: "Reverie Tennis Bracelet",
    price: 6299,
    category: "bracelets",
    image: braceletImg,
    tagline: "Continuous line · Box clasp",
    description:
      "A continuous line of prong-set stones flows around the wrist, secured by a discreet box clasp with a safety catch for confident everyday wear.",
    isNew: true,
  },
  {
    id: "signet-ring",
    name: "Monde Signet Ring",
    price: 2799,
    category: "rings",
    image: ringImg,
    tagline: "Modern signet · Polished",
    description: "A quietly modern signet with a softly cushioned face, hand-polished to a mirror finish.",
  },
  {
    id: "drop-earrings",
    name: "Sable Drop Earrings",
    price: 2499,
    category: "earrings",
    image: earringsImg,
    tagline: "Twin stone · Push back",
    description: "Twin-stone drops that catch the light with every turn of the head. Push-back closure.",
  },
  {
    id: "chain-necklace",
    name: "Vera Cable Chain",
    price: 2199,
    category: "neckwear",
    image: necklaceImg,
    tagline: "Layerable · 20\" chain",
    description: "A refined cable chain designed to layer effortlessly with pendants and shorter neckwear.",
  },
  {
    id: "bangle",
    name: "Halo Cuff Bracelet",
    price: 3299,
    category: "bracelets",
    image: braceletImg,
    tagline: "Open cuff · Adjustable",
    description: "A sculpted open cuff with a subtle taper — sits close to the wrist without a clasp.",
  },
];

export const getProduct = (id: string) => PRODUCTS.find((p) => p.id === id);

export const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);