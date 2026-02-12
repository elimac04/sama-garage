// Base de données des marques et modèles de véhicules
export const vehicleBrands = {
  'Audi': ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'R8', 'e-tron'],
  'BMW': ['Série 1', 'Série 2', 'Série 3', 'Série 4', 'Série 5', 'Série 6', 'Série 7', 'Série 8', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4', 'i3', 'i4', 'iX'],
  'Mercedes-Benz': ['Classe A', 'Classe B', 'Classe C', 'Classe E', 'Classe S', 'CLA', 'CLS', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'Classe G', 'EQC', 'EQS'],
  'Toyota': ['Yaris', 'Corolla', 'Camry', 'Avalon', 'Prius', 'RAV4', 'Highlander', 'Land Cruiser', 'Hilux', 'Tundra', 'Tacoma', 'C-HR', 'Supra'],
  'Volkswagen': ['Polo', 'Golf', 'Jetta', 'Passat', 'Arteon', 'Tiguan', 'Touareg', 'T-Cross', 'T-Roc', 'ID.3', 'ID.4'],
  'Peugeot': ['108', '208', '308', '508', '2008', '3008', '5008', 'Rifter', 'Partner', 'Expert'],
  'Renault': ['Twingo', 'Clio', 'Captur', 'Mégane', 'Kadjar', 'Koleos', 'Talisman', 'Scenic', 'Espace', 'Kangoo', 'Master'],
  'Citroën': ['C1', 'C3', 'C3 Aircross', 'C4', 'C5 Aircross', 'C5 X', 'Berlingo', 'SpaceTourer'],
  'Ford': ['Fiesta', 'Focus', 'Mondeo', 'Mustang', 'EcoSport', 'Puma', 'Kuga', 'Edge', 'Explorer', 'Ranger', 'F-150'],
  'Nissan': ['Micra', 'Juke', 'Qashqai', 'X-Trail', 'Leaf', 'GT-R', 'Navara', 'Pathfinder', 'Patrol'],
  'Honda': ['Jazz', 'Civic', 'Accord', 'HR-V', 'CR-V', 'Pilot', 'Odyssey'],
  'Mazda': ['Mazda2', 'Mazda3', 'Mazda6', 'CX-3', 'CX-5', 'CX-30', 'CX-9', 'MX-5'],
  'Hyundai': ['i10', 'i20', 'i30', 'Elantra', 'Tucson', 'Santa Fe', 'Kona', 'Ioniq', 'Nexo'],
  'Kia': ['Picanto', 'Rio', 'Ceed', 'Stonic', 'Sportage', 'Sorento', 'Niro', 'EV6'],
  'Opel': ['Corsa', 'Astra', 'Insignia', 'Crossland', 'Grandland', 'Mokka', 'Combo'],
  'Seat': ['Ibiza', 'Leon', 'Arona', 'Ateca', 'Tarraco'],
  'Skoda': ['Fabia', 'Scala', 'Octavia', 'Superb', 'Kamiq', 'Karoq', 'Kodiaq'],
  'Fiat': ['500', 'Panda', 'Tipo', '500X', '500L'],
  'Jeep': ['Renegade', 'Compass', 'Cherokee', 'Grand Cherokee', 'Wrangler', 'Gladiator'],
  'Land Rover': ['Defender', 'Discovery', 'Discovery Sport', 'Range Rover', 'Range Rover Sport', 'Range Rover Evoque', 'Range Rover Velar'],
  'Volvo': ['V40', 'V60', 'V90', 'S60', 'S90', 'XC40', 'XC60', 'XC90'],
  'Porsche': ['718 Cayman', '718 Boxster', '911', 'Panamera', 'Cayenne', 'Macan', 'Taycan'],
  'Lexus': ['CT', 'IS', 'ES', 'GS', 'LS', 'UX', 'NX', 'RX', 'LC'],
  'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y', 'Cybertruck', 'Roadster'],
  'Jaguar': ['XE', 'XF', 'XJ', 'F-Pace', 'E-Pace', 'I-Pace', 'F-Type'],
  'Alfa Romeo': ['Giulietta', 'Giulia', 'Stelvio', 'Tonale'],
  'Chevrolet': ['Spark', 'Cruze', 'Malibu', 'Camaro', 'Corvette', 'Trax', 'Equinox', 'Traverse', 'Silverado'],
  'Dodge': ['Charger', 'Challenger', 'Durango', 'RAM 1500'],
  'Subaru': ['Impreza', 'Legacy', 'Outback', 'Forester', 'XV', 'WRX'],
  'Mitsubishi': ['Space Star', 'ASX', 'Eclipse Cross', 'Outlander', 'L200'],
  'Suzuki': ['Swift', 'Baleno', 'Vitara', 'S-Cross', 'Jimny'],
  'Dacia': ['Sandero', 'Logan', 'Duster', 'Lodgy', 'Dokker', 'Spring'],
  'Mini': ['Cooper', 'Clubman', 'Countryman', 'Paceman'],
  'Smart': ['ForTwo', 'ForFour'],
};

// Couleurs de véhicules standards
export interface VehicleColor {
  name: string;
  hex: string;
  label: string;
}

export const vehicleColors: VehicleColor[] = [
  { name: 'Blanc', hex: '#FFFFFF', label: 'Blanc' },
  { name: 'Noir', hex: '#000000', label: 'Noir' },
  { name: 'Gris', hex: '#808080', label: 'Gris' },
  { name: 'Argent', hex: '#C0C0C0', label: 'Argent' },
  { name: 'Bleu', hex: '#0047AB', label: 'Bleu' },
  { name: 'Bleu Marine', hex: '#000080', label: 'Bleu Marine' },
  { name: 'Bleu Ciel', hex: '#87CEEB', label: 'Bleu Ciel' },
  { name: 'Rouge', hex: '#DC143C', label: 'Rouge' },
  { name: 'Bordeaux', hex: '#800020', label: 'Bordeaux' },
  { name: 'Vert', hex: '#228B22', label: 'Vert' },
  { name: 'Vert Foncé', hex: '#006400', label: 'Vert Foncé' },
  { name: 'Jaune', hex: '#FFD700', label: 'Jaune' },
  { name: 'Orange', hex: '#FF8C00', label: 'Orange' },
  { name: 'Marron', hex: '#8B4513', label: 'Marron' },
  { name: 'Beige', hex: '#F5F5DC', label: 'Beige' },
  { name: 'Violet', hex: '#8B008B', label: 'Violet' },
  { name: 'Rose', hex: '#FF69B4', label: 'Rose' },
  { name: 'Or', hex: '#FFD700', label: 'Or' },
  { name: 'Bronze', hex: '#CD7F32', label: 'Bronze' },
  { name: 'Champagne', hex: '#F7E7CE', label: 'Champagne' },
];

export const getBrandsList = (): string[] => {
  return Object.keys(vehicleBrands).sort();
};

export const getModelsByBrand = (brand: string): string[] => {
  return vehicleBrands[brand as keyof typeof vehicleBrands] || [];
};
