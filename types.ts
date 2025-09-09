
export enum DesignStyle {
  Modern = "Modern",
  Minimalist = "Minimalist",
  Industrial = "Industrial",
  Scandinavian = "Scandinavian",
  Bohemian = "Bohemian",
  Coastal = "Coastal",
  Farmhouse = "Farmhouse",
}

export enum RoomType {
  LivingRoom = "Living Room",
  Bedroom = "Bedroom",
  Kitchen = "Kitchen",
  DiningRoom = "Dining Room",
  Office = "Home Office",
  Bathroom = "Bathroom",
}

export interface CostOption {
  optionName: string;
  description: string;
  estimatedCostAUD: number;
  suggestedSupplier: string;
}

export interface ComparativeCostItem {
  item: string;
  boundingBox: [number, number, number, number]; // [yMin, xMin, yMax, xMax]
  options: [CostOption, CostOption];
}
