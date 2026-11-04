export interface Dino {
  id: string;
  name: string;
  group: string;
  era: string;
  diet: string;
  side: number;
  bones: number;
  fact: string;
}

export interface Group {
  name: string;
  slug: string;
  blurb: string;
}

export const GROUPS: Group[] = [
  { name: 'Triássico', slug: 'triassico', blurb: 'O começo de tudo' },
  { name: 'Jurássico', slug: 'jurassico', blurb: 'Pescoços longos e placas' },
  { name: 'Cretáceo', slug: 'cretaceo', blurb: 'Chifres, dentes e velas' },
  { name: 'Bônus', slug: 'bonus', blurb: 'Fósseis raros' },
];

export const DINOS: Dino[] = [
  {
    id: 'eoraptor',
    name: 'Eoraptor',
    group: 'Triássico',
    era: 'Triássico',
    diet: 'carnívoro',
    side: 6,
    bones: 4,
    fact: 'Um dos dinossauros mais antigos conhecidos; do tamanho de um cachorro médio.',
  },
  {
    id: 'coelophysis',
    name: 'Coelophysis',
    group: 'Triássico',
    era: 'Triássico',
    diet: 'carnívoro',
    side: 7,
    bones: 6,
    fact: 'Magro e veloz; muitos indivíduos foram encontrados juntos.',
  },
  {
    id: 'plateosaurus',
    name: 'Plateosaurus',
    group: 'Triássico',
    era: 'Triássico',
    diet: 'herbívoro',
    side: 8,
    bones: 8,
    fact: 'Pescoço longo e corpo robusto; um dos primeiros gigantes.',
  },
  {
    id: 'archaeopteryx',
    name: 'Archaeopteryx',
    group: 'Jurássico',
    era: 'Jurássico',
    diet: 'carnívoro',
    side: 8,
    bones: 9,
    fact: 'Ponte entre dinossauros e aves; tinha penas e dentes.',
  },
  {
    id: 'stegosaurus',
    name: 'Stegosaurus',
    group: 'Jurássico',
    era: 'Jurássico',
    diet: 'herbívoro',
    side: 9,
    bones: 11,
    fact: 'Placas ósseas nas costas e espinhos na cauda.',
  },
  {
    id: 'brachiosaurus',
    name: 'Brachiosaurus',
    group: 'Jurássico',
    era: 'Jurássico',
    diet: 'herbívoro',
    side: 10,
    bones: 14,
    fact: 'Pescoço muito longo para alcançar as copas.',
  },
  {
    id: 'velociraptor',
    name: 'Velociraptor',
    group: 'Cretáceo',
    era: 'Cretáceo',
    diet: 'carnívoro',
    side: 9,
    bones: 12,
    fact: 'Pequeno, emplumado e com uma garra curvada em cada pé.',
  },
  {
    id: 'triceratops',
    name: 'Triceratops',
    group: 'Cretáceo',
    era: 'Cretáceo',
    diet: 'herbívoro',
    side: 10,
    bones: 15,
    fact: 'Três chifres e um grande escudo ósseo.',
  },
  {
    id: 'tyrannosaurus',
    name: 'Tyrannosaurus',
    group: 'Cretáceo',
    era: 'Cretáceo',
    diet: 'carnívoro',
    side: 12,
    bones: 20,
    fact: 'Um dos maiores predadores terrestres; mordida poderosa.',
  },
  {
    id: 'ankylosaurus',
    name: 'Ankylosaurus',
    group: 'Bônus',
    era: 'Cretáceo',
    diet: 'herbívoro',
    side: 10,
    bones: 16,
    fact: 'Couraça óssea e clava na cauda.',
  },
  {
    id: 'spinosaurus',
    name: 'Spinosaurus',
    group: 'Bônus',
    era: 'Cretáceo',
    diet: 'carnívoro',
    side: 12,
    bones: 22,
    fact: 'Vela nas costas e hábitos ligados à água.',
  },
  {
    id: 'pteranodon',
    name: 'Pteranodon',
    group: 'Bônus',
    era: 'Cretáceo',
    diet: 'piscívoro',
    side: 12,
    bones: 20,
    fact: 'Não era dinossauro: era um pterossauro voador.',
  },
];
