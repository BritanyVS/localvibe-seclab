export type Place = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  location: string;
  vibe: string;
  description: string;
  tags: string[];
  price: string;
  rating: number;
  hours: string;
  image: string;
  featured: boolean;
};

export const places: Place[] = [
  {
    id: "1",
    slug: "cafe-lila",
    name: "Café Lila",
    category: "cafe",
    categoryLabel: "Café de especialidad",
    location: "Guápiles Centro",
    vibe: "Acogedor, lila y dorado",
    description:
      "Espresso de fincas locales, repostería casera y una terraza con hamacas perfecta para leer o trabajar sin apuro.",
    tags: ["café", "espresso", "repostería", "terraza", "lila", "estudiar"],
    price: "₡₡",
    rating: 4.8,
    hours: "7:00 – 19:00",
    image: "https://picsum.photos/seed/cafe-lila/800/600",
    featured: true,
  },
  {
    id: "2",
    slug: "nube-cowork",
    name: "Nube Cowork",
    category: "coworking",
    categoryLabel: "Espacio de co-working",
    location: "Guápiles Centro",
    vibe: "Luminoso, minimalista y enfocado",
    description:
      "Escritorios flotantes, cabinas de llamadas y café ilimitado a dos cuadras del parque central. Membresías diarias disponibles.",
    tags: ["coworking", "wifi", "oficina", "estudiar", "productividad"],
    price: "₡₡",
    rating: 4.7,
    hours: "8:00 – 20:00",
    image: "https://picsum.photos/seed/nube-cowork/800/600",
    featured: true,
  },
  {
    id: "3",
    slug: "raiz-verde",
    name: "Raíz Verde",
    category: "eco",
    categoryLabel: "Tienda ecológica",
    location: "Pocora",
    vibe: "Orgánico, terroso y consciente",
    description:
      "Productos a grano, cosmética natural, ferias de trueque mensuales y un rincón de plantas nativas para tu jardín.",
    tags: ["ecológico", "orgánico", "bulk", "plantas", "sustentable"],
    price: "₡₡",
    rating: 4.9,
    hours: "9:00 – 18:00",
    image: "https://picsum.photos/seed/raiz-verde/800/600",
    featured: true,
  },
  {
    id: "4",
    slug: "la-casona-artesanal",
    name: "La Casona Artesanal",
    category: "artesanía",
    categoryLabel: "Artesanías locales",
    location: "Guápiles Centro",
    vibe: "Rústico, colorido y hecho a mano",
    description:
      "Cestería guaymí, cerámica de la zona y talleres abiertos los sábados donde puedes torner tu propia pieza.",
    tags: ["artesanía", "cerámica", "cesta", "taller", "regalos"],
    price: "₡₡",
    rating: 4.6,
    hours: "9:30 – 17:30",
    image: "https://picsum.photos/seed/casona-artesanal/800/600",
    featured: false,
  },
  {
    id: "5",
    slug: "brunch-dorado",
    name: "Brunch Dorado",
    category: "gastronomía",
    categoryLabel: "Panadería y brunch",
    location: "Cariari",
    vibe: "Cálido, dorado y lento",
    description:
      "Croissants de mantequilla a las 7am, pan de caña recién horneado y brunch de domingo con jazz de fondo.",
    tags: ["brunch", "panadería", "croissant", "desayuno", "familiar"],
    price: "₡₡",
    rating: 4.8,
    hours: "6:30 – 15:00",
    image: "https://picsum.photos/seed/brunch-dorado/800/600",
    featured: true,
  },
  {
    id: "6",
    slug: "jardin-escondido",
    name: "Jardín Escondido",
    category: "experiencias",
    categoryLabel: "Experiencia de jardín",
    location: "Las Rotas, Guápiles",
    vibe: "Silencioso, verde y mágico",
    description:
      "Caminatas guiadas al atardecer, cata de tibicos y cenas bajo las estrellas en un jardín botánico escondido.",
    tags: ["jardín", "naturaleza", "caminata", "cena", "experiencia", "atardecer"],
    price: "₡₡₡",
    rating: 4.9,
    hours: "15:00 – 22:00",
    image: "https://picsum.photos/seed/jardin-escondido/800/600",
    featured: true,
  },
  {
    id: "7",
    slug: "taller-barro-y-fuego",
    name: "Taller Barro y Fuego",
    category: "artesanía",
    categoryLabel: "Cerámica y torno",
    location: "Pocora",
    vibe: "Terroso, artístico y cálido",
    description:
      "Clases de torno para principiantes, horno de leña comunitario y una galería con piezas de alfareros de la zona.",
    tags: ["cerámica", "torno", "taller", "arte", "clases"],
    price: "₡₡₡",
    rating: 4.7,
    hours: "10:00 – 18:00",
    image: "https://picsum.photos/seed/barro-fuego/800/600",
    featured: false,
  },
  {
    id: "8",
    slug: "mercado-nocturno",
    name: "Mercado Nocturno",
    category: "gastronomía",
    categoryLabel: "Experiencia gastronómica",
    location: "Guápiles Centro",
    vibe: "Festivo, brillante y callejero",
    description:
      "Viernes de food trucks, música en vivo, artesanos locales y luces cálidas en el parque hasta las 10pm.",
    tags: ["mercado", "food trucks", "música", "noche", "familiar", "gastronomía"],
    price: "₡₡",
    rating: 4.8,
    hours: "Vie 17:00 – 22:00",
    image: "https://picsum.photos/seed/mercado-nocturno/800/600",
    featured: true,
  },
  {
    id: "9",
    slug: "estudio-lumina",
    name: "Estudio Lumina",
    category: "bienestar",
    categoryLabel: "Yoga y bienestar",
    location: "Cariari",
    vibe: "Sereno, pastel y luminoso",
    description:
      "Yoga al amanecer, círculos de respiración y masajes con aceites botánicos en una casa restaurada con patio interior.",
    tags: ["yoga", "bienestar", "meditación", "masajes", "relajación"],
    price: "₡₡₡",
    rating: 4.9,
    hours: "6:00 – 20:00",
    image: "https://picsum.photos/seed/estudio-lumina/800/600",
    featured: false,
  },
];

export const categories = [
  { id: "todos", label: "Todos" },
  { id: "cafe", label: "Cafés" },
  { id: "coworking", label: "Co-working" },
  { id: "eco", label: "Ecológico" },
  { id: "gastronomía", label: "Gastronomía" },
  { id: "artesanía", label: "Artesanías" },
  { id: "experiencias", label: "Experiencias" },
  { id: "bienestar", label: "Bienestar" },
];
